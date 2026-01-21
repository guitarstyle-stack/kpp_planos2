import { NextResponse } from "next/server";
import { processDueSchedules } from "@/services/notificationService";

export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function GET(request: Request) {
    try {
        console.log("Running scheduled notifications cron...");
        await processDueSchedules();
        return NextResponse.json({ success: true, message: "Processed schedules" });
    } catch (error) {
        console.error("Cron job failed:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
