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
