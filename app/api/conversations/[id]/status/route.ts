import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateConversationStatus } from "@/services/conversationService";

export const dynamic = "force-dynamic";

// PATCH /api/conversations/[id]/status - Update conversation status (admin only)
export async function PATCH(
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
        const { status } = body;

        if (!status || !["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        const conversation = await updateConversationStatus(
            conversationId,
            status,
            session.user.id
        );

        return NextResponse.json(conversation);
    } catch (error: any) {
        console.error("Error updating conversation status:", error);

        if (error.message === "Only admins can change conversation status") {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json(
            { error: "Failed to update conversation status" },
            { status: 500 }
        );
    }
}
