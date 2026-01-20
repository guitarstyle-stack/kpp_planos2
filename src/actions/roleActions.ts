"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/rbac";
import {
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    removeRole,
} from "@/services/userRoleService";

const RoleSchema = z.object({
    name: z.string().min(1, "Name is required"),
    label: z.string().min(1, "Label is required"),
});

export async function createRoleAction(formData: FormData) {
    try {
        await requireAdmin();
        const rawData = {
            name: formData.get("name"),
            label: formData.get("label"),
        };
        const validated = RoleSchema.parse(rawData);
        await createRole(validated.name, validated.label);
        revalidatePath("/settings/roles");
        return { success: true };
    } catch (error) {
        console.error("Create Role Error:", error);
        return { success: false, message: "Failed to create role" };
    }
}

export async function updateRoleAction(id: number, formData: FormData) {
    try {
        await requireAdmin();
        const rawData = {
            name: formData.get("name"),
            label: formData.get("label"),
        };
        const validated = RoleSchema.parse(rawData);
        await updateRole(id, validated.name, validated.label);
        revalidatePath("/settings/roles");
        return { success: true };
    } catch (error) {
        console.error("Update Role Error:", error);
        return { success: false, message: "Failed to update role" };
    }
}

export async function deleteRoleAction(id: number) {
    try {
        await requireAdmin();
        await deleteRole(id);
        revalidatePath("/settings/roles");
        return { success: true };
    } catch (error) {
        console.error("Delete Role Error:", error);
        return { success: false, message: "Failed to delete role" };
    }
}

export async function assignRoleAction(userId: number, roleId: number) {
    try {
        await requireAdmin();
        await assignRole(userId, roleId);
        revalidatePath("/settings/roles"); // Revalidate where the user list is shown
        return { success: true };
    } catch (error) {
        console.error("Assign Role Error:", error);
        return { success: false, message: "Failed to assign role" };
    }
}

export async function removeRoleAction(userId: number, roleId: number) {
    try {
        await requireAdmin();
        await removeRole(userId, roleId);
        revalidatePath("/settings/roles");
        return { success: true };
    } catch (error) {
        console.error("Remove Role Error:", error);
        return { success: false, message: "Failed to remove role" };
    }
}
