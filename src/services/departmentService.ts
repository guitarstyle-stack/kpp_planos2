import db from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function getDepartments() {
    return await db.department.findMany({
        orderBy: { id: "asc" },
    });
}

export async function createDepartment(data: Prisma.DepartmentUncheckedCreateInput) {
    return await db.department.create({ data });
}

export async function updateDepartment(id: number, data: Prisma.DepartmentUncheckedUpdateInput) {
    return await db.department.update({
        where: { id },
        data,
    });
}

export async function deleteDepartment(id: number) {
    return await db.department.delete({
        where: { id },
    });
}

export async function getDepartmentTypes() {
    return await db.departmentType.findMany({
        orderBy: { id: "asc" },
    });
}
