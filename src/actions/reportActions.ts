"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";

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
