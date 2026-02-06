import { z } from "zod";

export const IndicatorSchema = z.object({
    id: z.coerce.number().optional(),
    name: z.string().min(1, "กรุณาระบุชื่อตัวชี้วัด"),
    unit: z.string().min(1, "กรุณาระบุหน่วยนับ"),
    baselineValue: z.coerce.number().optional(),
    targetValue: z.coerce.number().optional()
});

export const ProjectSchema = z.object({
    code: z.string().min(1, "กรุณาระบุรหัสโครงการ"),
    name: z.string().min(1, "กรุณาระบุชื่อโครงการ"),
    description: z.string().optional(),
    fiscalYear: z.coerce.number(),
    departmentId: z.coerce.number().min(1, "กรุณาเลือกหน่วยงาน"),

    developmentGoalId: z.coerce.number().optional(),
    // New fields
    budgetTotal: z.coerce.number().min(0, "งบประมาณต้องไม่ต่ำกว่า 0"),
    budgetSpent: z.coerce.number().optional().default(0),
    progressPercent: z.coerce.number().min(0).max(100).optional().default(0),
    status: z.string().default("NOT_STARTED"),
    targetGroup: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),

    indicators: z.array(IndicatorSchema).optional(),
});

export type ProjectFormData = z.infer<typeof ProjectSchema>;
export type ProjectFormInput = z.input<typeof ProjectSchema>;
export type IndicatorFormData = z.infer<typeof IndicatorSchema>;
