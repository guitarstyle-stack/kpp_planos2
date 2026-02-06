import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConversationAction } from "@/actions/conversationActions";
import { isAdmin } from "@/lib/rbac";
import { ConversationDetail } from "@/components/messaging/ConversationDetail";
import { MessageForm } from "@/components/messaging/MessageForm";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

export const dynamic = "force-dynamic";

interface ConversationPageProps {
    params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
    const session = await getSession();
    if (!session?.user) {
        redirect("/login");
    }

    const { id } = await params;
    const conversationId = parseInt(id);
    const admin = await isAdmin();

    // Fetch conversation
    const result = await getConversationAction(conversationId);

    if (!result.success || !result.data) {
        return (
            <div className="space-y-6">
                <div className="alert alert-error">
                    <span>{result.error || "ไม่พบการสนทนา"}</span>
                </div>
                <Link href="/conversations" className="btn btn-outline">
                    <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                    กลับไปหน้ารวม
                </Link>
            </div>
        );
    }

    const conversation = result.data;

    return (
        <div className="space-y-4 pb-4 animate-in slide-in-from-right duration-300">
            {/* Back Button */}
            <div className="flex items-center gap-2">
                <Link href="/conversations" className="btn btn-ghost btn-sm gap-2 pl-0 hover:bg-transparent hover:text-primary">
                    <FontAwesomeIcon icon={faChevronLeft} />
                    กลับไปหน้ารวม
                </Link>
            </div>

            <Suspense fallback={<div className="loading loading-spinner loading-lg"></div>}>
                <ConversationDetail
                    conversation={conversation}
                    currentUserId={session.user.id}
                    isAdmin={admin}
                />
            </Suspense>

            <MessageForm conversationId={conversationId} />
        </div>
    );
}
