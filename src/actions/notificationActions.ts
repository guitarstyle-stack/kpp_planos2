"use server";

import { ErrorCodes, createErrorResponse, createSuccessResponse } from "@/lib/errorCodes";
import {
    broadcastNotification,
    sendNotificationToDepartment,
    createNotification,
    createTemplate,
    createSchedule,
    sendNotificationToRoles,
    sendNotificationToMultipleUsers,
    sendNotificationToMultipleDepartments
} from "@/services/notificationService";
import { requireAdmin } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function sendAdvancedNotificationAction(formData: FormData) {
    await requireAdmin();

    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const link = formData.get("link") as string;
    const type = formData.get("type") as "INFO" | "WARNING" | "SUCCESS" | "ERROR" || "INFO";
    const imageUrl = formData.get("imageUrl") as string;
    const scheduledFor = formData.get("scheduledFor") as string;

    const targetType = formData.get("targetType") as string; // "all", "department", "user", "role", "multi_user", "multi_dept"
    const targetId = formData.get("targetId") ? Number(formData.get("targetId")) : undefined;

    // Channels selection
    const rawChannels = formData.get("channels") as string;
    const channels = rawChannels ? rawChannels.split(",") : ["LINE", "WEB"];

    // Parse targetIds (comma separated or multiple entries)
    const targetIdsRaw = formData.get("targetIds") as string;
    const targetIds = targetIdsRaw ? targetIdsRaw.split(",").map(Number).filter(n => !isNaN(n)) : [];

    const isInteractive = formData.get("isInteractive") === "true";

    if (!title || !message) {
        throw new Error("Title and message are required");
    }

    const payload = { title, message, link, type, imageUrl, channels };

    if (isInteractive) {
        const { getSession } = await import("@/lib/auth");
        const { createConversation } = await import("@/services/conversationService");
        const session = await getSession();
        if (!session?.user?.id) throw new Error("Unauthorized");

        // Create the public announcement thread
        await createConversation({
            initiatorId: session.user.id,
            title: title,
            content: message,
            isPublic: true,
            type: "ANNOUNCEMENT"
        });

        // If "WebApp" channel is NOT selected, we still want to broadcast as a system notification?
        // Actually, if it's interactive, the announcement board will pull from Conversations.
        // But we might still want a LINE notification.
        if (channels.includes("LINE")) {
            await broadcastNotification({ ...payload, channels: ["LINE"] });
        }

        revalidatePath("/admin/notifications");
        revalidatePath("/announcements");
        return { success: true, count: 1, interactive: true };
    }

    if (scheduledFor) {
        await createSchedule({
            ...payload,
            targetType: targetType.toUpperCase(),
            targetId,
            targetIds,
            scheduledFor: new Date(scheduledFor)
        });
        revalidatePath("/admin/notifications");
        return { success: true, count: 0, scheduled: true };
    }

    let result = { count: 0 };
    if (targetType === "all") {
        result = await broadcastNotification(payload);
    } else if (targetType === "department" && targetId) {
        result = await sendNotificationToDepartment(targetId, payload);
    } else if (targetType === "user" && targetId) {
        await createNotification({ userId: targetId, ...payload });
        result = { count: 1 };
    } else if (targetType === "role" && targetIds.length > 0) {
        result = await sendNotificationToRoles(targetIds, payload);
    } else if (targetType === "multi_user" && targetIds.length > 0) {
        result = await sendNotificationToMultipleUsers(targetIds, payload);
    } else if (targetType === "multi_dept" && targetIds.length > 0) {
        result = await sendNotificationToMultipleDepartments(targetIds, payload);
    } else {
        throw new Error("Invalid target selection");
    }

    revalidatePath("/admin/notifications");
    revalidatePath("/announcements");
    return { success: true, count: result.count };
}

export async function broadcastNotificationAction(formData: FormData) {
    return sendAdvancedNotificationAction(formData);
}

// Keep legacy actions for compatibility if needed elsewhere, but they can all point to advanced
export async function sendDepartmentNotificationAction(departmentId: number, formData: FormData) {
    formData.set("targetType", "department");
    formData.set("targetId", departmentId.toString());
    return sendAdvancedNotificationAction(formData);
}

export async function sendUserNotificationAction(userId: number, formData: FormData) {
    formData.set("targetType", "user");
    formData.set("targetId", userId.toString());
    return sendAdvancedNotificationAction(formData);
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
