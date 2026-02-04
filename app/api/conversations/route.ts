import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createConversation, getConversations } from "@/services/conversationService";

export const dynamic = "force-dynamic";

// GET /api/conversations - List conversations
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") as any;
        const priority = searchParams.get("priority") as any;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const result = await getConversations(session.user.id, {
            status,
            priority,
            page,
            limit
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json(
            { error: "Failed to fetch conversations" },
            { status: 500 }
        );
    }
}

// POST /api/conversations - Create new conversation
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, relatedType, relatedId, priority, participantIds } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: "Title and content are required" },
                { status: 400 }
            );
        }

        const conversation = await createConversation({
            initiatorId: session.user.id,
            title,
            content,
            relatedType,
            relatedId,
            priority,
            participantIds
        });

        return NextResponse.json(conversation, { status: 201 });
    } catch (error) {
        console.error("Error creating conversation:", error);
        return NextResponse.json(
            { error: "Failed to create conversation" },
            { status: 500 }
        );
    }
}
