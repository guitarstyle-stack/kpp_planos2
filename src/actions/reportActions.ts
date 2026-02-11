"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/services/userRoleService";
import { createAuditLog } from "@/lib/audit";
import { getReportById } from "@/services/reportService";

const ReportSchema = z.object({
    projectId: z.coerce.number(),
    fiscalYear: z.coerce.number(),
    periodType: z.string().min(1, "กรุณาเลือกรอบรายงาน"),
    summary: z.string().optional(),
    issues: z.string().optional(),
    resolutionPlan: z.string().optional(),
    overallProgressPercent: z.coerce.number().min(0).optional(),

    // Budget tracking fields
    budgetSpentInPeriod: z.coerce.number().optional(),
    budgetSpentCumulative: z.coerce.number().optional(),
    budgetProgressPercent: z.coerce.number().min(0).optional(),

    // KPI tracking fields
    kpiAchievedCount: z.coerce.number().min(0).optional(),
    kpiTotalCount: z.coerce.number().min(0).optional(),
    kpiAchievementPercent: z.coerce.number().min(0).optional(),

    newAttachmentIds: z.string().optional(), // JSON string of IDs
});

// Helper to determine report priority
const PERIOD_ORDER: Record<string, number> = {
    "MID_6M": 1,
    "MID_9M": 2,
    "FULL_12M": 3,
};

async function syncProjectWithLatestReport(tx: any, projectId: number) {
    // Find ALL reports for this project to determine the "True Latest" by calendar
    const reports = await tx.report.findMany({
        where: { projectId },
        orderBy: [
            { fiscalYear: 'desc' },
        ],
    });

    console.log(`[Sync] Project: ${projectId}, Reports remaining: ${reports.length}`);

    if (reports.length === 0) {
        console.log(`[Sync] No reports left for project ${projectId}. Resetting to NOT_STARTED.`);
        await tx.project.update({
            where: { id: projectId },
            data: {
                status: "NOT_STARTED",
                progressPercent: 0,
                budgetSpent: 0,
                lastReportedAt: null
            }
        });
        return;
    }

    // Sort by fiscalYear desc, then periodType priority desc
    const sortedReports = reports.sort((a: any, b: any) => {
        if (a.fiscalYear !== b.fiscalYear) return b.fiscalYear - a.fiscalYear;
        const orderA = PERIOD_ORDER[a.periodType] || 0;
        const orderB = PERIOD_ORDER[b.periodType] || 0;
        return orderB - orderA;
    });

    const latest = sortedReports[0];

    // Calculate status
    let calculatedProgress = latest.overallProgressPercent || 0;
    if (!calculatedProgress && latest.budgetProgressPercent) {
        calculatedProgress = latest.budgetProgressPercent;
    } else if (!calculatedProgress && latest.kpiAchievementPercent) {
        calculatedProgress = latest.kpiAchievementPercent;
    }

    let newStatus = "NOT_STARTED";
    if (calculatedProgress > 0 && calculatedProgress < 100) {
        newStatus = "IN_PROGRESS";
    } else if (calculatedProgress >= 100) {
        newStatus = "COMPLETED";
    }

    console.log(`[Sync] Project ${projectId} updated. Status: ${newStatus}, Progress: ${Math.round(calculatedProgress)}%`);

    await tx.project.update({
        where: { id: projectId },
        data: {
            budgetSpent: latest.budgetSpentCumulative || 0,
            progressPercent: Math.round(calculatedProgress),
            status: newStatus,
            lastReportedAt: latest.createdAt,
        },
    });
}

