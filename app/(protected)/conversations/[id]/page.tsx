
import { getConversationAction } from "@/actions/conversationActions";
import { ConversationDetail } from "@/components/messaging/ConversationDetail";
import { MessageForm } from "@/components/messaging/MessageForm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export const dynamic = "force-dynamic";

export default async function ConversationDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await getSession();
    if (!session?.user) {
        redirect("/login");
    }

    const conversationId = parseInt(params.id);
    if (isNaN(conversationId)) {
        redirect("/conversations");
    }

    const { success, data: conversation, error } = await getConversationAction(conversationId);

    if (!success || !conversation) {
        return (
            <div className="p-8 text-center">
                <div className="alert alert-error max-w-lg mx-auto">
                    <span>{error || "ไม่พบการสนทนา"}</span>
                </div>
                <Link href="/conversations" className="btn btn-ghost mt-4">
                    กลับหน้ารายการ
                </Link>
            </div>
        );
    }

    // Check if current user is admin
    // We can check roles from session if available, or fetch user
    // Assuming session.user has roles or we infer from somewhere.
    // For now, let's assume we pass isAdmin if we can verify it.
    // However, the component ConversationDetail uses isAdmin for status controls.
    // Let's verify admin status via server check if needed, but session might not have full role info depending on implementation.
    // Let's trust session or check roles if they are in session.
    // Based on previous files, session.user might just have basic info. 
    // But `getConversationAction` already checks permissions for viewing.

    // We'll pass isAdmin as false for now unless we are sure.
    // Actually, let's use a utility if available. 
    // Reuse `isAdmin` from `lib/rbac` if valid on server component side? 
    // Yes, `isAdmin()` is used in actions.
    const { isAdmin } = await import("@/lib/rbac");
    const adminStatus = await isAdmin();

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <Link href="/conversations" className="btn btn-ghost btn-sm gap-2">
                    <FontAwesomeIcon icon={faArrowLeft} />
                    ย้อนกลับ
                </Link>
            </div>

            <ConversationDetail
                conversation={conversation}
                currentUserId={session.user.id}
                isAdmin={adminStatus}
            />

            <MessageForm
                conversationId={conversationId}
                onMessageSent={async () => {
                    "use server";
                    // This is client component prop, but we can't pass server action directly like this usually in this pattern
                    // Actually MessageForm takes a callback `onMessageSent`.
                    // We can just rely on revalidatePath in the action called by MessageForm.
                }}
            />
        </div>
    );
}
