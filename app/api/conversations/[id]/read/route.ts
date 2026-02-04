import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markMessagesAsRead } from "@/services/conversationService";

export const dynamic = "force-dynamic";

// POST /api/conversations/[id]/read - Mark messages as read
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const conversationId = parseInt(id);
        const body = await request.json();
        const { messageIds } = body; // Optional array of message IDs, or empty for all

        const result = await markMessagesAsRead(
            conversationId,
            session.user.id,
            messageIds
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error marking messages as read:", error);
        return NextResponse.json(
            { error: "Failed to mark messages as read" },
            { status: 500 }
        );
    }
}
