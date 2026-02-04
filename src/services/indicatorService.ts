import db from "@/lib/db";
import { Prisma } from "@prisma/client";

// ============================================
// Types
// ============================================
export interface IndicatorFilters {
    projectId?: number;
    page?: number;
    limit?: number;
}

// ============================================
// Indicator CRUD
// ============================================

/**
 * Get all indicators with optional filters
 */
export async function getAllIndicators(filters: IndicatorFilters = {}) {
    const {
        projectId,
        page = 1,
        limit = 20,
    } = filters;

    const where: Prisma.IndicatorWhereInput = {};

    if (projectId) {
        where.projectId = projectId;
    }

    const skip = (page - 1) * limit;

    const [indicators, total] = await Promise.all([
        db.indicator.findMany({
            where,
            skip,
            take: limit,
            include: {
                project: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        department: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                reportResults: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 1,
                    include: {
                        report: {
                            select: {
                                fiscalYear: true,
                                periodType: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
        db.indicator.count({ where }),
    ]);

    return {
        indicators,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Get single indicator by ID with all details
 */
export async function getIndicatorById(id: number) {
    return await db.indicator.findUnique({
        where: { id },
        include: {
            project: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                    fiscalYear: true,
                    department: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            reportResults: {
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    report: {
                        select: {
                            id: true,
                            fiscalYear: true,
                            periodType: true,
                            createdAt: true,
                        },
                    },
                },
            },
        },
    });
}

/**
 * Get indicators for a specific project
 */
export async function getIndicatorsByProject(projectId: number) {
    return await db.indicator.findMany({
        where: { projectId },
        include: {
            reportResults: {
                orderBy: {
                    createdAt: "desc",
                },
                take: 1,
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });
}

/**
 * Create a new indicator
 */
export async function createIndicator(data: Prisma.IndicatorUncheckedCreateInput) {
    return await db.indicator.create({
        data,
        include: {
            project: {
                select: {
                    name: true,
                },
            },
        },
    });
}

/**
 * Update an indicator
 */
export async function updateIndicator(id: number, data: Prisma.IndicatorUpdateInput) {
    return await db.indicator.update({
        where: { id },
        data,
    });
}

/**
 * Delete an indicator
 */
export async function deleteIndicator(id: number) {
    // Delete related report results first
    await db.reportIndicatorResult.deleteMany({
        where: { indicatorId: id },
    });

    return await db.indicator.delete({
        where: { id },
    });
}

// ============================================
// Indicator Analytics
// ============================================

/**
 * Get indicator statistics
 */
export async function getIndicatorStats() {
    const [total, indicators] = await Promise.all([
        db.indicator.count(),
        db.indicator.findMany({
            select: {
                targetValue: true,
                reportResults: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 1,
                    select: {
                        actualValue: true,
                    },
                },
            },
        }),
    ]);

    // Calculate achievement stats
    let achieved = 0;
    let notAchieved = 0;
    let noData = 0;

    indicators.forEach((ind) => {
        if (!ind.reportResults || ind.reportResults.length === 0) {
            noData++;
        } else {
            const latest = ind.reportResults[0];
            if (
                latest.actualValue !== null &&
                ind.targetValue !== null &&
                latest.actualValue >= ind.targetValue
            ) {
                achieved++;
            } else {
                notAchieved++;
            }
        }
    });

    return {
        total,
        achieved,
        notAchieved,
        noData,
        achievementRate: total > 0 ? Math.round((achieved / total) * 100) : 0,
    };
}

/**
 * Calculate progress for a specific indicator
 */
export async function calculateProgress(indicatorId: number) {
    const indicator = await db.indicator.findUnique({
        where: { id: indicatorId },
        select: {
            baselineValue: true,
            targetValue: true,
            reportResults: {
                orderBy: {
                    createdAt: "desc",
                },
                take: 1,
                select: {
                    actualValue: true,
                },
            },
        },
    });

    if (!indicator || !indicator.targetValue) {
        return {
            percentage: 0,
            status: "NO_TARGET",
        };
    }

    if (!indicator.reportResults || indicator.reportResults.length === 0) {
        return {
            percentage: 0,
            status: "NO_DATA",
        };
    }

    const actualValue = indicator.reportResults[0].actualValue || 0;
    const targetValue = indicator.targetValue;
    const baselineValue = indicator.baselineValue || 0;

    // Calculate percentage
    const percentage = targetValue > 0 ? Math.round((actualValue / targetValue) * 100) : 0;

    // Determine status
    let status = "IN_PROGRESS";
    if (percentage >= 100) {
        status = "ACHIEVED";
    } else if (percentage >= 75) {
        status = "ON_TRACK";
    } else if (percentage >= 50) {
        status = "AT_RISK";
    } else {
        status = "BEHIND";
    }

    return {
        percentage,
        status,
        actualValue,
        targetValue,
        baselineValue,
    };
}

/**
 * Get indicator trend data (all historical results)
 */
export async function getIndicatorTrend(indicatorId: number) {
    return await db.reportIndicatorResult.findMany({
        where: { indicatorId },
        orderBy: {
            createdAt: "asc",
        },
        include: {
            report: {
                select: {
                    fiscalYear: true,
                    periodType: true,
                    createdAt: true,
                },
            },
        },
    });
}
