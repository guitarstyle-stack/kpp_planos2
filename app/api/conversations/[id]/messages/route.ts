import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendMessage } from "@/services/conversationService";

export const dynamic = "force-dynamic";

// POST /api/conversations/[id]/messages - Send a message
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
        const { content, messageType, attachments } = body;

        if (!content) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        const message = await sendMessage({
            conversationId,
            senderId: session.user.id,
            content,
            messageType,
            attachments
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error: any) {
        console.error("Error sending message:", error);

        if (error.message === "You are not a participant of this conversation") {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 }
        );
    }
}
