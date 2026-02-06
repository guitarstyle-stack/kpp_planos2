import { getSession } from "./auth";
import db from "./db";

export async function getCurrentUser() {
    const session = await getSession();
    if (!session?.userId) return null;

    return await db.user.findUnique({
        where: { id: session.userId },
        include: {
            department: true,
            roles: {
                include: {
                    role: true,
                },
            },
        },
    });
}

export async function hasRole(roleName: string) {
    const user = await getCurrentUser();
    if (!user) return false;

    return user.roles.some(ur => ur.role.name === roleName);
}

export async function isAdmin() {
    return await hasRole("ADMIN");
}

export async function isSysAdmin() {
    return await hasRole("SYSADMIN");
}

export async function requireAdmin() {
    const admin = await isAdmin();
    if (!admin) {
        throw new Error("Unauthorized: Admin access required");
    }
}
