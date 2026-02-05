import db from "@/lib/db";
import { createNotification } from "./notificationService";

// ============================================
// Types
// ============================================
export type ConversationStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type ConversationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type MessageType = "TEXT" | "SYSTEM" | "STATUS_CHANGE";

interface CreateConversationParams {
    initiatorId: number;
    title: string;
    content: string; // First message
    relatedType?: "PROJECT" | "REPORT" | "GENERAL";
    relatedId?: number;
    priority?: ConversationPriority;
    participantIds?: number[]; // Auto-add participants
}

interface SendMessageParams {
    conversationId: number;
    senderId: number;
    content: string;
    messageType?: MessageType;
    attachments?: { fileName: string; fileUrl: string; fileType?: string }[];
}

// ============================================
// Conversation CRUD
// ============================================

/**
 * Create a new conversation with initial message
 */
export async function createConversation(params: CreateConversationParams) {
    const {
        initiatorId,
        title,
        content,
        relatedType,
        relatedId,
        priority = "NORMAL",
        participantIds = []
    } = params;

    // Create conversation with first message and participants in a transaction
    const conversation = await db.conversation.create({
        data: {
            title,
            initiatorId,
            relatedType,
            relatedId,
            priority,
            status: "OPEN",
            messages: {
                create: {
                    senderId: initiatorId,
                    content,
                    messageType: "TEXT"
                }
            },
            participants: {
                create: [
                    // Add initiator as participant
                    { userId: initiatorId, role: "MEMBER" },
                    // Add additional participants
                    ...participantIds
                        .filter(id => id !== initiatorId)
                        .map(userId => ({ userId, role: "MEMBER" }))
                ]
            }
        },
        include: {
            initiator: {
                select: { id: true, name: true }
            },
            messages: true,
            participants: {
                include: {
                    user: {
                        select: { id: true, name: true, department: { select: { name: true } } }
                    }
                }
            }
        }
    });

    // Notify participants (except initiator)
    // const recipientIds = participantIds.filter(id => id !== initiatorId);
    // await notifyParticipants(recipientIds, {
    //     title: `การสนทนาใหม่: ${title}`,
    //     message: content.substring(0, 100),
    //     conversationId: conversation.id
    // });

    return conversation;
}

/**
 * Get conversations for a user with filters
 */
