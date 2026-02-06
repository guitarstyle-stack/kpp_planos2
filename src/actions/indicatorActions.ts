"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
    getAllIndicators,
    getIndicatorById,
    getIndicatorsByProject,
    createIndicator,
    updateIndicator,
    deleteIndicator,
    getIndicatorStats,
    calculateProgress,
    getIndicatorTrend,
} from "@/services/indicatorService";
import { hasRole } from "@/services/userRoleService";
import { Prisma } from "@prisma/client";
import db from "@/lib/db";
import { z } from "zod";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/errorCodes";

// ============================================
// Schemas
// ============================================

const IndicatorSchema = z.object({
    projectId: z.coerce.number(),
    name: z.string().min(1, "กรุณาระบุชื่อตัวชี้วัด"),
    description: z.string().optional(),
    unit: z.string().min(1, "กรุณาระบุหน่วยนับ"),
    baselineValue: z.coerce.number().optional(),
    targetValue: z.coerce.number().optional()
});

const IndicatorUpdateSchema = IndicatorSchema.partial().omit({ projectId: true });

// ============================================
// Get Indicators
// ============================================

export async function getIndicatorsAction(filters?: {
    projectId?: number;
    page?: number;
    limit?: number;
}) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return createErrorResponse("กรุณาเข้าสู่ระบบ", ErrorCodes.AUTH_LOGIN_REQUIRED);
        }

        const result = await getAllIndicators(filters);

        return createSuccessResponse(result);
    } catch (error) {
        console.error("Get indicators error:", error);
        return createErrorResponse("ไม่สามารถดึงข้อมูลตัวชี้วัดได้", ErrorCodes.INTERNAL_SERVER_ERROR, error);
    }
}

export async function getIndicatorAction(id: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return createErrorResponse("กรุณาเข้าสู่ระบบ", ErrorCodes.AUTH_LOGIN_REQUIRED);
        }

        const indicator = await getIndicatorById(id);

        if (!indicator) {
            return createErrorResponse("ไม่พบข้อมูลตัวชี้วัด", ErrorCodes.REPORT_NOT_FOUND);
        }

        return createSuccessResponse(indicator);
    } catch (error) {
        console.error("Get indicator error:", error);
        return createErrorResponse("ไม่สามารถดึงข้อมูลตัวชี้วัดได้", ErrorCodes.INTERNAL_SERVER_ERROR, error);
    }
}

export async function getProjectIndicatorsAction(projectId: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return createErrorResponse("กรุณาเข้าสู่ระบบ", ErrorCodes.AUTH_LOGIN_REQUIRED);
        }

        const indicators = await getIndicatorsByProject(projectId);

        return createSuccessResponse(indicators);
    } catch (error) {
        console.error("Get project indicators error:", error);
        return createErrorResponse("ไม่สามารถดึงข้อมูลตัวชี้วัดของโครงการได้", ErrorCodes.INTERNAL_SERVER_ERROR, error);
    }
}

// ============================================
// Create/Update/Delete Indicators
// ============================================

export async function createIndicatorAction(data: any) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return createErrorResponse("กรุณาเข้าสู่ระบบ", ErrorCodes.AUTH_LOGIN_REQUIRED);
        }

        // Validate data
        const validatedData = IndicatorSchema.parse(data);

        // Check project ownership/department permission
        const project = await db.project.findUnique({
            where: { id: validatedData.projectId },
            select: { departmentId: true, ownerUserId: true }
        });

        if (!project) {
            return createErrorResponse("ไม่พบโครงการที่ระบุ", ErrorCodes.PROJECT_NOT_FOUND);
        }

        const isAdmin = await hasRole(user.id, "ADMIN");
        const isOwner = project.ownerUserId === user.id;
        const isSameDept = project.departmentId === user.departmentId;

        if (!isAdmin && !isOwner && !isSameDept) {
            return createErrorResponse("คุณไม่มีสิทธิ์สร้างตัวชี้วัดสำหรับโครงการนี้", ErrorCodes.AUTH_FORBIDDEN);
        }

        const indicator = await createIndicator(validatedData as Prisma.IndicatorUncheckedCreateInput);

        revalidatePath("/indicators");
        revalidatePath(`/projects/${validatedData.projectId}`);

        return createSuccessResponse(indicator, "สร้างตัวชี้วัดสำเร็จ");
    } catch (error) {
        console.error("Create indicator error:", error);
        if (error instanceof z.ZodError) {
            return createErrorResponse("ข้อมูลไม่ถูกต้อง", ErrorCodes.VALIDATION_FAILED, error.flatten());
        }
        return createErrorResponse("ไม่สามารถสร้างตัวชี้วัดได้", ErrorCodes.INTERNAL_SERVER_ERROR, error);
    }
}

