"use client";

import { useState } from "react";
import Link from "next/link";
import { ConversationStatusBadge } from "./ConversationStatusBadge";
import { ConversationStatus, ConversationPriority } from "@/services/conversationService";

interface Conversation {
    id: number;
    title: string;
    status: ConversationStatus;
    priority: ConversationPriority;
    lastMessageAt: Date;
    initiator: {
        id: number;
        name: string;
    };
    participants: Array<{
        user: {
            id: number;
            name: string;
        };
    }>;
    messages: Array<{
        content: string;
        createdAt: Date;
        sender: {
            name: string;
        };
    }>;
    _count: {
        messages: number;
    };
}

interface ConversationListProps {
    initialConversations: Conversation[];
    total: number;
    page: number;
    totalPages: number;
    unreadCount: number;
}

export function ConversationList({
    initialConversations,
    total,
    page,
    totalPages,
    unreadCount,
}: ConversationListProps) {
    const [statusFilter, setStatusFilter] = useState<ConversationStatus | "">("");
    const [priorityFilter, setPriorityFilter] = useState<ConversationPriority | "">("");

    const formatDate = (date: Date) => {
        const d = new Date(date);
        const now = new Date();
        const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
        } else if (diffInHours < 48) {
            return "เมื่อวาน " + d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
        } else {
            return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
        }
    };

    const getPriorityBadge = (priority: ConversationPriority) => {
        const config: Record<ConversationPriority, { label: string; color: string }> = {
            LOW: { label: "ต่ำ", color: "badge-ghost" },
            NORMAL: { label: "ปกติ", color: "badge-info" },
            HIGH: { label: "สูง", color: "badge-warning" },
            URGENT: { label: "ด่วน", color: "badge-error" },
        };

        const { label, color } = config[priority];
        return (
            <span className={`badge badge-sm ${color}`}>
                {label}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-4">
                    <div className="flex gap-4 items-center flex-wrap">
                        <div>
                            <label className="label">
                                <span className="label-text">สถานะ</span>
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="select select-bordered select-sm"
                            >
                                <option value="">ทั้งหมด</option>
                                <option value="OPEN">เปิด</option>
                                <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                                <option value="RESOLVED">แก้ไขแล้ว</option>
                                <option value="CLOSED">ปิด</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text">ความสำคัญ</span>
                            </label>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value as any)}
                                className="select select-bordered select-sm"
                            >
                                <option value="">ทั้งหมด</option>
                                <option value="LOW">ต่ำ</option>
                                <option value="NORMAL">ปกติ</option>
                                <option value="HIGH">สูง</option>
                                <option value="URGENT">ด่วน</option>
                            </select>
                        </div>

                        <div className="ml-auto text-sm opacity-70">
                            ทั้งหมด {total} การสนทนา
                            {unreadCount > 0 && (
                                <span className="ml-2 text-primary font-medium">
                                    ({unreadCount} ยังไม่ได้อ่าน)
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Conversations List */}
            <div className="space-y-2">
                {initialConversations.length === 0 ? (
                    <div className="card bg-base-100 shadow-sm border border-base-200">
                        <div className="card-body text-center">
                            <p className="opacity-50">ไม่พบการสนทนา</p>
                        </div>
                    </div>
                ) : (
                    initialConversations.map((conversation) => (
                        <Link
                            key={conversation.id}
                            href={`/conversations/${conversation.id}`}
                            className="block card bg-base-100 shadow-sm border border-base-200 hover:shadow-md hover:border-primary/50 transition-all"
                        >
                            <div className="card-body p-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold truncate">
                                                {conversation.title}
                                            </h3>
                                            <ConversationStatusBadge status={conversation.status} />
                                            {(conversation.priority === "HIGH" ||
                                                conversation.priority === "URGENT") &&
                                                getPriorityBadge(conversation.priority)}
                                        </div>

                                        {conversation.messages.length > 0 && (
                                            <p className="text-sm opacity-70 truncate">
                                                <span className="font-medium">
                                                    {conversation.messages[0].sender.name}:
                                                </span>{" "}
                                                {conversation.messages[0].content}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 mt-2 text-xs opacity-60">
                                            <span>
                                                เริ่มโดย: {conversation.initiator.name}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {conversation.participants.length} คน
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {conversation._count.messages} ข้อความ
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 text-right">
                                        <div className="text-xs opacity-60">
                                            {formatDate(conversation.lastMessageAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <Link
                            key={p}
                            href={`/conversations?page=${p}${statusFilter ? `&status=${statusFilter}` : ""}${priorityFilter ? `&priority=${priorityFilter}` : ""}`}
                            className={`btn btn-sm ${p === page ? "btn-primary" : "btn-ghost"}`}
                        >
                            {p}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
