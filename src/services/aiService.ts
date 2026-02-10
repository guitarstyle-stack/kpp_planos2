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
            ในฐานะผู้เชี่ยวชาญด้านการบริหารโครงการ ช่วยสรุปผลการดำเนินงานของโครงการ "${projectName}" 
            รอบรายงานปี ${fiscalYear} (${periodType}) โดยใช้ข้อมูลตัวชี้วัดดังนี้:
            ${indicatorsText}
            
            ให้สรุปเป็นภาษาไทยที่กระชับ เป็นทางการ และเน้นความสำเร็จหรือจุดที่ต้องปรับปรุง
            คืนค่าผลลัพธ์เป็น JSON format: { "summary": "ข้อความสรุปยาว", "points": ["หัวข้อสรุป 1", "หัวข้อสรุป 2"] }
        `;

        const response = await this.callAIProvider(prompt);
        return {
            summary: response?.summary || "ไม่มีบทสรุปจาก AI",
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
            โครงการ: ${projectName}
            ปัญหาที่พบ: ${issues || "ไม่ได้ระบุปัญหา"}
            ความคืบหน้า: ${progress}%
            
            ช่วยวิเคราะห์ความเสี่ยงและเสนอแนวทางแก้ไขปัญหาดังกล่าวโดยละเอียดในฐานะที่ปรึกษาโครงการ
            คืนค่าผลลัพธ์เป็น JSON format: { "analysis": "บทวิเคราะห์ความเสี่ยง", "recommendations": ["ข้อเสนอแนะ 1", "ข้อเสนอแนะ 2"] }
        `;

        const response = await this.callAIProvider(prompt);
        return {
            analysis: response?.analysis || "ไม่มีบทวิเคราะห์จาก AI",
            recommendations: Array.isArray(response?.recommendations) ? response.recommendations : []
        };
    },

    /**
     * ฟังก์ชันภายในสำหรับเรียก AI API (Gemini)
     */
    async callAIProvider(prompt: string): Promise<any> {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.warn("GEMINI_API_KEY ไม่ได้ตั้งค่าไว้ จะใช้ข้อมูลจำลอง (Mock Data)");
            return {
                summary: "นี่คือสรุปจำลองเนื่องจากยังไม่ได้ตั้งค่า API Key ของ AI",
                points: ["ตัวอย่างจุดที่ 1", "ตัวอย่างจุดที่ 2"],
                analysis: "บทวิเคราะห์จำลอง",
                recommendations: ["ข้อแนะนำจำลอง 1"]
            };
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${prompt}\nRespond only with valid JSON.` }] }]
                })
            });

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

            // ลบ markdown formatting ถ้า AI คืนค่ามาใน ```json ... ```
            const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("AI Service Error:", error);
            throw new Error("เกิดข้อผิดพลาดในการเรียกใช้ AI");
        }
    }
};
