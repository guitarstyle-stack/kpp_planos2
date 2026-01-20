import db from "@/lib/db";

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
    return await db.notification.create({
        data: {
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: data.type || "INFO",
            link: data.link,
        },
    });
}

export async function deleteNotification(notificationId: number) {
    return await db.notification.delete({
        where: { id: notificationId },
    });
}
