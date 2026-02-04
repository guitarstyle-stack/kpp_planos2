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
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        const result = await getAllIndicators(filters);

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error("Get indicators error:", error);
        return {
            success: false,
            error: "Failed to fetch indicators",
        };
    }
}

export async function getIndicatorAction(id: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        const indicator = await getIndicatorById(id);

        if (!indicator) {
            return {
                success: false,
                error: "Indicator not found",
            };
        }

        return {
            success: true,
            data: indicator,
        };
    } catch (error) {
        console.error("Get indicator error:", error);
        return {
            success: false,
            error: "Failed to fetch indicator",
        };
    }
}

export async function getProjectIndicatorsAction(projectId: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        const indicators = await getIndicatorsByProject(projectId);

        return {
            success: true,
            data: indicators,
        };
    } catch (error) {
        console.error("Get project indicators error:", error);
        return {
            success: false,
            error: "Failed to fetch project indicators",
        };
    }
}

// ============================================
// Create/Update/Delete Indicators
// ============================================

export async function createIndicatorAction(data: {
    projectId: number;
    name: string;
    description?: string;
    unit: string;
    baselineValue?: number;
    targetValue?: number;
}) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        // Check if user has permission for this project
        const isAdmin = await hasRole(user.id, "ADMIN");
        // TODO: Add check if user owns the project

        const indicator = await createIndicator(data as Prisma.IndicatorUncheckedCreateInput);

        revalidatePath("/indicators");
        revalidatePath(`/projects/${data.projectId}`);

        return {
            success: true,
            data: indicator,
        };
    } catch (error) {
        console.error("Create indicator error:", error);
        return {
            success: false,
            error: "Failed to create indicator",
        };
    }
}

export async function updateIndicatorAction(
    id: number,
    data: {
        name?: string;
        description?: string;
        unit?: string;
        baselineValue?: number;
        targetValue?: number;
    }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        // Get existing indicator to check ownership
        const existing = await getIndicatorById(id);
        if (!existing) {
            return {
                success: false,
                error: "Indicator not found",
            };
        }

        const indicator = await updateIndicator(id, data);

        revalidatePath("/indicators");
        revalidatePath(`/indicators/${id}`);
        revalidatePath(`/projects/${existing.projectId}`);

        return {
            success: true,
            data: indicator,
        };
    } catch (error) {
        console.error("Update indicator error:", error);
        return {
            success: false,
            error: "Failed to update indicator",
        };
    }
}

export async function deleteIndicatorAction(id: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        // Check if user is admin
        const isAdmin = await hasRole(user.id, "ADMIN");
        if (!isAdmin) {
            // TODO: Add check if user owns the project
        }

        // Get existing indicator to get projectId for revalidation
        const existing = await getIndicatorById(id);
        if (!existing) {
            return {
                success: false,
                error: "Indicator not found",
            };
        }

        await deleteIndicator(id);

        revalidatePath("/indicators");
        revalidatePath(`/projects/${existing.projectId}`);

        return {
            success: true,
        };
    } catch (error) {
        console.error("Delete indicator error:", error);
        return {
            success: false,
            error: "Failed to delete indicator",
        };
    }
}

// ============================================
// Analytics Actions
// ============================================

export async function getIndicatorStatsAction() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        const stats = await getIndicatorStats();

        return {
            success: true,
            data: stats,
        };
    } catch (error) {
        console.error("Get indicator stats error:", error);
        return {
            success: false,
            error: "Failed to fetch indicator statistics",
        };
    }
}

export async function calculateIndicatorProgressAction(indicatorId: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        const progress = await calculateProgress(indicatorId);

        return {
            success: true,
            data: progress,
        };
    } catch (error) {
        console.error("Calculate progress error:", error);
        return {
            success: false,
            error: "Failed to calculate progress",
        };
    }
}

export async function getIndicatorTrendAction(indicatorId: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: "Unauthorized: Please login",
            };
        }

        const trend = await getIndicatorTrend(indicatorId);

        return {
            success: true,
            data: trend,
        };
    } catch (error) {
        console.error("Get indicator trend error:", error);
        return {
            success: false,
            error: "Failed to fetch indicator trend",
        };
    }
}
