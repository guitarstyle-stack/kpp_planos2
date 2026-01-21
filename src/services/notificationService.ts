import db from "@/lib/db";
import { pushMessage } from "./lineService";

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
            const lineMessage = `${data.title}\n\n${data.message}\n\n${data.link ? `ดูรายละเอียด: ${process.env.NEXT_PUBLIC_APP_URL || ""}${data.link}` : ""}`;
            await pushMessage(user.lineUserId, lineMessage);
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
    const lineMessage = `${data.title}\n\n${data.message}\n\n${data.link ? `ดูรายละเอียด: ${process.env.NEXT_PUBLIC_APP_URL || ""}${data.link}` : ""}`;

    // Note: In a real production system, we should use a queue or LINE Multicast API.
    // For now, we'll loop pushMessage (Limit 2000 requests/sec, should be fine for now)
    Promise.allSettled(lineUsers.map(u => pushMessage(u.lineUserId, lineMessage)))
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
    const lineMessage = `${data.title}\n\n${data.message}\n\n${data.link ? `ดูรายละเอียด: ${process.env.NEXT_PUBLIC_APP_URL || ""}${data.link}` : ""}`;

    Promise.allSettled(lineUsers.map(u => pushMessage(u.lineUserId, lineMessage)))
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
