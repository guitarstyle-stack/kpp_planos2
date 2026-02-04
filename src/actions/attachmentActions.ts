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

        // Deletion logic is handled in the API route
        // This action triggers revalidation after deletion
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/attachments/${id}`, {
            method: "DELETE",
        });

        const result = await response.json();

        if (result.success) {
            // Revalidate relevant paths
            revalidatePath("/projects");
            revalidatePath("/reports");
        }

        return result;
    } catch (error) {
        console.error("Delete attachment error:", error);
        return {
            success: false,
            error: "Failed to delete attachment",
        };
    }
}
