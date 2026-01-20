import { NextRequest, NextResponse } from "next/server";
import { getNotifications, getUnreadCount } from "@/services/notificationService";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const [notifications, unreadCount] = await Promise.all([
            getNotifications(Number(userId)),
            getUnreadCount(Number(userId)),
        ]);

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}