export async function updateIndicatorAction(id: number, data: any) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return createErrorResponse("กรุณาเข้าสู่ระบบ", ErrorCodes.AUTH_LOGIN_REQUIRED);
        }

        // Get existing indicator to check ownership via project
        const existing = await getIndicatorById(id);
        if (!existing) {
            return createErrorResponse("ไม่พบตัวชี้วัดที่ต้องการแก้ไข", ErrorCodes.REPORT_NOT_FOUND);
        }

        const project = await db.project.findUnique({
            where: { id: existing.projectId },
            select: { departmentId: true, ownerUserId: true }
        });

        if (!project) {
            return createErrorResponse("ไม่พบโครงการที่เกี่ยวข้อง", ErrorCodes.PROJECT_NOT_FOUND);
        }

        const isAdmin = await hasRole(user.id, "ADMIN");
        const isOwner = project.ownerUserId === user.id;
        const isSameDept = project.departmentId === user.departmentId;

        if (!isAdmin && !isOwner && !isSameDept) {
            return createErrorResponse("คุณไม่มีสิทธิ์แก้ไขตัวชี้วัดนี้", ErrorCodes.AUTH_FORBIDDEN);
        }

        // Validate update data
        const validatedData = IndicatorUpdateSchema.parse(data);

        const indicator = await updateIndicator(id, validatedData);

        revalidatePath("/indicators");
        revalidatePath(`/indicators/${id}`);
        revalidatePath(`/projects/${existing.projectId}`);

        return createSuccessResponse(indicator, "อัปเดตตัวชี้วัดสำเร็จ");
    } catch (error) {
        console.error("Update indicator error:", error);
        if (error instanceof z.ZodError) {
            return createErrorResponse("ข้อมูลไม่ถูกต้อง", ErrorCodes.VALIDATION_FAILED, error.flatten());
        }
        return createErrorResponse("ไม่สามารถอัปเดตตัวชี้วัดได้", ErrorCodes.INTERNAL_SERVER_ERROR, error);
    }
}

export async function deleteIndicatorAction(id: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return createErrorResponse("กรุณาเข้าสู่ระบบ", ErrorCodes.AUTH_LOGIN_REQUIRED);
        }

        // Get existing indicator to check ownership via project
        const existing = await getIndicatorById(id);
        if (!existing) {
            return createErrorResponse("ไม่พบตัวชี้วัดที่ต้องการลบ", ErrorCodes.REPORT_NOT_FOUND);
        }

        const project = await db.project.findUnique({
            where: { id: existing.projectId },
            select: { departmentId: true, ownerUserId: true }
        });

        if (!project) {
            return createErrorResponse("ไม่พบโครงการที่เกี่ยวข้อง", ErrorCodes.PROJECT_NOT_FOUND);
        }

        const isAdmin = await hasRole(user.id, "ADMIN");
        const isOwner = project.ownerUserId === user.id;
        const isSameDept = project.departmentId === user.departmentId;

        if (!isAdmin && !isOwner && !isSameDept) {
            return createErrorResponse("คุณไม่มีสิทธิ์ลบตัวชี้วัดนี้", ErrorCodes.AUTH_FORBIDDEN);
        }

        await deleteIndicator(id);

        revalidatePath("/indicators");
        revalidatePath(`/projects/${existing.projectId}`);

        return createSuccessResponse(null, "ลบตัวชี้วัดสำเร็จ");
    } catch (error) {
        console.error("Delete indicator error:", error);
        return createErrorResponse("ไม่สามารถลบตัวชี้วัดได้", ErrorCodes.INTERNAL_SERVER_ERROR, error);
    }
}

// ============================================
// Analytics Actions
// ============================================

export async function getIndicatorStatsAction() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return createErrorResponse("กรุณาเข้าสู่ระบบ", ErrorCodes.AUTH_LOGIN_REQUIRED);
        }

        const stats = await getIndicatorStats();

        return createSuccessResponse(stats);
    } catch (error) {
        console.error("Get indicator stats error:", error);
        return createErrorResponse("ไม่สามารถดึงสถิติตัวชี้วัดได้", ErrorCodes.INTERNAL_SERVER_ERROR, error);
    }
}

export async function calculateIndicatorProgressAction(indicatorId: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return createErrorResponse("กรุณาเข้าสู่ระบบ", ErrorCodes.AUTH_LOGIN_REQUIRED);
        }

        const progress = await calculateProgress(indicatorId);

        return createSuccessResponse(progress);
    } catch (error) {
        console.error("Calculate progress error:", error);
        return createErrorResponse("ไม่สามารถคำนวณความก้าวหน้าได้", ErrorCodes.INTERNAL_SERVER_ERROR, error);
    }
}

export async function getIndicatorTrendAction(indicatorId: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return createErrorResponse("กรุณาเข้าสู่ระบบ", ErrorCodes.AUTH_LOGIN_REQUIRED);
        }

        const trend = await getIndicatorTrend(indicatorId);

        return createSuccessResponse(trend);
    } catch (error) {
        console.error("Get indicator trend error:", error);
        return createErrorResponse("ไม่สามารถดึงข้อมูลแนวโน้มตัวชี้วัดได้", ErrorCodes.INTERNAL_SERVER_ERROR, error);
    }
}