export async function getConversations(userId: number, filters?: {
    status?: ConversationStatus;
    priority?: ConversationPriority;
    page?: number;
    limit?: number;
}) {
    const { status, priority, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;

    // Find conversations where user is a participant
    const where: any = {
        participants: {
            some: {
                userId,
                leftAt: null // Not left
            }
        }
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [conversations, total, unreadCount] = await Promise.all([
        db.conversation.findMany({
            where,
            orderBy: { lastMessageAt: "desc" },
            skip,
            take: limit,
            include: {
                initiator: {
                    select: { id: true, name: true }
                },
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: {
                        content: true,
                        createdAt: true,
                        sender: {
                            select: { name: true }
                        }
                    }
                },
                _count: {
                    select: { messages: true }
                }
            }
        }),
        db.conversation.count({ where }),
        // Count conversations with unread messages
        db.conversation.count({
            where: {
                ...where,
                messages: {
                    some: {
                        senderId: { not: userId },
                        readBy: {
                            none: { userId }
                        }
                    }
                }
            }
        })
    ]);

    return {
        conversations,
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Get single conversation with all messages
 */
export async function getConversation(conversationId: number, userId: number) {
    const conversation = await db.conversation.findFirst({
        where: {
            id: conversationId,
            participants: {
                some: { userId, leftAt: null }
            }
        },
        include: {
            initiator: {
                select: { id: true, name: true }
            },
            participants: {
                include: {
                    user: {
                        select: { id: true, name: true, image: true, department: { select: { name: true } } }
                    }
                }
            },
            messages: {
                orderBy: { createdAt: "asc" },
                include: {
                    sender: {
                        select: { id: true, name: true, image: true }
                    },
                    readBy: {
                        include: {
                            user: {
                                select: { id: true, name: true }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!conversation) {
        throw new Error("Conversation not found or access denied");
    }

    return conversation;
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(params: SendMessageParams) {
    const { conversationId, senderId, content, messageType = "TEXT", attachments } = params;

    // Verify sender is a participant
    const participant = await db.conversationParticipant.findFirst({
        where: {
            conversationId,
            userId: senderId,
            leftAt: null
        }
    });

    if (!participant) {
        throw new Error("You are not a participant of this conversation");
    }

    // Create message and update conversation
    const message = await db.conversationMessage.create({
        data: {
            conversationId,
            senderId,
            content,
            messageType,
            attachments: attachments || undefined
        },
        include: {
            sender: {
                select: { id: true, name: true, image: true }
            }
        }
    });

    // Update conversation lastMessageAt
    await db.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
    });

    // Get all participants except sender
    const participants = await db.conversationParticipant.findMany({
        where: {
            conversationId,
            userId: { not: senderId },
            leftAt: null
        },
        select: { userId: true }
    });

    // Notify participants
    // const conversation = await db.conversation.findUnique({
    //     where: { id: conversationId },
    //     select: { title: true }
    // });

    // await notifyParticipants(participants.map(p => p.userId), {
    //     title: `ข้อความใหม่: ${conversation?.title}`,
    //     message: content.substring(0, 100),
    //     conversationId
    // });

    return message;
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId: number, userId: number, messageIds?: number[]) {
    // Get messages to mark as read
    const where: any = {
        conversationId,
        senderId: { not: userId } // Don't mark own messages
    };

    if (messageIds && messageIds.length > 0) {
        where.id = { in: messageIds };
    }

    const messages = await db.conversationMessage.findMany({
        where,
        select: { id: true }
    });

    // Create read receipts (ignore duplicates)
    const receipts = messages.map(msg => ({
        messageId: msg.id,
        userId
    }));

    if (receipts.length > 0) {
        await db.conversationReadReceipt.createMany({
            data: receipts,
            skipDuplicates: true
        });
    }

    return { markedCount: receipts.length };
}

/**
 * Update conversation status
 */
export async function updateConversationStatus(
    conversationId: number,
    status: ConversationStatus,
    userId: number
) {
    // Check if user is admin or has permission
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            roles: {
                include: { role: true }
            }
        }
    });

    const isAdmin = user?.roles.some(r => r.role.name === "ADMIN");

    if (!isAdmin) {
        throw new Error("Only admins can change conversation status");
    }

    const updateData: any = { status };

    if (status === "CLOSED") {
        updateData.closedAt = new Date();
        updateData.closedById = userId;
    }

    const conversation = await db.conversation.update({
        where: { id: conversationId },
        data: updateData,
        include: {
            participants: {
                select: { userId: true }
            }
        }
    });

    // Create system message
    await db.conversationMessage.create({
        data: {
            conversationId,
            senderId: userId,
            content: `สถานะเปลี่ยนเป็น: ${status}`,
            messageType: "STATUS_CHANGE"
        }
    });

    // Notify participants
    // await notifyParticipants(conversation.participants.map(p => p.userId), {
    //     title: `สถานะการสนทนาเปลี่ยนแปลง`,
    //     message: `สถานะเปลี่ยนเป็น: ${status}`,
    //     conversationId
    // });

    return conversation;
}

/**
 * Add participant to conversation
 */
export async function addParticipant(conversationId: number, userIdToAdd: number, addedBy: number) {
    // Check if adder is admin
    const user = await db.user.findUnique({
        where: { id: addedBy },
        include: {
            roles: {
                include: { role: true }
            }
        }
    });

    const isAdmin = user?.roles.some(r => r.role.name === "ADMIN");

    if (!isAdmin) {
        throw new Error("Only admins can add participants");
    }

    const participant = await db.conversationParticipant.create({
        data: {
            conversationId,
            userId: userIdToAdd,
            role: "MEMBER"
        },
        include: {
            user: {
                select: { id: true, name: true }
            }
        }
    });

    // Notify the new participant
    // const conversation = await db.conversation.findUnique({
    //     where: { id: conversationId },
    //     select: { title: true }
    // });

    // await createNotification({
    //     userId: userIdToAdd,
    //     title: "เพิ่มคุณเข้าสู่การสนทนา",
    //     message: `คุณได้ถูกเพิ่มเข้าสู่การสนทนา: ${conversation?.title}`,
    //     type: "INFO",
    //     link: `/conversations/${conversationId}`
    // });

    return participant;
}

// ============================================
// Helper Functions
// ============================================

async function notifyParticipants(userIds: number[], data: {
    title: string;
    message: string;
    conversationId: number;
}) {
    const notifications = userIds.map(userId =>
        createNotification({
            userId,
            title: data.title,
            message: data.message,
            type: "INFO",
            link: `/conversations/${data.conversationId}`
        })
    );

    await Promise.allSettled(notifications);
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(userId?: number) {
    const where: any = userId ? {
        participants: {
            some: { userId, leftAt: null }
        }
    } : {};

    const [total, byStatus, byPriority, unreadCount] = await Promise.all([
        db.conversation.count({ where }),
        db.conversation.groupBy({
            by: ['status'],
            where,
            _count: { status: true }
        }),
        db.conversation.groupBy({
            by: ['priority'],
            where,
            _count: { priority: true }
        }),
        // Count conversations with unread messages for this user
        userId ? db.conversation.count({
            where: {
                ...where,
                messages: {
                    some: {
                        senderId: { not: userId },
                        readBy: {
                            none: { userId }
                        }
                    }
                }
            }
        }) : 0
    ]);

    const statusCounts = Object.fromEntries(byStatus.map(g => [g.status, g._count.status]));
    const priorityCounts = Object.fromEntries(byPriority.map(g => [g.priority, g._count.priority]));

    return {
        total,
        openConversations: (statusCounts['OPEN'] || 0) + (statusCounts['IN_PROGRESS'] || 0),
        unreadCount,
        byStatus: statusCounts,
        byPriority: priorityCounts
    };
}
