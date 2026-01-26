"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

import { z } from "zod";

const IndicatorSchema = z.object({
    name: z.string().min(1, "กรุณาระบุชื่อตัวชี้วัด"),
    unit: z.string().min(1, "กรุณาระบุหน่วยนับ"),
    baselineValue: z.coerce.number().optional(),
    targetValue: z.coerce.number().optional()
});



const ProjectSchema = z.object({
    code: z.string().min(1, "กรุณาระบุรหัสโครงการ"),
    name: z.string().min(1, "กรุณาระบุชื่อโครงการ"),
    description: z.string().optional(),
    fiscalYear: z.coerce.number(),
    departmentId: z.coerce.number(),

    developmentGoalId: z.coerce.number().optional(),
    // New fields
    budgetTotal: z.coerce.number().optional(),
    budgetSpent: z.coerce.number().optional(),
    progressPercent: z.coerce.number().optional(),
    status: z.string().default("NOT_STARTED"),
    targetGroup: z.string().optional(),
    startDate: z.string().transform((v) => (v === "" ? undefined : new Date(v))).optional(),
    endDate: z.string().transform((v) => (v === "" ? undefined : new Date(v))).optional(),

    indicators: z.array(IndicatorSchema).optional(),


});

export async function createProjectAction(prevState: any, formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { message: "Unauthorized: Please login to create a project" };
        }

        const indicatorsJson = formData.get("indicatorsJson") as string;
        let indicators: any[] = [];
        if (indicatorsJson) {
            try {
                indicators = JSON.parse(indicatorsJson);
            } catch (e) {
                console.error("Failed to parse indicators JSON", e);
            }
        }



        const fiscalYear = Number(formData.get("fiscalYear"));
        const developmentGoalIdParam = formData.get("developmentGoalId");
        const developmentGoalId = developmentGoalIdParam ? Number(developmentGoalIdParam) : undefined;

        let code = "";

        // Generate Hierarchical Code: [GoalCode]-[001]
        if (developmentGoalId) {
            const goal = await db.developmentGoal.findUnique({
                where: { id: developmentGoalId },
                select: { code: true }
            });

            if (goal) {
                const count = await db.project.count({
                    where: { developmentGoalId }
                });
                code = `${goal.code}-${(count + 1).toString().padStart(3, '0')}`;
            }
        }

        // Fallback Code: FY-[001]
        if (!code) {
            const count = await db.project.count({
                where: { fiscalYear }
            });
            code = `${fiscalYear}-${(count + 1).toString().padStart(3, '0')}`;
        }

        const rawData = {
            code: code, // Auto-generated
            fiscalYear: fiscalYear,
            name: formData.get("name"),
            description: formData.get("description"),
            departmentId: formData.get("departmentId"),

            developmentGoalId: formData.get("developmentGoalId"),
            // New fields mapping
            budgetTotal: formData.get("budgetTotal"),
            budgetSpent: formData.get("budgetSpent"),
            progressPercent: formData.get("progressPercent"),
            status: formData.get("status"),
            targetGroup: formData.get("targetGroup"),
            startDate: formData.get("startDate"),
            endDate: formData.get("endDate"),
            indicators: indicators
        };

        const validatedData = ProjectSchema.parse(rawData);

        // Separate indicators from project data
        const { indicators: indicatorsData, ...projectData } = validatedData;

        await db.project.create({
            data: {
                ...projectData,
                ownerUserId: user.id,
                indicators: {
                    create: indicatorsData
                }
            },
        });

        revalidatePath("/projects");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to create project" };
    }
}

import { hasRole } from "@/services/userRoleService";

// ... [existing imports]

// ... [createProjectAction remains mostly same but good to check]

export async function updateProjectAction(id: number, formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { message: "Unauthorized: Please login" };
        }

        const project = await db.project.findUnique({
            where: { id },
            select: { ownerUserId: true }
        });

        if (!project) {
            return { message: "Project not found" };
        }

        const isAdmin = await hasRole(user.id, "ADMIN");
        if (project.ownerUserId !== user.id && !isAdmin) {
            return { message: "Unauthorized: You can only edit projects you own" };
        }

        const indicatorsJson = formData.get("indicatorsJson") as string;
        let indicators: any[] = [];
        if (indicatorsJson) {
            try {
                indicators = JSON.parse(indicatorsJson);
            } catch (e) {
                console.error("Failed to parse indicators JSON", e);
            }
        }

        const rawData = {
            code: formData.get("code"),
            fiscalYear: formData.get("fiscalYear"),
            name: formData.get("name"),
            description: formData.get("description"),
            departmentId: formData.get("departmentId"),

            developmentGoalId: formData.get("developmentGoalId"),
            // New fields mapping
            budgetTotal: formData.get("budgetTotal"),
            budgetSpent: formData.get("budgetSpent"),
            progressPercent: formData.get("progressPercent"),
            status: formData.get("status"),
            targetGroup: formData.get("targetGroup"),
            startDate: formData.get("startDate"),
            endDate: formData.get("endDate"),
            indicators: indicators
        };

        const validatedData = ProjectSchema.parse(rawData);

        // Separate indicators
        const { indicators: indicatorsData, ...projectData } = validatedData;

        await db.$transaction(async (tx) => {
            // Update project fields
            await tx.project.update({
                where: { id },
                data: projectData,
            });

            // Handle indicators if provided
            if (indicatorsData) {
                // Get existing indicators
                const existingIndicators = await tx.indicator.findMany({
                    where: { projectId: id }
                });

                // Identify IDs in the new data
                const incomingIds = indicatorsData
                    .map((ind: any) => ind.id)
                    .filter((id: any) => id !== undefined && id !== null);

                // Determine indicators to delete
                const toDelete = existingIndicators.filter(ind => !incomingIds.includes(ind.id));
                for (const ind of toDelete) {
                    await tx.indicator.delete({ where: { id: ind.id } });
                }

                // Create or Update
                for (const ind of indicatorsData as any[]) {
                    if (ind.id) {
                        // Update
                        await tx.indicator.update({
                            where: { id: ind.id },
                            data: {
                                name: ind.name,
                                unit: ind.unit,
                                targetValue: ind.targetValue,
                                baselineValue: ind.baselineValue
                            }
                        });
                    } else {
                        // Create
                        await tx.indicator.create({
                            data: {
                                projectId: id,
                                name: ind.name,
                                unit: ind.unit,
                                targetValue: ind.targetValue,
                                baselineValue: ind.baselineValue
                            }
                        });
                    }
                }
            }
        });

        revalidatePath("/projects");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to update project" };
    }
}

export async function deleteProjectAction(id: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { message: "Unauthorized: Please login" };
        }

        const project = await db.project.findUnique({
            where: { id },
            select: { ownerUserId: true }
        });

        if (!project) {
            return { message: "Project not found" };
        }

        const isAdmin = await hasRole(user.id, "ADMIN");
        if (project.ownerUserId !== user.id && !isAdmin) {
            return { message: "Unauthorized: You can only delete projects you own" };
        }

        // Delete related data first to avoid foreign key constraints
        // Delete indicators (and their results will cascade if configured)
        await db.indicator.deleteMany({
            where: { projectId: id }
        });

        // Delete reports
        await db.report.deleteMany({
            where: { projectId: id }
        });

        // Delete attachments
        await db.projectAttachment.deleteMany({
            where: { projectId: id }
        });

        // Now delete the project
        await db.project.delete({
            where: { id },
        });

        revalidatePath("/projects");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to delete project" };
    }
}
