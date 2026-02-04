import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConversationsAction } from "@/actions/conversationActions";
import { ConversationList } from "@/components/messaging/ConversationList";
import Link from "next/link";
import { ConversationsPageClient } from "./ConversationsPageClient";

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

    const result = await getConversationsAction({
        status,
        priority,
        page,
        limit: 20,
    });

    if (!result.success || !result.data) {
        return (
            <div className="space-y-6">
                <div className="alert alert-error">
                    <span>เกิดข้อผิดพลาด: {result.error || "ไม่สามารถโหลดการสนทนาได้"}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
