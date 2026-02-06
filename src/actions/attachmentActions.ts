"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
    getAttachmentsByProject,
    getAttachmentsByReport,
    getAttachmentById,
} from "@/services/attachmentService";

export async function getProjectAttachmentsAction(projectId: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        const attachments = await getAttachmentsByProject(projectId);

        return {
            success: true,
            data: attachments,
        };
    } catch (error) {
        console.error("Get project attachments error:", error);
        return {
            success: false,
            error: "Failed to fetch project attachments",
        };
    }
}

export async function getReportAttachmentsAction(reportId: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        const attachments = await getAttachmentsByReport(reportId);

        return {
            success: true,
            data: attachments,
        };
    } catch (error) {
        console.error("Get report attachments error:", error);
        return {
            success: false,
            error: "Failed to fetch report attachments",
        };
    }
}

export async function getAttachmentAction(id: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        const attachment = await getAttachmentById(id);

        if (!attachment) {
            return {
                success: false,
                error: "Attachment not found",
            };
        }

        return {
            success: true,
            data: attachment,
        };
    } catch (error) {
        console.error("Get attachment error:", error);
        return {
            success: false,
            error: "Failed to fetch attachment",
        };
    }
}

export async function deleteAttachmentAction(id: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        const attachment = await getAttachmentById(id);
        if (!attachment) {
            return {
                success: false,
                error: "Attachment not found",
            };
        }

        // Permission Check: Project Owner or Admin
        const { hasRole } = await import("@/services/userRoleService");
        const isAdmin = await hasRole(user.id, "ADMIN");

        // Fetch project to check ownership (need db import)
        const { default: db } = await import("@/lib/db");
        // We can trust getAttachmentById to return projectId correctly? Yes.
        // It returns attachment with project relation, but let's just query project owner manually to be safe/consistent
        // actually attachment.project is included in getAttachmentById but only id/name/code.
        // So we verify ownership again.

        const project = await db.project.findUnique({
            where: { id: attachment.projectId },
            select: { ownerUserId: true }
        });

        const isProjectOwner = project?.ownerUserId === user.id;

        if (!isAdmin && !isProjectOwner) {
            return {
                success: false,
                error: "Unauthorized: Only Project Owner or Admin can delete attachments",
            };
        }

        // Delete from Storage
        const { deleteFile } = await import("@/services/supabaseStorageService");
        try {
            await deleteFile(attachment.fileUrl);
        } catch (storageError) {
            console.error("Failed to delete from storage:", storageError);
            // Proceed to delete DB record anyway? standard practice is often "yes" to avoid orphans
        }

        // Delete from Database
        await import("@/services/attachmentService").then(m => m.deleteAttachment(id));

        // Audit Log
        const { createAuditLog } = await import("@/lib/audit");
        await createAuditLog({
            action: "DELETE",
            entityType: "Attachment",
            entityId: id,
            userId: user.id,
            diffBefore: attachment,
            description: `Deleted attachment ${attachment.fileName} from project ID ${attachment.projectId}`
        });

        // Revalidate
        revalidatePath("/projects");
        revalidatePath("/reports");

        return {
            success: true,
            message: "File deleted successfully",
        };

    } catch (error) {
        console.error("Delete attachment error:", error);
        return {
            success: false,
            error: "Failed to delete attachment",
        };
    }
}
