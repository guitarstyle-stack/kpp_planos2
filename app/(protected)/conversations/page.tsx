import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConversationsAction, getConversationStatsAction } from "@/actions/conversationActions";
import { ConversationList } from "@/components/messaging/ConversationList";
import Link from "next/link";
import { ConversationsPageClient } from "./ConversationsPageClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faEnvelopeOpen, faExclamationTriangle, faFire } from "@fortawesome/free-solid-svg-icons";

export const dynamic = "force-dynamic";

export default async function ConversationsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; status?: string; priority?: string }>;
}) {
    const session = await getSession();
    if (!session?.user) {
        redirect("/");
    }

    const params = await searchParams;
    const page = parseInt(params.page || "1");
    const status = params.status as any;
    const priority = params.priority as any;

    const [result, statsResult] = await Promise.all([
        getConversationsAction({
            status,
            priority,
            page,
            limit: 20,
        }),
        getConversationStatsAction()
    ]);

    if (!result.success || !result.data) {
        return (
            <div className="space-y-6">
                <div className="alert alert-error">
                    <span>เกิดข้อผิดพลาด: {result.error || "ไม่สามารถโหลดการสนทนาได้"}</span>
                </div>
            </div>
        );
    }

    const stats = statsResult.success && statsResult.data ? statsResult.data : {
        total: 0,
        openConversations: 0,
        unreadCount: 0,
        byPriority: {}
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">
                        ข้อความ
                    </h1>
                    <p className="text-sm opacity-70">
                        จัดการการสนทนาและข้อความของคุณ
                    </p>
                </div>
                <ConversationsPageClient />
            </div>

            {/* Stats Cards */}
            <div className="stats shadow-sm border border-base-200 w-full bg-base-100 lg:stats-horizontal stats-vertical">
                <div className="stat">
                    <div className="stat-figure text-primary">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faComments} className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="stat-title opacity-70">การสนทนาทั้งหมด</div>
                    <div className="stat-value text-primary">{stats.total}</div>
                    <div className="stat-desc">ทั้งหมดในระบบ</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-success">
                        <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faEnvelopeOpen} className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="stat-title opacity-70">เปิด/กำลังดำเนินการ</div>
                    <div className="stat-value text-success">{stats.openConversations}</div>
                    <div className="stat-desc">ที่ยังไม่ปิด</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-warning">
                        <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="stat-title opacity-70">ข้อความยังไม่ได้อ่าน</div>
                    <div className="stat-value text-warning">{stats.unreadCount}</div>
                    <div className="stat-desc">ที่ต้องตรวจสอบ</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-error">
                        <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faFire} className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="stat-title opacity-70">ความสำคัญด่วน</div>
                    <div className="stat-value text-error">{(stats.byPriority?.['URGENT'] || 0) + (stats.byPriority?.['HIGH'] || 0)}</div>
                    <div className="stat-desc">ระดับสูง/ด่วน</div>
                </div>
            </div>

            <Suspense fallback={<div className="loading loading-spinner loading-lg"></div>}>
                <ConversationList
                    initialConversations={result.data.conversations}
                    total={result.data.total}
                    page={result.data.page}
                    totalPages={result.data.totalPages}
                    unreadCount={result.data.unreadCount}
                />
            </Suspense>
        </div>
    );
}
