import db from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Create a new attachment record
 */
export async function createAttachment(data: Prisma.ProjectAttachmentUncheckedCreateInput) {
    try {
        const attachment = await db.projectAttachment.create({
            data,
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                report: {
                    select: {
                        id: true,
                        fiscalYear: true,
                        periodType: true,
                    },
                },
            },
        });

        return attachment;
    } catch (error) {
        console.error("Create attachment error:", error);
        throw new Error("Failed to create attachment record");
    }
}

/**
 * Get attachment by ID
 */
export async function getAttachmentById(id: number) {
    try {
        const attachment = await db.projectAttachment.findUnique({
            where: { id },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                report: {
                    select: {
                        id: true,
                        fiscalYear: true,
                        periodType: true,
                    },
                },
            },
        });

        return attachment;
    } catch (error) {
        console.error("Get attachment error:", error);
        throw new Error("Failed to get attachment");
    }
}

/**
 * Get all attachments for a project
 */
export async function getAttachmentsByProject(projectId: number) {
    try {
        const attachments = await db.projectAttachment.findMany({
            where: { projectId },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                uploadedAt: "desc",
            },
        });

        return attachments;
    } catch (error) {
        console.error("Get project attachments error:", error);
        throw new Error("Failed to get project attachments");
    }
}

/**
 * Get all attachments for a report
 */
export async function getAttachmentsByReport(reportId: number) {
    try {
        const attachments = await db.projectAttachment.findMany({
            where: { reportId },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                uploadedAt: "desc",
            },
        });

        return attachments;
    } catch (error) {
        console.error("Get report attachments error:", error);
        throw new Error("Failed to get report attachments");
    }
}

/**
 * Delete an attachment record
 */
export async function deleteAttachment(id: number) {
    try {
        await db.projectAttachment.delete({
            where: { id },
        });
    } catch (error) {
        console.error("Delete attachment error:", error);
        throw new Error("Failed to delete attachment");
    }
}

/**
 * Update attachment metadata
 */
export async function updateAttachment(id: number, data: Prisma.ProjectAttachmentUpdateInput) {
    try {
        const attachment = await db.projectAttachment.update({
            where: { id },
            data,
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        return attachment;
    } catch (error) {
        console.error("Update attachment error:", error);
        throw new Error("Failed to update attachment");
    }
}

/**
 * Get attachment count for a project
 */
export async function getProjectAttachmentCount(projectId: number): Promise<number> {
    try {
        const count = await db.projectAttachment.count({
            where: { projectId },
        });

        return count;
    } catch (error) {
        console.error("Get attachment count error:", error);
        return 0;
    }
}

/**
 * Get attachment count for a report
 */
export async function getReportAttachmentCount(reportId: number): Promise<number> {
    try {
        const count = await db.projectAttachment.count({
            where: { reportId },
        });

        return count;
    } catch (error) {
        console.error("Get report attachment count error:", error);
        return 0;
    }
}
