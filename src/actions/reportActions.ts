"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/services/userRoleService";

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

            const project = await tx.project.findUnique({
                where: { id: validatedData.projectId },
                select: { budgetTotal: true },
            });

            if (project) {
                // Calculate progress from budget or KPI
                let calculatedProgress = validatedData.overallProgressPercent || 0;

                // If no overall progress specified, calculate from budget
                if (!calculatedProgress && validatedData.budgetProgressPercent) {
                    calculatedProgress = validatedData.budgetProgressPercent;
                } else if (!calculatedProgress && validatedData.kpiAchievementPercent) {
                    calculatedProgress = validatedData.kpiAchievementPercent;
                }

                // Determine status based on progress
                let newStatus = "NOT_STARTED";
                if (calculatedProgress > 0 && calculatedProgress < 100) {
                    newStatus = "IN_PROGRESS";
                } else if (calculatedProgress >= 100) {
                    newStatus = "COMPLETED";
                }

                // Update project
                await tx.project.update({
                    where: { id: validatedData.projectId },
                    data: {
                        budgetSpent: validatedData.budgetSpentCumulative || 0,
                        progressPercent: Math.round(calculatedProgress),
                        status: newStatus,
                        lastReportedAt: new Date(),
                    },
                });
            }
        });

        revalidatePath("/reports");
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

        // Permission Check
        const isAdmin = await hasRole(user.id, "ADMIN");
        if (!isAdmin) {
            const report = await db.report.findUnique({
                where: { id },
                include: { project: { select: { departmentId: true, ownerUserId: true } } }
            });

            if (!report) return { message: "Report not found" };

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

            // 4. Sync Project Status (Only if this is the latest report)
            // Find the latest report for this project

            const latestReport = await tx.report.findFirst({
                where: { projectId: Number(validatedData.projectId) },
                orderBy: { createdAt: 'desc' },
                select: { id: true, createdAt: true } // We only need date to check
            });

            // If the report we just updated determines the project's current state (it's the latest one)
            // Note: If we just updated its date, it might now BE the latest, or still be the latest.
            // Simple check: If this report's ID matches the latest ID found, OR if there's no other later report.

            // Actually, we should just always recalculate from the "True Latest" after update.
            if (latestReport && latestReport.id === id) {
                const project = await tx.project.findUnique({
                    where: { id: Number(validatedData.projectId) },
                    select: { budgetTotal: true },
                });

                if (project) {
                    // Logic similar to createReportAction
                    let calculatedProgress = validatedData.overallProgressPercent || 0;

                    if (!calculatedProgress && validatedData.budgetProgressPercent) {
                        calculatedProgress = validatedData.budgetProgressPercent;
                    } else if (!calculatedProgress && validatedData.kpiAchievementPercent) {
                        calculatedProgress = validatedData.kpiAchievementPercent;
                    }

                    let newStatus = "NOT_STARTED";
                    if (calculatedProgress > 0 && calculatedProgress < 100) {
                        newStatus = "IN_PROGRESS";
                    } else if (calculatedProgress >= 100) {
                        newStatus = "COMPLETED";
                    }

                    await tx.project.update({
                        where: { id: Number(validatedData.projectId) },
                        data: {
                            budgetSpent: validatedData.budgetSpentCumulative || 0,
                            progressPercent: Math.round(calculatedProgress),
                            status: newStatus,
                            lastReportedAt: new Date(), // Update this to match report edit time or keep original? Usually update to now is fine or use report's date.
                            // Let's use current time as "Last Reported" event happened just now.
                        },
                    });
                }
            }
        });

        revalidatePath("/reports");
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

        // Permission Check
        const isAdmin = await hasRole(user.id, "ADMIN");
        if (!isAdmin) {
            const report = await db.report.findUnique({
                where: { id },
                include: { project: { select: { departmentId: true, ownerUserId: true } } }
            });

            if (!report) return { message: "Report not found" };

            const isProjectOwner = user.id === report.project.ownerUserId;
            const isReportCreator = user.id === report.createdById;

            if (!isProjectOwner && !isReportCreator) {
                return { message: "ไม่มีสิทธิ์ลบรายงานนี้ (ต้องเป็นเจ้าของโครงการ, ผู้สร้างรายงาน หรือ Admin)" };
            }
        }

        await db.report.delete({
            where: { id },
        });

        revalidatePath("/reports");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to delete report" };
    }
}