export async function createReportAction(prevState: any, formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { message: "กรุณาเข้าสู่ระบบ" };
        }

        const projectId = Number(formData.get("projectId"));

        // Permission Check
        const isAdmin = await hasRole(user.id, "ADMIN");
        if (!isAdmin) {
            const project = await db.project.findUnique({
                where: { id: projectId },
                select: { departmentId: true, ownerUserId: true }
            });

            if (!project) return { message: "Project not found" };

            // Allow if user owns project OR matches department
            const matchesDepartment = user.departmentId === project.departmentId;
            const isOwner = user.id === project.ownerUserId;

            if (!matchesDepartment && !isOwner) {
                return { message: "ไม่มีสิทธิ์สร้างรายงานสำหรับโครงการต่างหน่วยงาน" };
            }
        }

        const rawData = {
            projectId: formData.get("projectId"),
            fiscalYear: formData.get("fiscalYear"),
            periodType: formData.get("periodType"),
            summary: formData.get("summary"),
            issues: formData.get("issues"),
            resolutionPlan: formData.get("resolutionPlan"),
            overallProgressPercent: formData.get("overallProgressPercent"),

            // Budget fields
            budgetSpentInPeriod: formData.get("budgetSpentInPeriod"),
            budgetSpentCumulative: formData.get("budgetSpentCumulative"),
            budgetProgressPercent: formData.get("budgetProgressPercent"),

            // KPI fields
            kpiAchievedCount: formData.get("kpiAchievedCount"),
            kpiTotalCount: formData.get("kpiTotalCount"),
            kpiAchievementPercent: formData.get("kpiAchievementPercent"),
        };

        const indicatorResultsRaw = formData.get("indicatorResults");
        const indicatorResults = indicatorResultsRaw ? JSON.parse(indicatorResultsRaw as string) : [];

        const validatedData = ReportSchema.parse(rawData);

        // Create report within a transaction to ensure all results are saved
        await db.$transaction(async (tx) => {
            const report = await tx.report.create({
                data: {
                    ...validatedData,
                    createdById: user.id,
                },
            });

            if (indicatorResults.length > 0) {
                await tx.reportIndicatorResult.createMany({
                    data: indicatorResults.map((res: any) => ({
                        reportId: report.id,
                        indicatorId: res.indicatorId,
                        actualValue: res.actualValue,
                        achievementPercent: res.achievementPercent,
                    })),
                });
            }

            // Link Attachments
            if (validatedData.newAttachmentIds) {
                const attachmentIds = JSON.parse(validatedData.newAttachmentIds) as number[];
                if (attachmentIds.length > 0) {
                    await tx.projectAttachment.updateMany({
                        where: { id: { in: attachmentIds } },
                        data: { reportId: report.id }
                    });
                }
            }

            // Update project with latest report data
            await syncProjectWithLatestReport(tx, validatedData.projectId);

            // Audit Log

            // Audit Log
            const targetProject = await tx.project.findUnique({
                where: { id: validatedData.projectId },
                select: { name: true }
            });

            await createAuditLog({
                action: "CREATE",
                entityType: "Report",
                entityId: report.id,
                userId: user.id,
                diffAfter: report,
                description: `Created report for project ${targetProject?.name || validatedData.projectId} (Period: ${validatedData.periodType})`
            });
        });

        revalidatePath("/reports");
        revalidatePath("/projects");
        revalidatePath(`/projects/${validatedData.projectId}`);
        revalidatePath("/dashboard");
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to create report" };
    }
}

