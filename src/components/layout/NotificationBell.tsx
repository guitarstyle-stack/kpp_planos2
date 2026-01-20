"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCheck, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
    link?: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationBellProps {
    userId: number;
}

const typeColors: Record<string, string> = {
    INFO: "text-info",
    WARNING: "text-warning",
    SUCCESS: "text-success",
    ERROR: "text-error",
};

export function NotificationBell({ userId }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, [userId]);

    async function fetchNotifications() {
        try {
            const res = await fetch(`/api/notifications?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleMarkAsRead(notificationId: number) {
        try {
            await fetch(`/api/notifications/${notificationId}/read`, { method: "POST" });
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    }

    async function handleMarkAllAsRead() {
        try {
            await fetch(`/api/notifications/mark-all-read`, { method: "POST", body: JSON.stringify({ userId }) });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    }

    function formatTime(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "เมื่อสักครู่";
        if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
        return `${diffDays} วันที่แล้ว`;
    }

    return (
        <div className="dropdown dropdown-end">
            <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="indicator">
                    <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="badge badge-sm badge-primary indicator-item">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </div>
            </div>
            <div
                tabIndex={0}
                className="dropdown-content z-50 mt-3 card card-compact w-80 bg-base-100 shadow-lg border border-base-300"
            >
                <div className="card-body">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold">การแจ้งเตือน</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="btn btn-ghost btn-xs"
                            >
                                <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                                อ่านทั้งหมด
                            </button>
                        )}
                    </div>

                    <div className="divider my-0"></div>

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <span className="loading loading-spinner loading-sm"></span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-base-content/50">
                            <FontAwesomeIcon icon={faBell} className="h-8 w-8 mb-2 opacity-30" />
                            <p>ไม่มีการแจ้งเตือน</p>
                        </div>
                    ) : (
                        <ul className="space-y-2 max-h-80 overflow-y-auto">
                            {notifications.map((notification) => (
                                <li
                                    key={notification.id}
                                    className={`p-3 rounded-lg hover:bg-base-200 transition-colors ${!notification.isRead ? "bg-primary/5 border-l-4 border-primary" : ""
                                        }`}
                                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-medium text-sm ${typeColors[notification.type]}`}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs text-base-content/50">
                                            {formatTime(notification.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-base-content/70 mt-1 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    {notification.link && (
                                        <Link
                                            href={notification.link}
                                            className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                                        >
                                            ดูรายละเอียด
                                            <FontAwesomeIcon icon={faExternalLink} className="h-3 w-3" />
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
