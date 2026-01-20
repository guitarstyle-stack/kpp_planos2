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
        };

        const validatedData = ReportSchema.parse(rawData);

        await db.report.create({
            data: {
                ...validatedData,
                createdById: user.id,
            },
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
        };

        const validatedData = ReportSchema.parse(rawData);

        await db.report.update({
            where: { id },
            data: validatedData,
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
