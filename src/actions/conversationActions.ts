"use server";

import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import {
    createConversation,
    getConversations,
    getConversation,
    sendMessage,
    markMessagesAsRead,
    updateConversationStatus,
    addParticipant,
    getConversationStats,
    ConversationStatus,
    ConversationPriority,
} from "@/services/conversationService";
import { revalidatePath } from "next/cache";

// ============================================
// Types for Actions
// ============================================

interface ActionResponse<T = any> {
    success: boolean;
    error?: string;
    data?: T;
}

// ============================================
// Create Conversation
// ============================================

export async function createConversationAction(formData: {
    title: string;
    content: string;
    relatedType?: "PROJECT" | "REPORT" | "GENERAL";
    relatedId?: number;
    priority?: ConversationPriority;
    participantIds?: number[];
}): Promise<ActionResponse> {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const { title, content, relatedType, relatedId, priority, participantIds } = formData;

        if (!title || !content) {
            return { success: false, error: "กรุณากรอกหัวข้อและข้อความ" };
        }

        const conversation = await createConversation({
            initiatorId: session.user.id,
            title,
            content,
            relatedType,
            relatedId,
            priority,
            participantIds,
        });

        revalidatePath("/conversations");
        return { success: true, data: conversation };
    } catch (error: any) {
        console.error("Error creating conversation:", error);
        return { success: false, error: error.message || "เกิดข้อผิดพลาดในการสร้างการสนทนา" };
    }
}

// ============================================
// Get Conversations List
// ============================================

export async function getConversationsAction(filters?: {
    status?: ConversationStatus;
    priority?: ConversationPriority;
    page?: number;
    limit?: number;
}): Promise<ActionResponse> {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const result = await getConversations(session.user.id, filters);
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Error fetching conversations:", error);
        return { success: false, error: "เกิดข้อผิดพลาดในการโหลดการสนทนา" };
    }
}

// ============================================
// Get Single Conversation
// ============================================

export async function getConversationAction(conversationId: number): Promise<ActionResponse> {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const conversation = await getConversation(conversationId, session.user.id);
        return { success: true, data: conversation };
    } catch (error: any) {
        console.error("Error fetching conversation:", error);
        return {
            success: false,
            error: error.message === "Conversation not found or access denied"
                ? "ไม่พบการสนทนาหรือคุณไม่มีสิทธิ์เข้าถึง"
                : "เกิดข้อผิดพลาดในการโหลดการสนทนา"
        };
    }
}

// ============================================
// Send Message
// ============================================

export async function sendMessageAction(data: {
    conversationId: number;
    content: string;
    messageType?: "TEXT" | "SYSTEM" | "STATUS_CHANGE";
    attachments?: { fileName: string; fileUrl: string; fileType?: string }[];
}): Promise<ActionResponse> {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const { conversationId, content, messageType, attachments } = data;

        if (!content) {
            return { success: false, error: "กรุณากรอกข้อความ" };
        }

        const message = await sendMessage({
            conversationId,
            senderId: session.user.id,
            content,
            messageType,
            attachments,
        });

        revalidatePath(`/conversations/${conversationId}`);
        revalidatePath("/conversations");
        return { success: true, data: message };
    } catch (error: any) {
        console.error("Error sending message:", error);
        return {
            success: false,
            error: error.message === "You are not a participant of this conversation"
                ? "คุณไม่ได้เป็นสมาชิกของการสนทนานี้"
                : "เกิดข้อผิดพลาดในการส่งข้อความ"
        };
    }
}

// ============================================
// Mark Messages as Read
// ============================================

export async function markAsReadAction(
    conversationId: number,
    messageIds?: number[]
): Promise<ActionResponse> {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const result = await markMessagesAsRead(conversationId, session.user.id, messageIds);

        revalidatePath(`/conversations/${conversationId}`);
        revalidatePath("/conversations");
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Error marking messages as read:", error);
        return { success: false, error: "เกิดข้อผิดพลาดในการอัพเดทสถานะการอ่าน" };
    }
}

// ============================================
// Update Conversation Status (Admin Only)
// ============================================

