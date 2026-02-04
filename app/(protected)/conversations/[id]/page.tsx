import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConversationAction, markAsReadAction } from "@/actions/conversationActions";
import { ConversationDetail } from "@/components/messaging/ConversationDetail";
import { MessageForm } from "@/components/messaging/MessageForm";
import { AdminConversationControls } from "@/components/messaging/AdminConversationControls";
import { isAdmin } from "@/lib/rbac";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export const dynamic = "force-dynamic";

export default async function ConversationDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getSession();
    if (!session?.user) {
        redirect("/");
    }

    const { id } = await params;
    const conversationId = parseInt(id);

    const result = await getConversationAction(conversationId);

    if (!result.success || !result.data) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    เกิดข้อผิดพลาด: {result.error || "ไม่สามารถโหลดการสนทนาได้"}
                </div>
                <Link
                    href="/conversations"
                    className="inline-block mt-4 text-blue-600 hover:underline"
                >
                    ← กลับไปยังรายการการสนทนา
                </Link>
            </div>
        );
    }

    const conversation = result.data;
    const admin = await isAdmin();

    // Mark messages as read (fire and forget)
    markAsReadAction(conversationId).catch(() => {
        // Silently fail - this is not critical
    });

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-4">
                <Link
                    href="/conversations"
                    className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                    กลับไปยังรายการการสนทนา
                </Link>
            </div>

            <Suspense fallback={<div>กำลังโหลด...</div>}>
                <div className="space-y-4">
                    <ConversationDetail
                        conversation={conversation}
                        currentUserId={session.user.id}
                    />

                    {admin && (
                        <AdminConversationControls
                            conversationId={conversationId}
                            currentStatus={conversation.status as any}
                            currentTitle={conversation.title}
                            currentPriority={conversation.priority as any}
                        />
                    )}

                    <MessageForm conversationId={conversationId} />
                </div>
            </Suspense>
        </div>
    );
}
