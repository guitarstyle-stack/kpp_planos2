import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getConversation } from "@/services/conversationService";

export const dynamic = "force-dynamic";

// GET /api/conversations/[id] - Get single conversation with messages
export async function GET(
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
        const conversation = await getConversation(conversationId, session.user.id);

        return NextResponse.json(conversation);
    } catch (error: any) {
        console.error("Error fetching conversation:", error);

        if (error.message === "Conversation not found or access denied") {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(
            { error: "Failed to fetch conversation" },
            { status: 500 }
        );
    }
}
