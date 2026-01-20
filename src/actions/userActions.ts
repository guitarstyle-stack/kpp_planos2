"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assignRole, removeRole } from "@/services/userRoleService";
import { createDepartment } from "@/services/departmentService";
import { updateUser, updateUserStatus, updateUserDepartment } from "@/services/userService";

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
        const rawData = {
            name: formData.get("name"),
            email: formData.get("email") || undefined,
            departmentId: formData.get("departmentId"),
        };

        const validatedData = UserUpdateSchema.parse(rawData);

        await updateUser(id, validatedData);

        revalidatePath("/users");
        revalidatePath(`/users/${id}/edit`);
        redirect("/users");
    } catch (error) {
        console.error(error);
        return { message: "Failed to update user" };
    }
}

export async function updateProfileAction(id: number, formData: FormData) {
    try {
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
        // If validatedData.email is "", force it to null?
        // Actually unique constraint violation occurs on "", so strictly use null for empty.
        // Our schema allows literal(""), so let's remap "" -> null just in case Zod passed it.
        if (validatedData.email === "") {
            validatedData.email = null;
        }

        await updateUser(id, validatedData);

        revalidatePath("/settings/profile");
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Profile Update Error:", error);
        return { message: "Failed to update profile", error };
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
        await updateUserStatus(userId, !currentStatus);
        revalidatePath("/users");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to toggle user status" };
    }
}

export async function assignRoleAction(userId: number, roleId: number) {
    try {
        await assignRole(userId, roleId);
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
        await removeRole(userId, roleId);
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
        await updateUserDepartment(userId, departmentId);
        revalidatePath("/users");
        revalidatePath(`/users/${userId}/edit`);
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: "Failed to update department" };
    }
}
