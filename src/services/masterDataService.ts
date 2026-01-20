import db from "@/lib/db";

export async function getDepartments() {
    return await db.department.findMany({
        where: { isActive: true },
        orderBy: { id: "asc" },
    });
}



// แผนพัฒนาสังคมประจำปี (แผนสูงสุด)
export async function getAnnualPlans() {
    return await db.annualPlan.findMany({
        where: { isActive: true },
        include: {
            issues: {
                include: {
                    goals: true,
                },
            },
        },
        orderBy: { fiscalYear: "desc" },
    });
}

// เป้าหมาย/เป้าประสงค์สำหรับ dropdown ใน ProjectForm
export async function getDevelopmentGoals() {
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

export async function getDepartmentTypes() {
    return await db.departmentType.findMany({
        where: { isActive: true },
        orderBy: { id: "asc" },
    });
}

