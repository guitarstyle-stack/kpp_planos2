import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/rbac";
import {
    getAllConversationsAction,
    getConversationStatsAction,
} from "@/actions/conversationActions";
import { ConversationList } from "@/components/messaging/ConversationList";

export const dynamic = "force-dynamic";

export default async function AdminConversationsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; status?: string; priority?: string }>;
}) {
    const session = await getSession();
    if (!session?.user) {
        redirect("/");
    }

    const admin = await isAdmin();
    if (!admin) {
        redirect("/dashboard");
    }

    const params = await searchParams;
    const page = parseInt(params.page || "1");
    const status = params.status as any;
    const priority = params.priority as any;

    const [conversationsResult, statsResult] = await Promise.all([
        getAllConversationsAction({
            status,
            priority,
            page,
            limit: 20,
        }),
        getConversationStatsAction(),
    ]);

    if (!conversationsResult.success || !conversationsResult.data) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    เกิดข้อผิดพลาด:{" "}
                    {conversationsResult.error || "ไม่สามารถโหลดการสนทนาได้"}
                </div>
            </div>
        );
    }

    const stats = statsResult.success ? statsResult.data : null;

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    จัดการข้อความ (ผู้ดูแลระบบ)
                </h1>
                <p className="text-gray-600 mt-1">
                    ดูและจัดการการสนทนาทั้งหมดในระบบ
                </p>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">ทั้งหมด</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.total}
                        </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
                        <div className="text-sm text-blue-600 mb-1">เปิด</div>
                        <div className="text-2xl font-bold text-blue-900">
                            {stats.byStatus.OPEN || 0}
                        </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
                        <div className="text-sm text-yellow-600 mb-1">
                            กำลังดำเนินการ
                        </div>
                        <div className="text-2xl font-bold text-yellow-900">
                            {stats.byStatus.IN_PROGRESS || 0}
                        </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
                        <div className="text-sm text-green-600 mb-1">แก้ไขแล้ว</div>
                        <div className="text-2xl font-bold text-green-900">
                            {stats.byStatus.RESOLVED || 0}
                        </div>
                    </div>
                </div>
            )}

            {/* Conversations List */}
            <Suspense fallback={<div>กำลังโหลด...</div>}>
                <ConversationList
                    initialConversations={conversationsResult.data.conversations}
                    total={conversationsResult.data.total}
                    page={conversationsResult.data.page}
                    totalPages={conversationsResult.data.totalPages}
                    unreadCount={conversationsResult.data.unreadCount}
                />
            </Suspense>
        </div>
    );
}
