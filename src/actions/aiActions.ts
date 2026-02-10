"use strict";

"use server";

import { aiService } from "@/services/aiService";
import { revalidatePath } from "next/cache";

/**
 * Action สำหรับสร้างคำสรุปรายงานด้วย AI
 */
export async function generateReportSummaryAction(reportId?: number, data?: any) {
    try {
        const result = await aiService.generateReportSummary(reportId, data);
        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Action สำหรับวิเคราะห์ความเสี่ยงและแนวทางแก้ไขด้วย AI
 */
export async function analyzeRiskAction(reportId?: number, data?: any) {
    try {
        const result = await aiService.analyzeRiskAndResolution(reportId, data);
        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
