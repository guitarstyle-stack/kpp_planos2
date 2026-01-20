"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Schemas ---
const IndicatorSchema = z.object({
    goalId: z.coerce.number(),
    name: z.string().min(1, "กรุณาระบุชื่อตัวชี้วัด"),
    unit: z.string().min(1, "กรุณาระบุหน่วยนับ"),
    baselineValue: z.coerce.number().optional(),
    targetValue: z.coerce.number().optional()
});

const AnnualPlanSchema = z.object({
    name: z.string().min(1, "กรุณาระบุชื่อแผน"),
    fiscalYear: z.coerce.number().min(2500, "กรุณาระบุปีงบประมาณที่ถูกต้อง"),
    isActive: z.boolean().default(true)
});

const IssueSchema = z.object({
    annualPlanId: z.coerce.number(),
    code: z.string().min(1, "กรุณาระบุรหัสประเด็น"),
    name: z.string().min(1, "กรุณาระบุชื่อประเด็น"),
    description: z.string().optional()
});

const GoalSchema = z.object({
    issueId: z.coerce.number(),
    code: z.string().min(1, "กรุณาระบุรหัสเป้าหมาย"),
    name: z.string().min(1, "กรุณาระบุชื่อเป้าหมาย"),
    description: z.string().optional()
});


// --- Annual Plan Actions ---
export async function createAnnualPlanAction(prevState: any, formData: FormData) {
    try {
        const validated = AnnualPlanSchema.parse({
            name: formData.get("name"),
            fiscalYear: formData.get("fiscalYear"),
            isActive: true
        });

        await db.annualPlan.create({ data: validated });
        revalidatePath("/settings/strategic-plan");
        return { success: true, message: "เพิ่มแผนประจำปีสำเร็จ" };
    } catch (e) {
        return { success: false, message: "ไม่สามารถเพิ่มแผนได้" };
    }
}

export async function updateAnnualPlanAction(id: number, formData: FormData) {
    try {
        const validated = AnnualPlanSchema.parse({
            name: formData.get("name"),
            fiscalYear: formData.get("fiscalYear"),
            isActive: true
        });

        await db.annualPlan.update({
            where: { id },
            data: validated
        });
        revalidatePath("/settings/strategic-plan");
        return { success: true, message: "แก้ไขแผนสำเร็จ" };
    } catch (e) {
        return { success: false, message: "แก้ไขแผนไม่สำเร็จ" };
    }
}

export async function deleteAnnualPlanAction(id: number) {
    try {
        await db.annualPlan.delete({ where: { id } });
        revalidatePath("/settings/strategic-plan");
        return { success: true, message: "ลบแผนสำเร็จ" };
    } catch (e) {
        return { success: false, message: "ลบแผนไม่สำเร็จ (อาจมีข้อมูลเชื่อมโยง)" };
    }
}

// --- Development Issue Actions ---
export async function createIssueAction(prevState: any, formData: FormData) {
    try {
        const annualPlanId = Number(formData.get("annualPlanId"));

        // 1. Get Fiscal Year
        const plan = await db.annualPlan.findUnique({
            where: { id: annualPlanId },
            select: { fiscalYear: true }
        });
        if (!plan) return { success: false, message: "ไม่พบแผนปีที่ระบุ" };

        // 2. Count existing issues
        const count = await db.developmentIssue.count({
            where: { annualPlanId }
        });

        // 3. Generate Code: FY-XX
        const code = `${plan.fiscalYear}-${(count + 1).toString().padStart(2, '0')}`;

        const validated = IssueSchema.parse({
            annualPlanId: annualPlanId,
            code: code, // Auto-generated
            name: formData.get("name"),
            description: formData.get("description")?.toString() || undefined
        });

        await db.developmentIssue.create({ data: validated });
        revalidatePath("/settings/strategic-plan");
        return { success: true, message: "เพิ่มประเด็นสำเร็จ" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "เพิ่มประเด็นไม่สำเร็จ" };
    }
}

