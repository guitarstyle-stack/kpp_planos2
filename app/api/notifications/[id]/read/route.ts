import { NextRequest, NextResponse } from "next/server";
import { markAsRead } from "@/services/notificationService";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await markAsRead(Number(id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
        return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
    }
}