export async function updateReportAction(id: number, formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { message: "กรุณาเข้าสู่ระบบ" };
        }

        const report = await db.report.findUnique({
            where: { id },
            include: { project: { select: { name: true, departmentId: true, ownerUserId: true } } }
        });

        if (!report) return { message: "Report not found" };

        // Permission Check
        const isAdmin = await hasRole(user.id, "ADMIN");
        if (!isAdmin) {
            const matchesDepartment = user.departmentId === report.project.departmentId;
            const isOwner = user.id === report.project.ownerUserId;

            if (!matchesDepartment && !isOwner) {
                return { message: "ไม่มีสิทธิ์แก้ไขรายงานนี้" };
            }
        }

        const rawData = {
            projectId: formData.get("projectId"),
            fiscalYear: formData.get("fiscalYear"),
            periodType: formData.get("periodType"),
            summary: formData.get("summary"),
            issues: formData.get("issues"),
            resolutionPlan: formData.get("resolutionPlan"),
            overallProgressPercent: formData.get("overallProgressPercent"),

            // Budget fields
            budgetSpentInPeriod: formData.get("budgetSpentInPeriod"),
            budgetSpentCumulative: formData.get("budgetSpentCumulative"),
            budgetProgressPercent: formData.get("budgetProgressPercent"),

            // KPI fields
            kpiAchievedCount: formData.get("kpiAchievedCount"),
            kpiTotalCount: formData.get("kpiTotalCount"),
            kpiAchievementPercent: formData.get("kpiAchievementPercent"),
        };

        const indicatorResultsRaw = formData.get("indicatorResults");
        const indicatorResults = indicatorResultsRaw ? JSON.parse(indicatorResultsRaw as string) : [];

        const validatedData = ReportSchema.parse(rawData);

        await db.$transaction(async (tx) => {
            // 1. Update the Report itself
            await tx.report.update({
                where: { id },
                data: validatedData,
            });

            // 2. Update Indicator Results
            if (indicatorResults.length > 0) {
                // Delete old results and set new ones
                await tx.reportIndicatorResult.deleteMany({
                    where: { reportId: id }
                });

                await tx.reportIndicatorResult.createMany({
                    data: indicatorResults.map((res: any) => ({
                        reportId: id,
                        indicatorId: res.indicatorId,
                        actualValue: res.actualValue,
                        achievementPercent: res.achievementPercent,
                    })),
                });
            }

            // 3. Link New Attachments
            if (validatedData.newAttachmentIds) {
                const attachmentIds = JSON.parse(validatedData.newAttachmentIds) as number[];
                if (attachmentIds.length > 0) {
                    await tx.projectAttachment.updateMany({
                        where: { id: { in: attachmentIds } },
                        data: { reportId: id }
                    });
                }
            }

            // 4. Sync Project Status (Always recalculate to find the true latest)
            await syncProjectWithLatestReport(tx, Number(validatedData.projectId));

            // Audit Log

            // Audit Log
            await createAuditLog({
                action: "UPDATE",
                entityType: "Report",
                entityId: id,
                userId: user.id,
                diffBefore: report,
                diffAfter: validatedData,
                description: `Updated report for project ${report.project.name} (Period: ${validatedData.periodType})`
            });
        });

        revalidatePath("/reports");
        revalidatePath("/projects");
        revalidatePath(`/projects/${report.projectId}`);
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to update report" };
    }
}


export async function deleteReportAction(id: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { message: "กรุณาเข้าสู่ระบบ" };
        }

        const report = await db.report.findUnique({
            where: { id },
            include: { project: { select: { name: true, departmentId: true, ownerUserId: true } } }
        });

        if (!report) return { message: "Report not found" };

        // Permission Check
        const isAdmin = await hasRole(user.id, "ADMIN");
        if (!isAdmin) {
            const isProjectOwner = user.id === report.project.ownerUserId;
            const isReportCreator = user.id === report.createdById;

            if (!isProjectOwner && !isReportCreator) {
                return { message: "ไม่มีสิทธิ์ลบรายงานนี้ (ต้องเป็นเจ้าของโครงการ, ผู้สร้างรายงาน หรือ Admin)" };
            }
        }

        await db.$transaction(async (tx) => {
            // 1. Delete the report
            await tx.report.delete({
                where: { id },
            });

            // 2. Recalculate project status after deletion
            const remainingReportsCount = await tx.report.count({
                where: { projectId: report.projectId }
            });

            if (remainingReportsCount === 0) {
                await tx.project.update({
                    where: { id: report.projectId },
                    data: {
                        status: "NOT_STARTED",
                        progressPercent: 0,
                        budgetSpent: 0,
                        lastReportedAt: null
                    }
                });
            } else {
                await syncProjectWithLatestReport(tx, report.projectId);
            }

            // 3. Audit Log
            await createAuditLog({
                action: "DELETE",
                entityType: "Report",
                entityId: id,
                userId: user.id,
                diffBefore: report,
                description: `Deleted report for project ${report.project.name} (Period: ${report.periodType})`
            });
        });

        revalidatePath("/reports");
        revalidatePath("/projects");
        revalidatePath(`/projects/${report.projectId}`);
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to delete report" };
    }
}
