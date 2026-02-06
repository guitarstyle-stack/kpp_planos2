"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const DepartmentSchema = z.object({
    code: z.string().optional(),
    name: z.string().min(1, "กรุณาระบุชื่อหน่วยงาน"),
    typeId: z.coerce.number().optional(),
    isActive: z.coerce.string().optional().transform(val => val === "on"),
});

// Helper function to generate department code from name
function generateDepartmentCode(name: string): string {
    // Extract Thai/English characters and convert to uppercase
    const cleaned = name
        .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9]/g, '') // Keep only Thai, English, numbers
        .toUpperCase();

    // Take first 4 characters or less
    const prefix = cleaned.substring(0, 4) || 'DEPT';

    // Add random 2-digit number for uniqueness
    const suffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');

    return `${prefix}-${suffix}`;
}

export async function createDepartmentAction(prevState: any, formData: FormData) {
    try {
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

        await db.department.create({
            data: {
                name: validatedData.name,
                code: validatedData.code!,
                typeId: validatedData.typeId || null,
                isActive: validatedData.isActive || false,
            },
        });

        revalidatePath("/settings/departments");
    } catch (error) {
        console.log(error)
        return { message: "Failed to create department" };
    }
}

export async function updateDepartmentAction(id: number, formData: FormData) {
    try {
        const rawData = {
            code: formData.get("code"),
            name: formData.get("name"),
            typeId: formData.get("typeId"),
            isActive: formData.get("isActive"),
        };

        const validatedData = DepartmentSchema.parse(rawData);

        await db.department.update({
            where: { id },
            data: {
                name: validatedData.name,
                code: validatedData.code,
                typeId: validatedData.typeId || null,
                isActive: validatedData.isActive || false,
            },
        });

        revalidatePath("/settings/departments");
    } catch (error) {
        return { message: "Failed to update department" };
    }
}

export async function deleteDepartmentAction(id: number) {
    try {
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

        await db.department.delete({
            where: { id },
        });

        revalidatePath("/settings/departments");
        return { success: true };
    } catch (error) {
        console.error("Error deleting department:", error);
        return { message: "เกิดข้อผิดพลาดในการลบหน่วยงาน" };
    }
}
