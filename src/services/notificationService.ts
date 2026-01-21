import db from "@/lib/db";
import { pushMessage, pushFlexMessage } from "./lineService";

export async function getNotifications(userId: number, limit: number = 10) {
    return await db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}

export async function getUnreadCount(userId: number) {
    return await db.notification.count({
        where: { userId, isRead: false },
    });
}

export async function markAsRead(notificationId: number) {
    return await db.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
    });
}

export async function markAllAsRead(userId: number) {
    return await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
    });
}

export async function createNotification(data: {
    userId: number;
    title: string;
    message: string;
    type?: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
    link?: string;
}) {
    const notification = await db.notification.create({
        data: {
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: data.type || "INFO",
            link: data.link,
        },
    });

    // Send LINE Notification if user has lineUserId
    try {
        const user = await db.user.findUnique({
            where: { id: data.userId },
            select: { lineUserId: true },
        });

        if (user?.lineUserId) {
            await pushFlexMessage(user.lineUserId, data.title, data.message, data.link, data.type);
        }
    } catch (error) {
        console.error("Background LINE notification failed:", error);
        // Do not fail the main request just because notification failed
    }

    return notification;
}

export async function deleteNotification(notificationId: number) {
    return await db.notification.delete({
        where: { id: notificationId },
    });
}

export async function broadcastNotification(data: {
    title: string;
    message: string;
    type?: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
    link?: string;
    createdById?: number;
}) {
    // 1. Get all active users
    const users = await db.user.findMany({
        where: { isActive: true },
        select: { id: true, lineUserId: true },
    });

    if (users.length === 0) return { count: 0 };

    // 2. Create notifications in DB (Batch)
    await db.notification.createMany({
        data: users.map(user => ({
            userId: user.id,
            title: data.title,
            message: data.message,
            type: data.type || "INFO",
            link: data.link,
        })),
    });

    // 3. Send LINE messages (Async)
    const lineUsers = users.filter(u => u.lineUserId);

    // Use Flex Message
    Promise.allSettled(lineUsers.map(u => pushFlexMessage(u.lineUserId, data.title, data.message, data.link, data.type)))
        .then(() => console.log(`Broadcasted to ${lineUsers.length} LINE users`))
        .catch(err => console.error("Broadcast LINE failed", err));

    return { count: users.length };
}

export async function sendNotificationToDepartment(departmentId: number, data: {
    title: string;
    message: string;
    type?: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
    link?: string;
}) {
    // 1. Get users in department
    const users = await db.user.findMany({
        where: { departmentId, isActive: true },
        select: { id: true, lineUserId: true },
    });

    if (users.length === 0) return { count: 0 };

    // 2. Create notifications
    await db.notification.createMany({
        data: users.map(user => ({
            userId: user.id,
            title: data.title,
            message: data.message,
            type: data.type || "INFO",
            link: data.link,
        })),
    });

    // 3. Send LINE
    const lineUsers = users.filter(u => u.lineUserId);

    Promise.allSettled(lineUsers.map(u => pushFlexMessage(u.lineUserId, data.title, data.message, data.link, data.type)))
        .then(() => console.log(`Department broadcast to ${lineUsers.length} LINE users`));

    return { count: users.length };
}

export async function getAllNotifications(limit: number = 20) {
    return await db.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
            user: {
                select: { name: true, department: { select: { name: true } } }
            }
        }
    });
}

export async function getNotificationStats() {
    const [total, byType] = await Promise.all([
        db.notification.count(),
        db.notification.groupBy({
            by: ['type'],
            _count: {
                type: true
            }
        })
    ]);

    const stats = {
        total,
        byType: {
            INFO: 0,
            WARNING: 0,
            SUCCESS: 0,
            ERROR: 0,
        },
        recentcount: 0 // Placeholder if needed
    };

    byType.forEach(group => {
        if (group.type in stats.byType) {
            stats.byType[group.type as keyof typeof stats.byType] = group._count.type;
        }
    });

    return stats;
}

// --- Templates ---
export async function getTemplates() {
    return await db.notificationTemplate.findMany({
        orderBy: { name: "asc" },
    });
}

export async function createTemplate(data: { name: string; title: string; message: string; link?: string; type?: string }) {
    return await db.notificationTemplate.create({
        data: {
            ...data,
            type: data.type || "INFO",
        }
    });
}

// --- Scheduling ---
export async function createSchedule(data: {
    title: string;
    message: string;
    link?: string;
    type?: string;
    targetType: string;
    targetId?: number;
    scheduledFor: Date;
}) {
    return await db.notificationSchedule.create({
        data: {
            ...data,
            type: data.type || "INFO",
            status: "PENDING",
        }
    });
}

export async function processDueSchedules() {
    const now = new Date();
    const dueSchedules = await db.notificationSchedule.findMany({
        where: {
            status: "PENDING",
            scheduledFor: { lte: now }
        }
    });

    console.log(`Processing ${dueSchedules.length} due schedules`);

    for (const schedule of dueSchedules) {
        try {
            // Update status first to prevent double sending if process takes long
            await db.notificationSchedule.update({
                where: { id: schedule.id },
                data: { status: "PROCESSING" }
            });

            const payload = {
                title: schedule.title,
                message: schedule.message,
                link: schedule.link || "",
                type: schedule.type as any
            };

            if (schedule.targetType === "BROADCAST") {
                await broadcastNotification(payload);
            } else if (schedule.targetType === "DEPARTMENT" && schedule.targetId) {
                await sendNotificationToDepartment(schedule.targetId, payload);
            } else if (schedule.targetType === "USER" && schedule.targetId) {
                await createNotification({ userId: schedule.targetId, ...payload });
            }

            await db.notificationSchedule.update({
                where: { id: schedule.id },
                data: { status: "SENT", sentAt: new Date() }
            });

        } catch (error) {
            console.error(`Failed to process schedule ${schedule.id}`, error);
            await db.notificationSchedule.update({
                where: { id: schedule.id },
                data: { status: "FAILED" }
            });
        }
    }
}
