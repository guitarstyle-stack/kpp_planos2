"use server";

import { broadcastNotification, sendNotificationToDepartment, createNotification } from "@/services/notificationService";
import { requireAdmin } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function broadcastNotificationAction(formData: FormData) {
    await requireAdmin();

    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const link = formData.get("link") as string;
    const type = formData.get("type") as "INFO" | "WARNING" | "SUCCESS" | "ERROR" || "INFO";

    if (!title || !message) {
        throw new Error("Title and message are required");
    }

    const start = Date.now();
    const result = await broadcastNotification({
        title,
        message,
        link,
        type,
    });
    const duration = Date.now() - start;

    console.log(`Broadcast to ${result.count} users in ${duration}ms`);

    revalidatePath("/admin/notifications");
    return { success: true, count: result.count };
}

export async function sendDepartmentNotificationAction(departmentId: number, formData: FormData) {
    await requireAdmin();

    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const link = formData.get("link") as string;
    const type = formData.get("type") as "INFO" | "WARNING" | "SUCCESS" | "ERROR" || "INFO";

    if (!title || !message) {
        throw new Error("Title and message are required");
    }

    const result = await sendNotificationToDepartment(departmentId, {
        title,
        message,
        link,
        type,
    });

    revalidatePath("/admin/notifications");
    return { success: true, count: result.count };
}

export async function sendUserNotificationAction(userId: number, formData: FormData) {
    await requireAdmin();

    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const link = formData.get("link") as string;
    const type = formData.get("type") as "INFO" | "WARNING" | "SUCCESS" | "ERROR" || "INFO";

    if (!title || !message) {
        throw new Error("Title and message are required");
    }

    await createNotification({
        userId,
        title,
        message,
        link,
        type,
    });

    revalidatePath("/admin/notifications");
    return { success: true, count: 1 };
}
