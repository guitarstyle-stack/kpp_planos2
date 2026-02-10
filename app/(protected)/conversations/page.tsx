
import { Suspense } from "react";
import { getConversationsAction } from "@/actions/conversationActions";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ConversationsPageHeader } from "@/components/messaging/ConversationsPageHeader";
import { getUsers } from "@/services/userService";

export const dynamic = "force-dynamic";

export default async function ConversationsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; status?: string; priority?: string }>;
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const status = params.status as any;
    const priority = params.priority as any;

    // Fetch conversations
    const { success, data } = await getConversationsAction({
        page,
        status,
        priority,
    });

    // Fetch potential participants (e.g. admins to start chat with)
    // For now, we'll fetch all users who are ADMIN or support staff
    // But as per the request, we pass "adminUsers". 
    // Let's filter users who have ADMIN role.
    const allUsers = await getUsers();
    const adminUsers = allUsers.filter(u =>
        u.roles.some(r => r.role.name === "ADMIN")
    );
    // Also include the current user's department active users? 
    // For now, let's just pass all active users if the "adminUsers" prop is actually "availableUsers" in the modal
    // The Modal prop is "availableUsers". Header prop is "adminUsers". 
    // Let's pass all active users to be safe and flexible.
    const availableUsers = allUsers.filter(u => u.isActive);

    if (!success || !data) {
        return (
            <div className="p-4 text-center text-error">
                เกิดข้อผิดพลาดในการโหลดข้อมูลการสนทนา
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ConversationsPageHeader adminUsers={availableUsers} />

            <Suspense fallback={<div className="text-center py-10">กำลังโหลด...</div>}>
                <ConversationList
                    initialConversations={data.conversations}
                    total={data.total}
                    page={data.page}
                    totalPages={data.totalPages}
                    unreadCount={data.unreadCount}
                />
            </Suspense>
        </div>
    );
}
