"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/errorCodes";
import { createAuditLog } from "@/lib/audit";

import { z } from "zod";

import { ProjectSchema, IndicatorSchema } from "@/schemas/projectSchema";

// Removed local schema definitions


export async function createProjectAction(prevState: any, formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return createErrorResponse("กรุณาเข้าสู่ระบบเพื่อสร้างโครงการ", ErrorCodes.AUTH_LOGIN_REQUIRED);
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

        const newProject = await db.project.create({
            data: {
                ...projectData,
                ownerUserId: user.id,
                indicators: {
                    create: indicatorsData
                }
            },
        });

        await createAuditLog({
            action: "CREATE",
            entityType: "Project",
            entityId: newProject.id,
            description: `Created new project: ${newProject.name} (${newProject.code})`,
            diffAfter: newProject,
            userId: user.id,
        });

        revalidatePath("/projects");
        return createSuccessResponse(null, "สร้างโครงการสำเร็จ");
    } catch (error) {
        console.error(error);
        return createErrorResponse("ไม่สามารถสร้างโครงการได้", ErrorCodes.PROJECT_CREATE_FAILED, error);
    }
}

// Admin Create Project Action - สามารถกำหนดผู้รับผิดชอบได้
export async function createProjectAsAdmin(prevState: any, formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return createErrorResponse("กรุณาเข้าสู่ระบบเพื่อสร้างโครงการ", ErrorCodes.AUTH_LOGIN_REQUIRED);
        }

        // ตรวจสอบสิทธิ์ Admin
        const isAdmin = await hasRole(user.id, "ADMIN");
        if (!isAdmin) {
            return createErrorResponse("คุณไม่มีสิทธิ์ในการดำเนินการนี้", ErrorCodes.PROJECT_UNAUTHORIZED);
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
            code: code,
            fiscalYear: fiscalYear,
            name: formData.get("name"),
            description: formData.get("description"),
            departmentId: formData.get("departmentId"),
            developmentGoalId: formData.get("developmentGoalId"),
            budgetTotal: formData.get("budgetTotal"),
            budgetSpent: formData.get("budgetSpent"),
            progressPercent: formData.get("progressPercent"),
            status: formData.get("status"),
            targetGroup: formData.get("targetGroup"),
            startDate: formData.get("startDate"),
            endDate: formData.get("endDate"),
            ownerId: formData.get("ownerId"), // เพิ่มฟิลด์ ownerId
            indicators: indicators
        };

        const { AdminProjectSchema } = await import("@/schemas/projectSchema");
        const validatedData = AdminProjectSchema.parse(rawData);

        // Separate indicators and ownerId from project data
        const { indicators: indicatorsData, ownerId, ...projectData } = validatedData;

        const newProject = await db.project.create({
            data: {
                ...projectData,
                ownerUserId: ownerId, // ใช้ ownerId ที่เลือกจากฟอร์ม
                indicators: {
                    create: indicatorsData
                }
            },
        });

        await createAuditLog({
            action: "CREATE",
            entityType: "Project",
            entityId: newProject.id,
            description: `Admin created new project: ${newProject.name} (${newProject.code})`,
            diffAfter: newProject,
            userId: user.id,
        });

        revalidatePath("/admin/projects");
        revalidatePath("/projects");
        return createSuccessResponse(null, "สร้างโครงการสำเร็จ");
    } catch (error) {
        console.error(error);
        return createErrorResponse("ไม่สามารถสร้างโครงการได้", ErrorCodes.PROJECT_CREATE_FAILED, error);
    }
}


import { hasRole } from "@/services/userRoleService";

// ... [existing imports]

// ... [createProjectAction remains mostly same but good to check]

export async function updateProjectAction(id: number, formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return createErrorResponse("กรุณาเข้าสู่ระบบ", ErrorCodes.AUTH_LOGIN_REQUIRED);
        }

        const project = await db.project.findUnique({
            where: { id },
        });

        if (!project) {
            return createErrorResponse("ไม่พบโครงการ", ErrorCodes.PROJECT_NOT_FOUND);
        }

        const isAdmin = await hasRole(user.id, "ADMIN");
        if (project.ownerUserId !== user.id && !isAdmin) {
            return createErrorResponse("คุณไม่มีสิทธิ์แก้ไขโครงการนี้", ErrorCodes.PROJECT_UNAUTHORIZED);
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

            // Audit Log
            await createAuditLog({
                action: "UPDATE",
                entityType: "Project",
                entityId: id,
                description: `Updated project: ${project.name}`,
                diffBefore: project,
                diffAfter: projectData,
                userId: user.id,
            });
        });

        revalidatePath("/projects");
        return createSuccessResponse(null, "อัปเดตโครงการสำเร็จ");
    } catch (error) {
        console.error(error);
        return createErrorResponse("ไม่สามารถอัปเดตโครงการได้", ErrorCodes.PROJECT_UPDATE_FAILED, error);
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

        await createAuditLog({
            action: "DELETE",
            entityType: "Project",
            entityId: id,
            description: `Deleted project: ${project.name} (${project.code})`,
            userId: user.id,
        });

        revalidatePath("/projects");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to delete project" };
    }
}

// ============================================
// Project Search Action
// ============================================

export async function searchProjectsAction(filters: {
    query?: string;
    status?: string;
    departmentId?: number;
    fiscalYear?: number;
    goalId?: number;
    page?: number;
    limit?: number;
}) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        const { searchProjects } = await import("@/services/projectService");
        const result = await searchProjects(filters);

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error("Search projects error:", error);
        return {
            success: false,
            error: "Failed to search projects",
        };
    }
}

