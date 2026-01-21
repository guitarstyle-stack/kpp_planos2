"use server";

import {
    broadcastNotification,
    sendNotificationToDepartment,
    createNotification,
    createTemplate,
    createSchedule
} from "@/services/notificationService";
import { requireAdmin } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function broadcastNotificationAction(formData: FormData) {
    await requireAdmin();

    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const link = formData.get("link") as string;
    const type = formData.get("type") as "INFO" | "WARNING" | "SUCCESS" | "ERROR" || "INFO";

    // Scheduling (Optional)
    const scheduledFor = formData.get("scheduledFor") as string;

    if (!title || !message) {
        throw new Error("Title and message are required");
    }

    if (scheduledFor) {
        await createSchedule({
            title,
            message,
            link,
            type,
            targetType: "BROADCAST",
            scheduledFor: new Date(scheduledFor)
        });
        revalidatePath("/admin/notifications");
        return { success: true, count: 0, scheduled: true };
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
    const scheduledFor = formData.get("scheduledFor") as string;

    if (!title || !message) {
        throw new Error("Title and message are required");
    }

    if (scheduledFor) {
        await createSchedule({
            title,
            message,
            link,
            type,
            targetType: "DEPARTMENT",
            targetId: departmentId,
            scheduledFor: new Date(scheduledFor)
        });
        revalidatePath("/admin/notifications");
        return { success: true, count: 0, scheduled: true };
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
    const scheduledFor = formData.get("scheduledFor") as string;

    if (!title || !message) {
        throw new Error("Title and message are required");
    }

    if (scheduledFor) {
        await createSchedule({
            title,
            message,
            link,
            type,
            targetType: "USER",
            targetId: userId,
            scheduledFor: new Date(scheduledFor)
        });
        revalidatePath("/admin/notifications");
        return { success: true, count: 0, scheduled: true };
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

export async function createTemplateAction(formData: FormData) {
    await requireAdmin();

    const name = formData.get("name") as string;
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const link = formData.get("link") as string;
    const type = formData.get("type") as string;

    if (!name || !title || !message) {
        throw new Error("Missing required fields");
    }

    await createTemplate({
        name, title, message, link, type
    });

    revalidatePath("/admin/notifications");
    return { success: true };
}
