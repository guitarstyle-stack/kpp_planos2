import db from "@/lib/db";

export async function getRoles() {
    return await db.role.findMany({
        orderBy: { name: "asc" },
    });
}

export async function getRoleById(id: number) {
    return await db.role.findUnique({
        where: { id },
    });
}

export async function createRole(name: string, label: string) {
    return await db.role.create({
        data: { name, label },
    });
}

export async function updateRole(id: number, name: string, label: string) {
    return await db.role.update({
        where: { id },
        data: { name, label },
    });
}

export async function deleteRole(id: number) {
    return await db.role.delete({
        where: { id },
    });
}

export async function getUserRoles(userId: number) {
    return await db.userRole.findMany({
        where: { userId },
        include: {
            role: true,
        },
    });
}

export async function assignRole(userId: number, roleId: number) {
    // Check if assignments exists
    const exists = await db.userRole.findFirst({
        where: { userId, roleId }
    });
    if (exists) return exists;

    return await db.userRole.create({
        data: {
            userId,
            roleId,
        },
    });
}

export async function removeRole(userId: number, roleId: number) {
    return await db.userRole.deleteMany({
        where: {
            userId,
            roleId,
        },
    });
}

export async function hasRole(userId: number, roleName: string) {
    const userRole = await db.userRole.findFirst({
        where: {
            userId,
            role: {
                name: roleName,
            },
        },
    });
    return !!userRole;
}
