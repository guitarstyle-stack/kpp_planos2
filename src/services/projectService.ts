import db from "@/lib/db";
import { Prisma, Project } from "@prisma/client";

export type ProjectWithDetails = Project & {
    department: { name: string };
    ownerUser: { name: string };

    developmentGoal: { name: string } | null;
};

export interface ProjectFilters {
    departmentId?: number;
    fiscalYear?: number;
}

export async function getProjects(filters: ProjectFilters = {}) {
    const where: Prisma.ProjectWhereInput = {
        isActive: true,
    };

    if (filters.departmentId) {
        where.departmentId = filters.departmentId;
    }

    if (filters.fiscalYear) {
        where.fiscalYear = filters.fiscalYear;
    }

    return await db.project.findMany({
        where,
        include: {
            department: true,

            developmentGoal: {
                include: {
                    issue: {
                        include: {
                            annualPlan: true,
                        },
                    },
                },
            },
            ownerUser: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

// Get projects owned by a specific user (for reports)
export async function getProjectsByOwner(userId: number) {
    return await db.project.findMany({
        where: {
            ownerUserId: userId,
        },
        include: {
            department: true,
            developmentGoal: {
                include: {
                    issue: {
                        include: {
                            annualPlan: true,
                        },
                    },
                },
            },
            ownerUser: {
                select: {
                    id: true,
                    name: true,
                },
            },
            indicators: {
                select: {
                    id: true,
                    name: true,
                    unit: true,
                    targetValue: true,
                    baselineValue: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}


export async function getProjectById(id: number) {
    return await db.project.findUnique({
        where: { id },
        include: {
            department: true,
            // projectCategory: true,
            developmentGoal: {
                include: {
                    issue: {
                        include: {
                            annualPlan: true,
                        },
                    },
                },
            },
            ownerUser: {
                select: {
                    id: true,
                    name: true,
                },
            },
            indicators: {
                include: {
                    reportResults: {
                        orderBy: {
                            report: {
                                createdAt: "desc"
                            }
                        },
                        // Removed take: 1 to allow summation of all results
                        include: {
                            report: true
                        }
                    }
                }
            },
        },
    });
}

export async function createProject(data: Prisma.ProjectUncheckedCreateInput) {
    return await db.project.create({ data });
}

export interface ProjectStatsFilters {
    fiscalYear?: number;
    departmentId?: number;
    issueId?: number;
}

export async function getProjectStats(filters: ProjectStatsFilters = {}) {
    const where: Prisma.ProjectWhereInput = {
        isActive: true,
    };

    if (filters.fiscalYear) {
        where.fiscalYear = filters.fiscalYear;
    }

    if (filters.departmentId) {
        where.departmentId = filters.departmentId;
    }

    if (filters.issueId) {
        where.developmentGoal = {
            issueId: filters.issueId,
        };
    }

    const projects = await db.project.findMany({
        where,
        select: {
            status: true,
            progressPercent: true,
            budgetTotal: true,
            budgetSpent: true,
            departmentId: true,
            department: { select: { name: true } },
            fiscalYear: true,
            developmentGoal: {
                select: {
                    issue: {
                        select: { name: true }
                    }
                }
            },
            reports: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: {
                    issues: true
                }
            },
            indicators: {
                select: {
                    id: true,
                    targetValue: true,
                    reportResults: {
                        select: {
                            actualValue: true,
                        },
                    },
                },
            },
        },
    });

    const totalProjects = projects.length;
    const avgProgress = projects.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + (p.progressPercent || 0), 0) / projects.length)
        : 0;
    const totalBudget = projects.reduce((sum, p) => sum + (p.budgetTotal || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.budgetSpent || 0), 0);

    // Count by status
    const statusCounts = {
        NOT_STARTED: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        CANCELLED: 0,
    };
    projects.forEach(p => {
        if (p.status in statusCounts) {
            statusCounts[p.status as keyof typeof statusCounts]++;
        }
    });

    // Count by department
    const departmentCounts: Record<string, number> = {};
    const departmentProgress: Record<string, { total: number; count: number }> = {};

    projects.forEach(p => {
        const deptName = p.department?.name || "ไม่ระบุ";
        departmentCounts[deptName] = (departmentCounts[deptName] || 0) + 1;

        // Accumulate progress for avg calculation
        if (!departmentProgress[deptName]) {
            departmentProgress[deptName] = { total: 0, count: 0 };
        }
        departmentProgress[deptName].total += p.progressPercent || 0;
        departmentProgress[deptName].count += 1;
    });

    // Calculate avg progress per department
    const avgProgressByDepartment: Record<string, number> = {};
    Object.entries(departmentProgress).forEach(([dept, data]) => {
        avgProgressByDepartment[dept] = Math.round(data.total / data.count);
    });

    // Count by fiscal year
    const yearlyCounts: Record<string, number> = {};
    projects.forEach(p => {
        const year = p.fiscalYear.toString();
        yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
    });

    // Strategy & Risk
    const strategicCounts: Record<string, number> = {};
    let projectsWithIssuesCount = 0;

    // Aggregations for Budget and Progress
    const budgetByDepartment: Record<string, { total: number; spent: number }> = {};
    const progressDistribution = {
        "0-25%": 0,
        "26-50%": 0,
        "51-75%": 0,
        "76-100%": 0,
    };

    // KPI Stats Aggregation
    let totalIndicators = 0;
    let achievedIndicators = 0;
    let totalAchievementPercent = 0;

    projects.forEach(p => {
        // Strategic Alignment
        if (p.developmentGoal?.issue?.name) {
            const issueName = p.developmentGoal.issue.name;
            strategicCounts[issueName] = (strategicCounts[issueName] || 0) + 1;
        }

        // Risk (Projects with active issues in latest report)
        if (p.reports && p.reports.length > 0 && p.reports[0].issues) {
            projectsWithIssuesCount++;
        }

        // Budget by Department
        const deptName = p.department?.name || "ไม่ระบุ";
        if (!budgetByDepartment[deptName]) {
            budgetByDepartment[deptName] = { total: 0, spent: 0 };
        }
        budgetByDepartment[deptName].total += p.budgetTotal || 0;
        budgetByDepartment[deptName].spent += p.budgetSpent || 0;

        // Progress Distribution
        const progress = p.progressPercent || 0;
        if (progress <= 25) progressDistribution["0-25%"]++;
        else if (progress <= 50) progressDistribution["26-50%"]++;
        else if (progress <= 75) progressDistribution["51-75%"]++;
        else progressDistribution["76-100%"]++;

        // KPI Stats
        if (p.indicators && p.indicators.length > 0) {
            p.indicators.forEach(ind => {
                totalIndicators++;
                const totalActual = ind.reportResults.reduce((sum, r) => sum + (r.actualValue || 0), 0);
                const target = ind.targetValue || 0;

                if (target > 0) {
                    const percent = (totalActual / target) * 100;
                    totalAchievementPercent += Math.min(percent, 100); // Cap at 100 for average calculation to avoid skew? Or not? Let's cap for "Overall Health"

                    if (totalActual >= target) {
                        achievedIndicators++;
                    }
                }
            });
        }
    });

    const kpiStats = {
        totalIndicators,
        achievedIndicators,
        avgAchievement: totalIndicators > 0 ? Math.round(totalAchievementPercent / totalIndicators) : 0,
    };

    return {
        totalProjects,
        avgProgress,
        totalBudget,
        totalSpent,
        statusCounts,
        departmentCounts,
        yearlyCounts,
        budgetByDepartment,
        progressDistribution,
        pendingReports: statusCounts.IN_PROGRESS,
        kpiStats,
        strategicCounts,
        projectsWithIssuesCount,
        avgProgressByDepartment
    };
}

// Get projects for report creation/editing (includes indicators)
export async function getProjectsForReport(userId?: number) {
    const where: Prisma.ProjectWhereInput = {
        isActive: true,
    };

    if (userId) {
        where.ownerUserId = userId;
    }

    return await db.project.findMany({
        where,
        include: {
            department: true,
            ownerUser: {
                select: {
                    id: true,
                    name: true,
                },
            },
            indicators: {
                select: {
                    id: true,
                    name: true,
                    unit: true,
                    targetValue: true,
                    baselineValue: true,
                },
            },
        },
    });
}

// ============================================
// Project Search
// ============================================

export interface SearchFilters {
    query?: string;
    status?: string;
    departmentId?: number;
    fiscalYear?: number;
    goalId?: number;
    page?: number;
    limit?: number;
}

export async function searchProjects(filters: SearchFilters = {}) {
    const {
        query = "",
        status,
        departmentId,
        fiscalYear,
        goalId,
        page = 1,
        limit = 20,
    } = filters;

    const where: Prisma.ProjectWhereInput = {
        isActive: true,
    };

    // Full-text search across name, code, and description
    if (query && query.trim()) {
        where.OR = [
            {
                name: {
                    contains: query.trim(),
                    mode: "insensitive",
                },
            },
            {
                code: {
                    contains: query.trim(),
                    mode: "insensitive",
                },
            },
            {
                description: {
                    contains: query.trim(),
                    mode: "insensitive",
                },
            },
        ];
    }

    // Advanced filters
    if (status) {
        where.status = status;
    }

    if (departmentId) {
        where.departmentId = departmentId;
    }

    if (fiscalYear) {
        where.fiscalYear = fiscalYear;
    }

    if (goalId) {
        where.developmentGoalId = goalId;
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
        db.project.findMany({
            where,
            skip,
            take: limit,
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                developmentGoal: {
                    select: {
                        id: true,
                        name: true,
                        issue: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                ownerUser: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [
                { createdAt: "desc" },
            ],
        }),
        db.project.count({ where }),
    ]);

    return {
        projects,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
    };
}

