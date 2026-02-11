"use client";

import { useEffect, useRef } from "react";
import { ConversationStatusBadge } from "./ConversationStatusBadge";
import Link from "next/link";
import { markAsReadAction } from "@/actions/conversationActions";
import { AdminConversationControls } from "./AdminConversationControls";

interface Message {
    id: number;
    content: string;
    messageType: string;
    createdAt: Date | string;
    sender: {
        id: number;
        name: string;
        image: string | null;
    };
    readBy: Array<{
        user: {
            id: number;
            name: string;
        };
    }>;
}

interface Participant {
    user: {
        id: number;
        name: string;
        image: string | null;
        department: {
            name: string;
        };
    };
}

interface ConversationDetailProps {
    conversation: {
        id: number;
        title: string;
        status: string;
        priority: string;
        relatedType: string | null;
        relatedId: number | null;
        lastMessageAt: Date | string;
        createdAt: Date | string;
        initiator: {
            id: number;
            name: string;
        };
        participants: Participant[];
        messages: Message[];
    };
    currentUserId: number;
    isAdmin?: boolean;
}

export function ConversationDetail({ conversation, currentUserId, isAdmin = false }: ConversationDetailProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation.messages.length]);

    // Mark messages as read on mount or new messages
    useEffect(() => {
        const unreadMessageIds = conversation.messages
            .filter(msg =>
                msg.sender.id !== currentUserId &&
                !msg.readBy.some(r => r.user.id === currentUserId)
            )
            .map(msg => msg.id);

        if (unreadMessageIds.length > 0) {
            markAsReadAction(conversation.id, unreadMessageIds)
                .catch(err => console.error("Failed to mark messages as read", err));
        }
    }, [conversation.messages, conversation.id, currentUserId]);

    const formatMessageDate = (date: Date | string) => {
        return new Date(date).toLocaleString("th-TH", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getRelatedEntityLink = () => {
        if (conversation.relatedType === "PROJECT" && conversation.relatedId) {
            return (
                <Link
                    href={`/projects/${conversation.relatedId}`}
                    className="link link-primary text-sm"
                >
                    ดูโครงการที่เกี่ยวข้อง →
                </Link>
            );
        }
        if (conversation.relatedType === "REPORT" && conversation.relatedId) {
            return (
                <Link
                    href={`/reports/${conversation.relatedId}`}
                    className="link link-primary text-sm"
                >
                    ดูรายงานที่เกี่ยวข้อง →
                </Link>
            );
        }
        return null;
    };

    return (
        <div className="space-y-4">
            {/* Admin Controls */}
            {isAdmin && (
                <AdminConversationControls
                    conversationId={conversation.id}
                    currentStatus={conversation.status as any}
                    currentTitle={conversation.title}
                    currentPriority={conversation.priority as any}
                    onStatusChanged={() => {
                        // Optional: Refresh logic if needed, but actions usually revalidate path
                    }}
                />
            )}

            {/* Header */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">
                                {conversation.title}
                            </h1>
                            <div className="flex items-center gap-3 flex-wrap">
                                <ConversationStatusBadge status={conversation.status as any} />
                                <span className="text-sm opacity-70">
                                    เริ่มโดย: {conversation.initiator.name}
                                </span>
                                <span className="text-sm opacity-60">
                                    {formatMessageDate(conversation.createdAt)}
                                </span>
                            </div>
                        </div>
                        {getRelatedEntityLink()}
                    </div>

                    {/* Participants */}
                    <div className="divider"></div>
                    <div>
                        <h3 className="text-sm font-semibold mb-3">
                            ผู้เข้าร่วม ({conversation.participants.length} คน)
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {conversation.participants.map((participant) => (
                                <div
                                    key={participant.user.id}
                                    className="badge badge-lg gap-2"
                                >
                                    <div className="avatar">
                                        <div className="w-6 rounded-full">
                                            {participant.user.image ? (
                                                <img src={participant.user.image} alt={participant.user.name} />
                                            ) : (
                                                <div className="bg-primary text-primary-content rounded-full w-6 h-6 flex items-center justify-center">
                                                    <span className="text-xs">{participant.user.name.charAt(0)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm">
                                        {participant.user.name}
                                    </span>
                                    <span className="text-xs opacity-60">
                                        ({participant.user.department.name})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="card bg-base-100 shadow-sm border border-base-200 max-h-[50vh] lg:max-h-[600px] overflow-y-auto mb-20 lg:mb-0">
                <div className="card-body space-y-4">
                    {conversation.messages.length === 0 ? (
                        <div className="text-center opacity-50 py-8">
                            ยังไม่มีข้อความในการสนทนานี้
                        </div>
                    ) : (
                        conversation.messages.map((message) => {
                            const isOwnMessage = message.sender.id === currentUserId;
                            const isSystemMessage = message.messageType !== "TEXT";

                            if (isSystemMessage) {
                                return (
                                    <div
                                        key={message.id}
                                        className="flex justify-center"
                                    >
                                        <div className="badge badge-ghost badge-lg">
                                            {message.content}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={message.id}
                                    className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
                                >
                                    <div className="chat-image avatar">
                                        <div className="w-10 rounded-full">
                                            {message.sender.image ? (
                                                <img src={message.sender.image} alt={message.sender.name} />
                                            ) : (
                                                <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
                                                    <span className="text-sm">{message.sender.name.charAt(0)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`chat-bubble ${isOwnMessage ? "chat-bubble-primary" : ""}`}>
                                        {!isOwnMessage && (
                                            <div className="chat-header opacity-75 mb-1">
                                                {message.sender.name}
                                            </div>
                                        )}
                                        <div className="whitespace-pre-wrap break-words">
                                            {message.content}
                                        </div>
                                    </div>
                                    <div className="chat-footer opacity-60">
                                        <time className="text-xs">
                                            {formatMessageDate(message.createdAt)}
                                        </time>
                                        {isOwnMessage && message.readBy.length > 0 && (
                                            <span className="text-xs ml-2">
                                                • อ่านแล้ว {message.readBy.length} คน
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div >
    );
}
