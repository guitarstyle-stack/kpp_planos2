import db from "@/lib/db";
import { Prisma, Project } from "@prisma/client";

export type ProjectWithDetails = Project & {
    department: { name: string };
    ownerUser: { name: string };

    developmentGoal: { name: string } | null;
};

export async function getProjects() {
    return await db.project.findMany({
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
            indicators: true,
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

    return {
        totalProjects,
        avgProgress,
        totalBudget,
        totalSpent,
        statusCounts,
        departmentCounts,
        yearlyCounts,
        pendingReports: statusCounts.IN_PROGRESS, // Projects in progress need updates
    };
}
