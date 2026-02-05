import { NextRequest, NextResponse } from "next/server";
import { processDueSchedules } from "@/services/notificationService";
// test
export const dynamic = "force-dynamic"; // static by default, unless reading the request

export async function GET(request: NextRequest) {
    try {
        // Verify Cron Secret if present in environment
        // Vercel sends `Authorization: Bearer <CRON_SECRET>`
        // If CRON_SECRET is not set in env, we skip verification (development mode or initial setup)
        // BUT for security in production, CRON_SECRET should be set.

        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret) {
            const authHeader = request.headers.get("authorization");
            if (authHeader !== `Bearer ${cronSecret}`) {
                return new NextResponse("Unauthorized", { status: 401 });
            }
        }

        // Process schedules
        console.log("Starting notification cron job...");
        await processDueSchedules();
        console.log("Notification cron job finished.");

        return NextResponse.json({ success: true, message: "Processed due schedules" });
    } catch (error) {
        console.error("Cron job failed:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
