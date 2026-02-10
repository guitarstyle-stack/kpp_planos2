import db from "@/lib/db";

export interface AISummaryResponse {
    summary: string;
    points: string[];
}

export interface AIRiskAnalysisResponse {
    analysis: string;
    recommendations: string[];
}

/**
 * Service สำหรับจัดการการประมวลผลด้วย AI
 */
export const aiService = {
    /**
     * สร้างสรุปรายงานผลการดำเนินงานจากข้อมูลตัวชี้วัด
     * รองรับทั้งการดึงจาก DB (reportId) หรือข้อมูลตรงจากฟอร์ม (data)
     */
    async generateReportSummary(reportId?: number, data?: { projectName: string; fiscalYear: number; periodType: string; indicators: any[] }): Promise<AISummaryResponse> {
        let projectName = data?.projectName || "";
        let fiscalYear = data?.fiscalYear || 0;
        let periodType = data?.periodType || "";
        let indicatorsText = "";

        if (reportId) {
            const report = await db.report.findUnique({
                where: { id: reportId },
                include: {
                    project: true,
                    indicatorResults: {
                        include: {
                            indicator: true
                        }
                    }
                }
            });

            if (!report) throw new Error("ไม่พบข้อมูลรายงาน");
            projectName = report.project.name;
            fiscalYear = report.fiscalYear;
            periodType = report.periodType;
            indicatorsText = report.indicatorResults.map(r =>
                `- ${r.indicator.name}: เป้าหมาย ${r.indicator.targetValue} ${r.indicator.unit}, ทำได้จริง ${r.actualValue} ${r.indicator.unit}`
            ).join("\n");
        } else if (data) {
            indicatorsText = data.indicators.map(r =>
                `- ${r.name}: เป้าหมาย ${r.targetValue} ${r.unit}, ทำได้จริง ${r.actualValue} ${r.unit}`
            ).join("\n");
        }

        const prompt = `
            Analyze this project and return a JSON summary.
            Project: "${projectName}"
            Year: ${fiscalYear} (${periodType})
            Indicators:
            ${indicatorsText || "No data"}
            
            Return JSON in Thai language:
            {
              "summary": "Formal Thai summary of progress...",
              "points": ["Key point 1", "Key point 2"]
            }
        `;

        const response = await this.callAIProvider(prompt);
        return {
            summary: response?.summary || "ไม่สามารถสร้างบทสรุปได้ในขณะนี้",
            points: Array.isArray(response?.points) ? response.points : []
        };
    },

    /**
     * วิเคราะห์ความเสี่ยงและเสนอแนวทางแก้ไขจากปัญหาที่ระบุในรายงาน
     * รองรับทั้งการดึงจาก DB (reportId) หรือข้อมูลตรงจากฟอร์ม (data)
     */
    async analyzeRiskAndResolution(reportId?: number, data?: { projectName: string; issues: string; progress: number }): Promise<AIRiskAnalysisResponse> {
        let projectName = data?.projectName || "";
        let issues = data?.issues || "";
        let progress = data?.progress || 0;

        if (reportId) {
            const report = await db.report.findUnique({
                where: { id: reportId },
                include: {
                    project: true
                }
            });

            if (!report) throw new Error("ไม่พบข้อมูลรายงาน");
            projectName = report.project.name;
            issues = report.issues || "ไม่ได้ระบุปัญหา";
            progress = report.overallProgressPercent || 0;
        }

        const prompt = `
            Analyze project risks and return JSON.
            Project: ${projectName}
            Progress: ${progress}%
            Issues: ${issues || "None"}
            
            Return JSON in Thai language:
            {
              "analysis": "Risk analysis...",
              "recommendations": ["Recommendation 1", "Recommendation 2"]
            }
        `;

        const response = await this.callAIProvider(prompt);
        return {
            analysis: response?.analysis || "ไม่สามารถวิเคราะห์ความเสี่ยงได้ในขณะนี้",
            recommendations: Array.isArray(response?.recommendations) ? response.recommendations : []
        };
    },

    /**
     * ฟังก์ชันภายในสำหรับเรียก AI API (Gemini)
     * ปรับปรุง: ใช้ Native JSON Mode และเพิ่ม Retry Logic
     */
    async callAIProvider(prompt: string, retryCount = 0): Promise<any> {
        const apiKey = process.env.GEMINI_API_KEY;
        const MAX_RETRIES = 2; // จำนวนครั้งที่จะลองใหม่หากล้มเหลว

        // เช็คว่าเป็น Mock หรือไม่ (ใช้ค่า default หรือ YOUR_API_KEY)
        if (!apiKey || apiKey === "YOUR_API_KEY") {
            console.warn("GEMINI_API_KEY Missing/Default. Using Mock Data.");
            return {
                summary: "บทสรุปโครงการของคุณมีความก้าวหน้าตามแผนงาน (ข้อมูลจำลองเนื่องจากยังไม่ได้ตั้งค่า API Key)",
                points: ["ตัวชี้วัดส่วนใหญ่เป็นไปตามเป้าหมาย", "งบประมาณมีการเบิกจ่ายต่อเนื่อง"],
                analysis: "ความเสี่ยงอยู่ในระดับต่ำ (ข้อมูลจำลอง)",
                recommendations: ["ดำเนินการตามแผนงานที่วางไว้", "ติดตามผลตัวชี้วัดทุกระยะ"]
            };
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        topP: 0.8,
                        topK: 40,
                        responseMimeType: "application/json" // บังคับให้ตอบเป็น JSON แท้ๆ
                    }
                })
            });

            if (!response.ok) {
                // Retry Logic: หากเป็น Error ชั่วคราว (เช่น 503 หรือ 429) ให้ลองใหม่
                if ((response.status === 503 || response.status === 429) && retryCount < MAX_RETRIES) {
                    console.warn(`AI API Busy (Status ${response.status}), retrying... (${retryCount + 1}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, 1500 * (retryCount + 1))); // Exponential Backoff
                    return this.callAIProvider(prompt, retryCount + 1);
                }

                const errorData = await response.json();
                console.error("Gemini API Error details:", JSON.stringify(errorData));
                throw new Error(`AI API Error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

            // Native JSON Mode จะส่งกลับมาเป็น JSON string ที่สะอาดอยู่แล้ว parse ได้เลย
            return JSON.parse(text);

        } catch (error) {
            console.error("AI Service Error:", error);

            // หากเกิด Network Error ทั่วไป ให้ลอง Retry ด้วยเช่นกัน
            if (retryCount < MAX_RETRIES) {
                console.warn(`Network Error, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 1500 * (retryCount + 1)));
                return this.callAIProvider(prompt, retryCount + 1);
            }

            // ถ้าลองครบแล้วยังไม่ได้ ให้คืนค่าโครงสร้างที่ปลอดภัย
            return {
                summary: "ระบบ AI ขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง หรือตรวจสอบ API Key",
                points: [],
                analysis: "ไม่สามารถส่งข้อมูลได้",
                recommendations: []
            };
        }
    }
};
