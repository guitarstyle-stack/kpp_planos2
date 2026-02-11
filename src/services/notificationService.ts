import db from "@/lib/db";
import { pushMessage, pushFlexMessage, multicastFlexMessage } from "./lineService";

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
    imageUrl?: string;
    channels?: string[]; // ["LINE", "WEB"]
}) {
    const channels = data.channels || ["LINE", "WEB"];
    let notification = null;

    // 1. Web Channel (Save to DB)
    if (channels.includes("WEB")) {
        notification = await db.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type || "INFO",
                link: data.link,
                imageUrl: data.imageUrl,
            },
        });
    }

    // 2. LINE Channel
    if (channels.includes("LINE")) {
        try {
            const user = await db.user.findUnique({
                where: { id: data.userId },
                select: { lineUserId: true },
            });

            if (user?.lineUserId) {
                await pushFlexMessage(user.lineUserId, data.title, data.message, data.link, data.type, data.imageUrl);
            }
        } catch (error) {
            console.error("Background LINE notification failed:", error);
        }
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
    imageUrl?: string;
    createdById?: number;
    channels?: string[];
}) {
    const channels = data.channels || ["LINE", "WEB"];

    // 1. Get all active users
    const users = await db.user.findMany({
        where: { isActive: true },
        select: { id: true, lineUserId: true },
    });

    if (users.length === 0) return { count: 0 };

    // 2. WEB Channel: Create notifications in DB (Batch)
    if (channels.includes("WEB")) {
        await db.notification.createMany({
            data: users.map(user => ({
                userId: user.id,
                title: data.title,
                message: data.message,
                type: data.type || "INFO",
                link: data.link,
                imageUrl: data.imageUrl,
            })),
        });
    }

    // 3. LINE Channel: Send LINE messages (Multicast)
    if (channels.includes("LINE")) {
        const lineUserIds = users.map(u => u.lineUserId);
        await multicastFlexMessage(lineUserIds, data.title, data.message, data.link, data.type, data.imageUrl);
        console.log(`Broadcasted to ${lineUserIds.filter(id => !!id).length} LINE users`);
    }

    return { count: users.length };
}

export async function sendNotificationToDepartment(departmentId: number, data: {
    title: string;
    message: string;
    type?: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
    link?: string;
    imageUrl?: string;
    channels?: string[];
}) {
    const channels = data.channels || ["LINE", "WEB"];

    // 1. Get users in department
    const users = await db.user.findMany({
        where: { departmentId, isActive: true },
        select: { id: true, lineUserId: true },
    });

    if (users.length === 0) return { count: 0 };

    // 2. WEB Channel
    if (channels.includes("WEB")) {
        await db.notification.createMany({
            data: users.map(user => ({
                userId: user.id,
                title: data.title,
                message: data.message,
                type: data.type || "INFO",
                link: data.link,
                imageUrl: data.imageUrl,
            })),
        });
    }

    // 3. LINE Channel
    if (channels.includes("LINE")) {
        const lineUserIds = users.filter(u => u.lineUserId).map(u => u.lineUserId);
        await multicastFlexMessage(lineUserIds, data.title, data.message, data.link, data.type, data.imageUrl);
        console.log(`Department broadcast to ${lineUserIds.length} LINE users`);
    }

    return { count: users.length };
}

export async function sendNotificationToRoles(roleIds: number[], data: {
    title: string;
    message: string;
    type?: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
    link?: string;
    imageUrl?: string;
    channels?: string[];
}) {
    const channels = data.channels || ["LINE", "WEB"];

    // 1. Get users with roles
    const users = await db.user.findMany({
        where: {
            isActive: true,
            roles: {
                some: {
                    roleId: { in: roleIds }
                }
            }
        },
        select: { id: true, lineUserId: true },
    });

    if (users.length === 0) return { count: 0 };

    // 2. WEB Channel
    if (channels.includes("WEB")) {
        await db.notification.createMany({
            data: users.map(user => ({
                userId: user.id,
                title: data.title,
                message: data.message,
                type: data.type || "INFO",
                link: data.link,
                imageUrl: data.imageUrl,
            })),
        });
    }

    // 3. LINE Channel
    if (channels.includes("LINE")) {
        const lineUserIds = users.filter(u => u.lineUserId).map(u => u.lineUserId);
        await multicastFlexMessage(lineUserIds, data.title, data.message, data.link, data.type, data.imageUrl);
        console.log(`Role broadcast to ${lineUserIds.length} LINE users`);
    }

    return { count: users.length };
}

