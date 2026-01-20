import db from "@/lib/db";

// ดึงแผนพัฒนาสังคมประจำปีทั้งหมด
export async function getAnnualPlans() {
    return await db.annualPlan.findMany({
        where: { isActive: true },
        include: {
            issues: {
                include: {
                    goals: {
                        include: {
                            indicators: true,
                        },
                    },
                },
            },
        },
        orderBy: { fiscalYear: "desc" },
    });
}

// ดึงแผนพัฒนาสังคมประจำปีพร้อมประเด็นและเป้าหมาย
export async function getAnnualPlanById(id: number) {
    return await db.annualPlan.findUnique({
        where: { id },
        include: {
            issues: {
                include: {
                    goals: {
                        include: {
                            indicators: true,
                        },
                    },
                },
            },
        },
    });
}

// ดึงประเด็นการพัฒนาทั้งหมด
export async function getDevelopmentIssues(annualPlanId?: number) {
    return await db.developmentIssue.findMany({
        where: annualPlanId ? { annualPlanId } : undefined,
        include: {
            annualPlan: true,
            goals: true,
        },
        orderBy: { code: "asc" },
    });
}

// ดึงเป้าหมายทั้งหมด
export async function getDevelopmentGoals(issueId?: number) {
    return await db.developmentGoal.findMany({
        where: issueId ? { issueId } : undefined,
        include: {
            issue: {
                include: {
                    annualPlan: true,
                },
            },
            indicators: true,
        },
        orderBy: { code: "asc" },
    });
}

// ดึงเป้าหมายสำหรับ cascading dropdown
export async function getDevelopmentGoalsForDropdown() {
    return await db.developmentGoal.findMany({
        include: {
            issue: {
                select: {
                    id: true,
                    name: true,
                    annualPlan: {
                        select: { id: true, name: true, fiscalYear: true },
                    },
                },
            },
        },
        orderBy: { code: "asc" },
    });
}
