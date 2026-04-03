"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

const DepartmentSchema = z.object({
    code: z.string().optional(),
    name: z.string().min(1, "กรุณาระบุชื่อหน่วยงาน"),
    typeId: z.coerce.number().optional(),
    isActive: z.coerce.string().optional().transform(val => val === "on"),
});

// Helper function to generate department code from name
function generateDepartmentCode(name: string): string {
    // Extract only English characters and numbers, and convert to uppercase
    const cleaned = name
        .replace(/[^a-zA-Z0-9]/g, '') // Keep only English, numbers (no Thai)
        .toUpperCase();

    // Take first 4 characters. If no English letters found, default to 'DEPT'
    const prefix = cleaned.substring(0, 4) || 'DEPT';

    // Add random 3-digit number for uniqueness
    const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    return `${prefix}-${suffix}`;
}

export async function createDepartmentAction(prevState: any, formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { message: "Unauthorized" };
        }

        const rawData = {
            code: formData.get("code"),
            name: formData.get("name"),
            typeId: formData.get("typeId"),
            isActive: formData.get("isActive"),
        };

        const validatedData = DepartmentSchema.parse(rawData);

        // Auto-generate code if not provided
        if (!validatedData.code || validatedData.code.trim() === '') {
            validatedData.code = generateDepartmentCode(validatedData.name);
        }

        const newDepartment = await db.department.create({
            data: {
                name: validatedData.name,
                code: validatedData.code!,
                typeId: validatedData.typeId || null,
                isActive: validatedData.isActive || false,
            },
        });

        // Audit Log
        if (user) {
            await createAuditLog({
                action: "CREATE",
                entityType: "Department",
                entityId: newDepartment.id,
                userId: user.id,
                diffAfter: newDepartment,
                description: `Created department ${newDepartment.name}`
            });
        }

        revalidatePath("/settings/departments");
    } catch (error) {
        console.log(error)
        return { message: "Failed to create department" };
    }
}

export async function updateDepartmentAction(id: number, formData: FormData) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { message: "Unauthorized" };
        }

        const rawData = {
            code: formData.get("code"),
            name: formData.get("name"),
            typeId: formData.get("typeId"),
            isActive: formData.get("isActive"),
        };

        const validatedData = DepartmentSchema.parse(rawData);

        const oldDepartment = await db.department.findUnique({ where: { id } });

        const updatedDepartment = await db.department.update({
            where: { id },
            data: {
                name: validatedData.name,
                code: validatedData.code,
                typeId: validatedData.typeId || null,
                isActive: validatedData.isActive || false,
            },
        });

        // Audit Log
        if (user && oldDepartment) {
            await createAuditLog({
                action: "UPDATE",
                entityType: "Department",
                entityId: updatedDepartment.id,
                userId: user.id,
                diffBefore: oldDepartment,
                diffAfter: updatedDepartment,
                description: `Updated department ${updatedDepartment.name}`
            });
        }

        revalidatePath("/settings/departments");
    } catch (error) {
        return { message: "Failed to update department" };
    }
}

export async function deleteDepartmentAction(id: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { message: "Unauthorized" };
        }

        // Check for dependencies
        const userCount = await db.user.count({
            where: { departmentId: id }
        });

        if (userCount > 0) {
            return { message: `ไม่สามารถลบได้ เนื่องจากมีผู้ใช้งาน ${userCount} คนในสังกัดนี้` };
        }

        const projectCount = await db.project.count({
            where: { departmentId: id }
        });

        if (projectCount > 0) {
            return { message: `ไม่สามารถลบได้ เนื่องจากมีโครงการ ${projectCount} โครงการในสังกัดนี้` };
        }

        const childDepartmentCount = await db.department.count({
            where: { parentId: id }
        });

        if (childDepartmentCount > 0) {
            return { message: `ไม่สามารถลบได้ เนื่องจากมีหน่วยงานย่อย ${childDepartmentCount} หน่วยงาน` };
        }

        const oldDepartment = await db.department.findUnique({ where: { id } });

        await db.department.delete({
            where: { id },
        });

        // Audit Log
        if (user && oldDepartment) {
            await createAuditLog({
                action: "DELETE",
                entityType: "Department",
                entityId: id,
                userId: user.id,
                diffBefore: oldDepartment,
                description: `Deleted department ${oldDepartment.name}`
            });
        }

        revalidatePath("/settings/departments");
        return { success: true };
    } catch (error) {
        console.error("Error deleting department:", error);
        return { message: "เกิดข้อผิดพลาดในการลบหน่วยงาน" };
    }
}