export async function updateIssueAction(id: number, formData: FormData) {
    try {
        const validated = IssueSchema.partial().parse({
            code: formData.get("code"), // Allow manual edit if needed
            name: formData.get("name"),
            description: formData.get("description")?.toString() || undefined
        });

        await db.developmentIssue.update({ where: { id }, data: validated });
        revalidatePath("/settings/strategic-plan");
        return { success: true, message: "แก้ไขประเด็นสำเร็จ" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "แก้ไขประเด็นไม่สำเร็จ" };
    }
}

export async function deleteIssueAction(id: number) {
    try {
        await db.developmentIssue.delete({ where: { id } });
        revalidatePath("/settings/strategic-plan");
        return { success: true, message: "ลบประเด็นสำเร็จ" };
    } catch (e) {
        return { success: false, message: "ลบประเด็นไม่สำเร็จ" };
    }
}


// --- Development Goal Actions ---
export async function createGoalAction(prevState: any, formData: FormData) {
    try {
        const issueId = Number(formData.get("issueId"));

        // 1. Get Parent Issue Code
        const issue = await db.developmentIssue.findUnique({
            where: { id: issueId },
            select: { code: true }
        });
        if (!issue) return { success: false, message: "ไม่พบประเด็นที่ระบุ" };

        // 2. Count existing goals
        const count = await db.developmentGoal.count({
            where: { issueId }
        });

        // 3. Generate Code: IssueCode-XX
        const code = `${issue.code}-${(count + 1).toString().padStart(2, '0')}`;

        const validated = GoalSchema.parse({
            issueId: issueId,
            code: code, // Auto-generated
            name: formData.get("name"),
            description: formData.get("description")?.toString() || undefined
        });

        await db.developmentGoal.create({ data: validated });
        revalidatePath("/settings/strategic-plan");
        return { success: true, message: "เพิ่มเป้าหมายสำเร็จ" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "เพิ่มเป้าหมายไม่สำเร็จ" };
    }
}

export async function updateGoalAction(id: number, formData: FormData) {
    try {
        const validated = GoalSchema.partial().parse({
            code: formData.get("code"),
            name: formData.get("name"),
            description: formData.get("description")?.toString() || undefined
        });

        await db.developmentGoal.update({ where: { id }, data: validated });
        revalidatePath("/settings/strategic-plan");
        return { success: true, message: "แก้ไขเป้าหมายสำเร็จ" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "แก้ไขเป้าหมายไม่สำเร็จ" };
    }
}

export async function deleteGoalAction(id: number) {
    try {
        await db.developmentGoal.delete({ where: { id } });
        revalidatePath("/settings/strategic-plan");
        return { success: true, message: "ลบเป้าหมายสำเร็จ" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "ลบเป้าหมายไม่สำเร็จ" };
    }
}

// --- Indicator Actions (Existing) ---

export async function createIndicatorAction(prevState: any, formData: FormData) {
    try {
        const rawData = {
            goalId: formData.get("goalId"),
            name: formData.get("name"),
            unit: formData.get("unit"),
            // Handle empty strings as undefined to avoid coercing " " -> 0
            baselineValue: formData.get("baselineValue") || undefined,
            targetValue: formData.get("targetValue") || undefined
        };

        const validatedData = IndicatorSchema.parse(rawData);

        await db.developmentIndicator.create({
            data: validatedData
        });

        revalidatePath("/settings/strategic-plan");
        return { success: true, message: "เพิ่มตัวชี้วัดสำเร็จ" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "ไม่สามารถเพิ่มตัวชี้วัดได้" };
    }
}

export async function deleteIndicatorAction(id: number) {
    try {
        await db.developmentIndicator.delete({
            where: { id }
        });
        revalidatePath("/settings/strategic-plan");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: "ไม่สามารถลบตัวชี้วัดได้" };
    }
}
