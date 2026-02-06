"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/errorCodes";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { assignRole, removeRole } from "@/services/userRoleService";
import { createDepartment } from "@/services/departmentService";
import { updateUser, updateUserStatus, updateUserDepartment, getUsers, getUserById } from "@/services/userService";

const UserUpdateSchema = z.object({
    name: z.string().min(1, "กรุณาระบุชื่อ"),
    email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")),
    departmentId: z.coerce.number().optional(),
});

const ProfileUpdateSchema = z.object({
    name: z.string().min(1, "กรุณาระบุชื่อที่ใช้แสดง"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().nullable().or(z.literal("")),
    departmentId: z.coerce.number().optional(),
});

export async function updateUserAction(id: number, formData: FormData) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return createErrorResponse("กรุณาเข้าสู่ระบบ", ErrorCodes.AUTH_LOGIN_REQUIRED);
        }

        const oldUser = await getUserById(id);
        if (!oldUser) {
            return createErrorResponse("ไม่พบผู้ใช้งาน", ErrorCodes.USER_NOT_FOUND);
        }

        const rawData = {
            name: formData.get("name"),
            email: formData.get("email") || undefined,
            departmentId: formData.get("departmentId"),
        };

        const validatedData = UserUpdateSchema.parse(rawData);

        const updatedUser = await updateUser(id, validatedData);

        // Audit Log
        await createAuditLog({
            action: "UPDATE",
            entityType: "User",
            entityId: id,
            userId: currentUser.id,
            diffBefore: oldUser,
            diffAfter: updatedUser,
            description: `Updated user info for ${updatedUser.name}`
        });

        revalidatePath("/users");
        revalidatePath(`/users/${id}/edit`);

        return createSuccessResponse(null, "อัปเดตข้อมูลผู้ใช้สำเร็จ");
    } catch (error) {
        console.error(error);
        return createErrorResponse("ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้", ErrorCodes.USER_UPDATE_FAILED, error);
    }
}

export async function updateProfileAction(id: number, formData: FormData) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return createErrorResponse("กรุณาเข้าสู่ระบบ", ErrorCodes.AUTH_LOGIN_REQUIRED);
        }

        const oldUser = await getUserById(id);
        if (!oldUser) {
            return createErrorResponse("ไม่พบโปรไฟล์", ErrorCodes.USER_NOT_FOUND);
        }

        const emailRaw = formData.get("email") as string;
        // If email is empty string, convert to null to clear it in DB (and avoid unique constraint on empty string)
        // If email is provided, valid it.
        const email = (emailRaw && emailRaw.trim() !== "") ? emailRaw : null;

        const rawData = {
            name: formData.get("name"),
            firstName: formData.get("firstName") || undefined,
            lastName: formData.get("lastName") || undefined,
            phoneNumber: formData.get("phoneNumber") || undefined,
            email: email,
            departmentId: formData.get("departmentId"),
        };

        // Note: validating 'null' with Zod requires .nullable()
        const validatedData = ProfileUpdateSchema.parse(rawData);

        // Zod might return "" if we allowed literal(""), but we want null for DB.
        // If validatedData.email is "" force it to null?
        // Actually unique constraint violation occurs on "", so strictly use null for empty.
        // Our schema allows literal(""), so let's remap "" -> null just in case Zod passed it.
        if (validatedData.email === "") {
            validatedData.email = null;
        }

        const updatedUser = await updateUser(id, validatedData);

        // Audit Log
        await createAuditLog({
            action: "UPDATE",
            entityType: "User",
            entityId: id,
            userId: currentUser.id,
            diffBefore: oldUser,
            diffAfter: updatedUser,
            description: `Updated profile for ${updatedUser.name}`
        });

        revalidatePath("/settings/profile");
        revalidatePath("/", "layout");
        return createSuccessResponse(null, "อัปเดตโปรไฟล์สำเร็จ");
    } catch (error) {
        console.error("Profile Update Error:", error);
        return createErrorResponse("ไม่สามารถอัปเดตโปรไฟล์ได้", ErrorCodes.USER_UPDATE_FAILED, error);
    }
}

export async function createDepartmentAction(formData: FormData) {
    try {
        const name = formData.get("name") as string;
        const typeId = Number(formData.get("typeId")); // Optional if we have DepartmentType

        if (!name) return { message: "Department name is required" };

        const randomCode = "D" + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        const newDept = await createDepartment({
            name,
            code: randomCode, // Auto-generate simple code
            typeId: typeId || undefined,
            isActive: true
        });

        revalidatePath("/settings/profile");
        return { success: true, department: newDept };
    } catch (error) {
        console.error("Create Department Error:", error);
        return { message: "Failed to create department" };
    }
}

export async function toggleUserStatusAction(userId: number, currentStatus: boolean) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { message: "Unauthorized" };
        }

        const updatedUser = await updateUserStatus(userId, !currentStatus);

        // Audit Log
        await createAuditLog({
            action: "UPDATE",
            entityType: "User",
            entityId: userId,
            userId: currentUser.id,
            diffBefore: { isActive: currentStatus },
            diffAfter: { isActive: !currentStatus },
            description: `${!currentStatus ? 'Activated' : 'Deactivated'} user account for ${updatedUser.name}`
        });

        revalidatePath("/users");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to toggle user status" };
    }
}

export async function assignRoleAction(userId: number, roleId: number) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { message: "Unauthorized" };
        }

        await assignRole(userId, roleId);

        // Audit Log
        const targetUser = await getUserById(userId);
        const role = await db.role.findUnique({ where: { id: roleId } });

        await createAuditLog({
            action: "UPDATE",
            entityType: "UserRole",
            entityId: userId,
            userId: currentUser.id,
            description: `Assigned role ${role?.name || roleId} to user ${targetUser?.name || userId}`
        });

        revalidatePath("/users");
        revalidatePath(`/users/${userId}/edit`);
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to assign role" };
    }
}

export async function removeRoleAction(userId: number, roleId: number) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { message: "Unauthorized" };
        }

        await removeRole(userId, roleId);

        // Audit Log
        const targetUser = await getUserById(userId);
        const role = await db.role.findUnique({ where: { id: roleId } });

        await createAuditLog({
            action: "UPDATE",
            entityType: "UserRole",
            entityId: userId,
            userId: currentUser.id,
            description: `Removed role ${role?.name || roleId} from user ${targetUser?.name || userId}`
        });

        revalidatePath("/users");
        revalidatePath(`/users/${userId}/edit`);
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to remove role" };
    }
}

export async function updateDepartmentAction(userId: number, departmentId: number) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { message: "Unauthorized" };
        }

        const oldUser = await getUserById(userId);
        const updatedUser = await updateUserDepartment(userId, departmentId);

        // Audit Log
        await createAuditLog({
            action: "UPDATE",
            entityType: "User",
            entityId: userId,
            userId: currentUser.id,
            diffBefore: { departmentId: oldUser?.departmentId },
            diffAfter: { departmentId: departmentId },
            description: `Updated department for user ${updatedUser.name}`
        });

        revalidatePath("/users");
        revalidatePath(`/users/${userId}/edit`);
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to update department" };
    }
}

export async function getAdminUsersAction() {
    try {
        const users = await getUsers();
        // Filter only users with ADMIN role
        const adminUsers = users.filter(user =>
            user.roles.some((r: any) => r.role.name === "ADMIN")
        );

        return { success: true, data: adminUsers };
    } catch (error) {
        console.error("Error fetching admin users:", error);
        return { success: false, error: "Failed to fetch admin users" };
    }
}
