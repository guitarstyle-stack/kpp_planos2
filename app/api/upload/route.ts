import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile, validateFile } from "@/services/googleDriveService";
import { createAttachment } from "@/services/attachmentService";
import formidable from "formidable";
import { Readable } from "stream";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

// Disable body parser for file uploads
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper: Convert NextRequest to Node.js IncomingMessage
async function parseFormData(req: NextRequest) {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
        throw new Error("Content type must be multipart/form-data");
    }

    // Get the request body as a buffer
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a readable stream from the buffer
    const readable = Readable.from(buffer);

    // Create formidable form
    const form = formidable({
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowEmptyFiles: false,
        minFileSize: 1,
    });

    return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
        // Cast readable to any to satisfy formidable's type requirements
        form.parse(readable as any, (err, fields, files) => {
            if (err) {
                reject(err);
            } else {
                resolve({ fields, files });
            }
        });
    });
}

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Please login" },
                { status: 401 }
            );
        }

        // Parse multipart form data
        const { fields, files } = await parseFormData(req);

        // Get the uploaded file
        const fileArray = files.file;
        if (!fileArray || (Array.isArray(fileArray) && fileArray.length === 0)) {
            return NextResponse.json(
                { success: false, error: "No file uploaded" },
                { status: 400 }
            );
        }

        const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

        // Read file content
        const fileBuffer = await fs.readFile(file.filepath);
        const filename = file.originalFilename || "unnamed";
        const mimeType = file.mimetype || "application/octet-stream";
        const fileSize = file.size;

        // Validate file
        const validation = validateFile(filename, mimeType, fileSize);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uniqueFilename = `${timestamp}_${sanitizedName}`;

        // Upload to Google Drive
        const driveFile = await uploadFile({
            buffer: fileBuffer,
            filename: uniqueFilename,
            mimeType,
        });

        // Get metadata from fields
        const projectIdStr = Array.isArray(fields.projectId) ? fields.projectId[0] : fields.projectId;
        const reportIdStr = Array.isArray(fields.reportId) ? fields.reportId[0] : fields.reportId;

        const projectId = projectIdStr ? parseInt(projectIdStr, 10) : 0;
        const reportId = reportIdStr ? parseInt(reportIdStr, 10) : undefined;

        // Validate projectId (required)
        if (!projectId || isNaN(projectId)) {
            return NextResponse.json(
                { success: false, error: "Project ID is required" },
                { status: 400 }
            );
        }

        // Create attachment record in database
        const attachment = await createAttachment({
            fileName: sanitizedName,
            fileUrl: driveFile.id, // Store Google Drive file ID
            fileType: mimeType,
            projectId,
            reportId,
            uploadedById: user.id,
        });

        // Clean up temporary file
        await fs.unlink(file.filepath).catch((err) => {
            console.warn("Failed to delete temp file:", err);
        });

        return NextResponse.json({
            success: true,
            data: {
                attachment,
                driveFile,
            },
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to upload file",
            },
            { status: 500 }
        );
    }
}
