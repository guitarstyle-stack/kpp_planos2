import { Suspense } from "react";
import { getConversationsAction } from "@/actions/conversationActions";
import { getAdminUsersAction } from "@/actions/userActions";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ConversationsPageHeader } from "@/components/messaging/ConversationsPageHeader";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface ConversationsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ConversationsPage({ searchParams }: ConversationsPageProps) {
    const session = await getSession();
    if (!session?.user) {
        redirect("/login");
    }

    const params = await searchParams;
    const page = Number(params.page) || 1;
    const status = params.status as any;
    const priority = params.priority as any;

    // Fetch conversations and admin users in parallel
    const [conversationsResult, adminUsersResult] = await Promise.all([
        getConversationsAction({
            page,
            limit: 20,
            status,
            priority,
        }),
        getAdminUsersAction()
    ]);

    const conversationsData = conversationsResult.success ? conversationsResult.data : {
        conversations: [],
        total: 0,
        totalPages: 0,
        unreadCount: 0
    };

    const adminUsers = (adminUsersResult.success && adminUsersResult.data) ? adminUsersResult.data : [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <ConversationsPageHeader adminUsers={adminUsers} />

            <Suspense fallback={<div className="text-center py-10">กำลังโหลดข้อมูล...</div>}>
                <ConversationList
                    initialConversations={conversationsData.conversations}
                    total={conversationsData.total}
                    page={conversationsData.page}
                    totalPages={conversationsData.totalPages}
                    unreadCount={conversationsData.unreadCount}
                />
            </Suspense>
        </div>
    );
}
