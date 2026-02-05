import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAttachmentById, deleteAttachment } from "@/services/attachmentService";
import { deleteFile as deleteDriveFile, getFile, getFileStream } from "@/services/supabaseStorageService";
import { hasRole } from "@/services/userRoleService";
import db from "@/lib/db";

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

        // Check permission (Project Owner or Admin)
        const isAdmin = await hasRole(user.id, "ADMIN");
        // We need to check if the user is the owner of the PROJECT, not just the file uploader
        // The getAttachmentById already includes project: { id, code, ... } but we need ownerUserId
        // So we might need to fetch project or update the service.
        // Let's check what getAttachmentById returns.
        // Looking at src/services/attachmentService.ts, getAttachmentById includes:
        // project: { select: { id: true, name: true, code: true } } -> It does NOT select ownerUserId.

        // We either update the service to return ownerUserId or we fetch the project. 
        // Updating the service is better for reuse. But for now, let's just fetch project entitlement.

        // Wait, I can't modify the service easily in this replace block without context of the service file.
        // I will use prisma directly here or use getProjectById? 
        // Better: let's update this file to import db and check project ownership directly or use getProjectById.
        // Actually, let's look at getAttachmentById in service again. 
        // It's cleaner to update the service to include ownerUserId in the project include.

        // FOR NOW: I will just fetch the project to check ownership.
        const isAdminCheck = isAdmin;
        // Re-fetching project to get owner
        const project = await db.project.findUnique({
            where: { id: attachment.projectId },
            select: { ownerUserId: true }
        });

        const isProjectOwner = project?.ownerUserId === user.id;

        if (!isAdminCheck && !isProjectOwner) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Only Project Owner or Admin can delete attachments" },
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