export async function updateStatusAction(
    conversationId: number,
    status: ConversationStatus
): Promise<ActionResponse> {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const admin = await isAdmin();
        if (!admin) {
            return { success: false, error: "คุณไม่มีสิทธิ์ในการเปลี่ยนสถานะการสนทนา" };
        }

        const conversation = await updateConversationStatus(
            conversationId,
            status,
            session.user.id
        );

        revalidatePath(`/conversations/${conversationId}`);
        revalidatePath("/conversations");
        revalidatePath("/admin/conversations");
        return { success: true, data: conversation };
    } catch (error: any) {
        console.error("Error updating conversation status:", error);
        return {
            success: false,
            error: error.message === "Only admins can change conversation status"
                ? "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเปลี่ยนสถานะได้"
                : "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ"
        };
    }
}

// ============================================
// Add Participant (Admin Only)
// ============================================

export async function addParticipantAction(
    conversationId: number,
    userIdToAdd: number
): Promise<ActionResponse> {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const admin = await isAdmin();
        if (!admin) {
            return { success: false, error: "คุณไม่มีสิทธิ์ในการเพิ่มผู้เข้าร่วม" };
        }

        const participant = await addParticipant(
            conversationId,
            userIdToAdd,
            session.user.id
        );

        revalidatePath(`/conversations/${conversationId}`);
        revalidatePath("/conversations");
        return { success: true, data: participant };
    } catch (error: any) {
        console.error("Error adding participant:", error);
        return {
            success: false,
            error: error.message === "Only admins can add participants"
                ? "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเพิ่มผู้เข้าร่วมได้"
                : "เกิดข้อผิดพลาดในการเพิ่มผู้เข้าร่วม"
        };
    }
}

// ============================================
// Get Conversation Statistics (Admin Only)
// ============================================

export async function getConversationStatsAction(): Promise<ActionResponse> {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const admin = await isAdmin();
        if (!admin) {
            return { success: false, error: "คุณไม่มีสิทธิ์ในการดูสถิติ" };
        }

        const stats = await getConversationStats();
        return { success: true, data: stats };
    } catch (error: any) {
        console.error("Error fetching conversation stats:", error);
        return { success: false, error: "เกิดข้อผิดพลาดในการโหลดสถิติ" };
    }
}

// ============================================
// Get All Conversations (Admin Only)
// ============================================

export async function getAllConversationsAction(filters?: {
    status?: ConversationStatus;
    priority?: ConversationPriority;
    page?: number;
    limit?: number;
}): Promise<ActionResponse> {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const admin = await isAdmin();
        if (!admin) {
            return { success: false, error: "คุณไม่มีสิทธิ์ในการดูการสนทนาทั้งหมด" };
        }

        // Get all conversations (no user filter)
        const result = await getConversations(session.user.id, filters);
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Error fetching all conversations:", error);
        return { success: false, error: "เกิดข้อผิดพลาดในการโหลดการสนทนา" };
    }
}

// ============================================
// Delete Conversation (Admin Only)
// ============================================

export async function deleteConversationAction(
    conversationId: number
): Promise<ActionResponse> {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const admin = await isAdmin();
        if (!admin) {
            return { success: false, error: "คุณไม่มีสิทธิ์ในการลบการสนทนา" };
        }

        // Import db (prisma client)
        const db = (await import("@/lib/db")).default;

        await db.conversation.delete({
            where: { id: conversationId },
        });

        revalidatePath("/conversations");
        revalidatePath("/admin/conversations");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting conversation:", error);
        return { success: false, error: "เกิดข้อผิดพลาดในการลบการสนทนา" };
    }
}

// ============================================
// Update Conversation Title/Priority (Admin Only)
// ============================================

export async function updateConversationAction(
    conversationId: number,
    data: {
        title?: string;
        priority?: ConversationPriority;
    }
): Promise<ActionResponse> {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "กรุณาเข้าสู่ระบบ" };
        }

        const admin = await isAdmin();
        if (!admin) {
            return { success: false, error: "คุณไม่มีสิทธิ์ในการแก้ไขการสนทนา" };
        }

        // Import db (prisma client)
        const db = (await import("@/lib/db")).default;

        const conversation = await db.conversation.update({
            where: { id: conversationId },
            data,
        });

        revalidatePath(`/conversations/${conversationId}`);
        revalidatePath("/conversations");
        revalidatePath("/admin/conversations");
        return { success: true, data: conversation };
    } catch (error: any) {
        console.error("Error updating conversation:", error);
        return { success: false, error: "เกิดข้อผิดพลาดในการแก้ไขการสนทนา" };
    }
}

