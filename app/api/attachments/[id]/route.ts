import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAttachmentById, deleteAttachment } from "@/services/attachmentService";
import { deleteFile as deleteDriveFile, getFile, getFileStream } from "@/services/supabaseStorageService";
import { hasRole } from "@/services/userRoleService";

export const dynamic = "force-dynamic";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

/**
 * GET /api/attachments/[id]
 * Download file from Google Drive
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Please login" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const attachmentId = parseInt(id, 10);

        if (isNaN(attachmentId)) {
            return NextResponse.json(
                { success: false, error: "Invalid attachment ID" },
                { status: 400 }
            );
        }

        // Get attachment from database
        const attachment = await getAttachmentById(attachmentId);
        if (!attachment) {
            return NextResponse.json(
                { success: false, error: "Attachment not found" },
                { status: 404 }
            );
        }

        // Get file from Google Drive
        const driveFileId = attachment.fileUrl; // fileUrl stores Drive file ID

        try {
            // Get file metadata
            const driveFile = await getFile(driveFileId);

            // Get file stream
            const fileStream = await getFileStream(driveFileId);

            // Convert Node.js stream to Web ReadableStream
            const webStream = new ReadableStream({
                start(controller) {
                    fileStream.on("data", (chunk: Buffer) => {
                        controller.enqueue(new Uint8Array(chunk));
                    });
                    fileStream.on("end", () => {
                        controller.close();
                    });
                    fileStream.on("error", (err: any) => {
                        console.error("Stream error:", err);
                        controller.error(err);
                    });
                },
            });

            // Return file with appropriate headers
            return new NextResponse(webStream, {
                headers: {
                    "Content-Type": attachment.fileType || "application/octet-stream",
                    "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
                },
            });
        } catch (error) {
            console.error("Google Drive download error:", error);
            return NextResponse.json(
                { success: false, error: "Failed to download file from Google Drive" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Download error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to download file",
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/attachments/[id]
 * Delete file from Google Drive and database
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Please login" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const attachmentId = parseInt(id, 10);

        if (isNaN(attachmentId)) {
            return NextResponse.json(
                { success: false, error: "Invalid attachment ID" },
                { status: 400 }
            );
        }

        // Get attachment from database
        const attachment = await getAttachmentById(attachmentId);
        if (!attachment) {
            return NextResponse.json(
                { success: false, error: "Attachment not found" },
                { status: 404 }
            );
        }

        // Check permission (owner or admin)
        const isAdmin = await hasRole(user.id, "ADMIN");
        const isOwner = attachment.uploadedById === user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json(
                { success: false, error: "You don't have permission to delete this file" },
                { status: 403 }
            );
        }

        const driveFileId = attachment.fileUrl;

        try {
            // Delete from Google Drive
            await deleteDriveFile(driveFileId);
        } catch (error) {
            console.error("Failed to delete from Google Drive:", error);
            // Continue to delete from database even if Drive deletion fails
        }

        // Delete from database
        await deleteAttachment(attachmentId);

        return NextResponse.json({
            success: true,
            message: "File deleted successfully",
        });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to delete file",
            },
            { status: 500 }
        );
    }
}