export async function sendNotificationToMultipleUsers(userIds: number[], data: {
    title: string;
    message: string;
    type?: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
    link?: string;
    imageUrl?: string;
    channels?: string[];
}) {
    const channels = data.channels || ["LINE", "WEB"];

    const users = await db.user.findMany({
        where: {
            id: { in: userIds },
            isActive: true
        },
        select: { id: true, lineUserId: true },
    });

    if (users.length === 0) return { count: 0 };

    // 2. WEB Channel
    if (channels.includes("WEB")) {
        await db.notification.createMany({
            data: users.map(user => ({
                userId: user.id,
                title: data.title,
                message: data.message,
                type: data.type || "INFO",
                link: data.link,
                imageUrl: data.imageUrl,
            })),
        });
    }

    // 3. LINE Channel
    if (channels.includes("LINE")) {
        const lineUserIds = users.filter(u => u.lineUserId).map(u => u.lineUserId);
        await multicastFlexMessage(lineUserIds, data.title, data.message, data.link, data.type, data.imageUrl);
        console.log(`Multi-user broadcast to ${lineUserIds.length} LINE users`);
    }

    return { count: users.length };
}

export async function sendNotificationToMultipleDepartments(departmentIds: number[], data: {
    title: string;
    message: string;
    type?: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
    link?: string;
    imageUrl?: string;
    channels?: string[];
}) {
    const channels = data.channels || ["LINE", "WEB"];

    const users = await db.user.findMany({
        where: {
            departmentId: { in: departmentIds },
            isActive: true
        },
        select: { id: true, lineUserId: true },
    });

    if (users.length === 0) return { count: 0 };

    // 2. WEB Channel
    if (channels.includes("WEB")) {
        await db.notification.createMany({
            data: users.map(user => ({
                userId: user.id,
                title: data.title,
                message: data.message,
                type: data.type || "INFO",
                link: data.link,
                imageUrl: data.imageUrl,
            })),
        });
    }

    // 3. LINE Channel
    if (channels.includes("LINE")) {
        const lineUserIds = users.filter(u => u.lineUserId).map(u => u.lineUserId);
        await multicastFlexMessage(lineUserIds, data.title, data.message, data.link, data.type, data.imageUrl);
        console.log(`Multi-department broadcast to ${lineUserIds.length} LINE users`);
    }

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
export async function createTemplate(data: { name: string; title: string; message: string; link?: string; type?: string; imageUrl?: string }) {
    return await db.notificationTemplate.create({
        data: {
            ...data,
            type: data.type || "INFO",
        }
    });
}

export async function updateTemplate(id: number, data: { name?: string; title?: string; message?: string; link?: string; type?: string; imageUrl?: string }) {
    return await db.notificationTemplate.update({
        where: { id },
        data
    });
}

export async function deleteTemplate(id: number) {
    return await db.notificationTemplate.delete({
        where: { id }
    });
}

// --- Scheduling ---
export async function createSchedule(data: {
    title: string;
    message: string;
    link?: string;
    imageUrl?: string;
    type?: string;
    targetType: string;
    targetId?: number;
    targetIds?: number[];
    channels?: string[];
    scheduledFor: Date;
}) {
    return await db.notificationSchedule.create({
        data: {
            ...data,
            type: data.type || "INFO",
            status: "PENDING",
            targetIds: data.targetIds || [],
            channels: data.channels || ["LINE", "WEB"],
        }
    });
}

export async function getAllSchedules() {
    return await db.notificationSchedule.findMany({
        orderBy: { scheduledFor: "desc" },
    });
}

export async function updateSchedule(id: number, data: {
    title?: string;
    message?: string;
    link?: string;
    imageUrl?: string;
    type?: string;
    scheduledFor?: Date;
    status?: string;
}) {
    return await db.notificationSchedule.update({
        where: { id },
        data
    });
}

export async function deleteSchedule(id: number) {
    return await db.notificationSchedule.delete({
        where: { id }
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
                type: schedule.type as "INFO" | "WARNING" | "SUCCESS" | "ERROR",
                imageUrl: schedule.imageUrl || undefined,
                channels: schedule.channels as string[] || ["LINE", "WEB"],
            };

            if (schedule.targetType === "BROADCAST") {
                await broadcastNotification(payload);
            } else if (schedule.targetType === "DEPARTMENT" && schedule.targetId) {
                await sendNotificationToDepartment(schedule.targetId, payload);
            } else if (schedule.targetType === "USER" && schedule.targetId) {
                await createNotification({ userId: schedule.targetId, ...payload });
            } else if (schedule.targetType === "ROLES" && schedule.targetIds.length > 0) {
                await sendNotificationToRoles(schedule.targetIds, payload);
            } else if (schedule.targetType === "MULTI_USERS" && schedule.targetIds.length > 0) {
                await sendNotificationToMultipleUsers(schedule.targetIds, payload);
            } else if (schedule.targetType === "MULTI_DEPARTMENTS" && schedule.targetIds.length > 0) {
                await sendNotificationToMultipleDepartments(schedule.targetIds, payload);
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

export async function getRoles() {
    return await db.role.findMany({
        orderBy: { name: "asc" },
    });
}
