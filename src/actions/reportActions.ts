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
    overallProgressPercent: z.coerce.number().min(0).max(100).optional(),

    // Budget tracking fields
    budgetSpentInPeriod: z.coerce.number().optional(),
    budgetSpentCumulative: z.coerce.number().optional(),
    budgetProgressPercent: z.coerce.number().min(0).max(100).optional(),

    // KPI tracking fields
    kpiAchievedCount: z.coerce.number().min(0).optional(),
    kpiTotalCount: z.coerce.number().min(0).optional(),
    kpiAchievementPercent: z.coerce.number().min(0).max(100).optional(),
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
            await tx.report.update({
                where: { id },
                data: validatedData,
            });

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

            const matchesDepartment = user.departmentId === report.project.departmentId;
            const isOwner = user.id === report.project.ownerUserId;

            if (!matchesDepartment && !isOwner) {
                return { message: "ไม่มีสิทธิ์ลบรายงานนี้" };
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
