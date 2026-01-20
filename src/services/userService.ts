import db from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function getUsers() {
    return await db.user.findMany({
        include: {
            department: {
                select: {
                    id: true,
                    name: true,
                },
            },
            roles: {
                include: {
                    role: true,
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });
}

export async function getUserById(id: number) {
    return await db.user.findUnique({
        where: { id },
        include: {
            department: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
            roles: {
                include: {
                    role: true,
                },
            },
        },
    });
}

export async function updateUser(
    id: number,
    data: Prisma.UserUncheckedUpdateInput
) {
    return await db.user.update({
        where: { id },
        data,
    });
}

export async function updateUserStatus(id: number, isActive: boolean) {
    return await db.user.update({
        where: { id },
        data: { isActive },
    });
}

export async function updateUserDepartment(id: number, departmentId: number) {
    return await db.user.update({
        where: { id },
        data: { departmentId },
    });
}

export async function deleteUser(id: number) {
    // Soft delete by setting isActive to false
    return await db.user.update({
        where: { id },
        data: { isActive: false },
    });
}

export async function getRoles() {
    return await db.role.findMany({
        orderBy: { id: "asc" },
    });
}

