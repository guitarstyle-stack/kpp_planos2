import { NextRequest, NextResponse } from "next/server";
import { markAllAsRead } from "@/services/notificationService";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const userId = body.userId;

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        await markAllAsRead(Number(userId));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to mark all as read:", error);
        return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
    }
}
