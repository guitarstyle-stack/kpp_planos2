import db from "@/lib/db";
import { Prisma, Project } from "@prisma/client";

export type ProjectWithDetails = Project & {
    department: { name: string };
    ownerUser: { name: string };

    developmentGoal: { name: string } | null;
};

export interface ProjectFilters {
    departmentId?: number;
}

export async function getProjects(filters: ProjectFilters = {}) {
    const where: Prisma.ProjectWhereInput = {
        isActive: true,
    };

    if (filters.departmentId) {
        where.departmentId = filters.departmentId;
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
                        take: 1,
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
    projects.forEach(p => {
        const deptName = p.department?.name || "ไม่ระบุ";
        departmentCounts[deptName] = (departmentCounts[deptName] || 0) + 1;
    });

    // Count by fiscal year
    const yearlyCounts: Record<string, number> = {};
    projects.forEach(p => {
        const year = p.fiscalYear.toString();
        yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
    });
    // Aggregations for Budget and Progress
    const budgetByDepartment: Record<string, { total: number; spent: number }> = {};
    const progressDistribution = {
        "0-25%": 0,
        "26-50%": 0,
        "51-75%": 0,
        "76-100%": 0,
    };

    projects.forEach(p => {
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
    });

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
        pendingReports: statusCounts.IN_PROGRESS, // Projects in progress need updates
    };
}
