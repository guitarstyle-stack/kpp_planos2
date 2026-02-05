import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile, validateFile } from "@/services/supabaseStorageService";
import { createAttachment } from "@/services/attachmentService";

export const dynamic = "force-dynamic";

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

        // Parse formData directly
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const projectIdStr = formData.get("projectId") as string | null;
        const reportIdStr = formData.get("reportId") as string | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file uploaded" },
                { status: 400 }
            );
        }

        const projectId = projectIdStr ? parseInt(projectIdStr, 10) : 0;
        const reportId = reportIdStr ? parseInt(reportIdStr, 10) : undefined;

        // Validate projectId (required)
        if (!projectId || isNaN(projectId)) {
            return NextResponse.json(
                { success: false, error: "Project ID is required" },
                { status: 400 }
            );
        }

        const filename = file.name || "unnamed";
        const mimeType = file.type || "application/octet-stream";
        const fileSize = file.size;

        // Validate file
        const validation = validateFile(filename, mimeType, fileSize);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        // Convert file to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase
        const storedFile = await uploadFile({
            buffer,
            filename,
            mimeType,
        });

        // Create attachment record in database
        const attachment = await createAttachment({
            fileName: storedFile.name,
            fileUrl: storedFile.id, // Storing store path/ID as before
            fileType: mimeType,
            projectId,
            reportId,
            uploadedById: user.id,
        });

        return NextResponse.json({
            success: true,
            data: {
                attachment,
                driveFile: storedFile, // Maintain API response shape
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
