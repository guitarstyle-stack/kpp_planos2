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
            ในฐานะที่ปรึกษาด้านการบริหารโครงการมืออาชีพ ช่วยวิเคราะห์และสรุปผลโครงการดังนี้:
            โครงการ: "${projectName}"
            รอบรายงานปี: ${fiscalYear}
            ประเภท: ${periodType}
            
            ข้อมูลตัวชี้วัด (Indicator Results):
            ${indicatorsText || "ยังไม่มีข้อมูลตัวชี้วัด"}
            
            คำแนะนำ:
            1. สรุปภาพรวมความคืบหน้าโครงการเป็นภาษาไทยที่กระชับและเป็นทางการ
            2. ระบุจุดเด่นหรือปัญหาที่พบจากตัวชี้วัด
            3. คืนค่าเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอกเหนือจาก JSON
            
            Structure:
            {
              "summary": "สรุปภาพรวมความคืบหน้า...",
              "points": ["ประเด็นวิเคราะห์ 1", "ประเด็นวิเคราะห์ 2"]
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
            ในฐานะที่ปรึกษาด้านความเสี่ยงโครงการ ช่วยวิเคราะห์โครงการดังนี้:
            โครงการ: ${projectName}
            ความคืบหน้าล่าสุด: ${progress}%
            ปัญหา/อุปสรรค: ${issues || "ไม่ได้ระบุปัญหา"}
            
            คำแนะนำ:
            1. วิเคราะห์ความเสี่ยงที่แท้จริงจากปัญหาที่ระบุ
            2. เสนอแนวทางแก้ไขที่เป็นรูปธรรมและปฏิบัติได้จริง
            3. คืนค่าเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอกเหนือจาก JSON
            
            Structure:
            {
              "analysis": "บทวิเคราะห์ความเสี่ยงเชิงลึก...",
              "recommendations": ["แนวทางแก้ไข 1", "แนวทางแก้ไข 2"]
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
     */
    async callAIProvider(prompt: string): Promise<any> {
        const apiKey = process.env.GEMINI_API_KEY;

        // เช็คว่าเป็น Mock หรือไม่ (ใช้ค่า default หรือ YOUR_API_KEY)
        if (!apiKey || apiKey === "YOUR_API_KEY") {
            console.warn("GEMINI_API_KEY ไม่ได้ตั้งค่าไว้ (หรือยังเป็นค่าเริ่มต้น) จะใช้ข้อมูลจำลอง (Mock Data)");
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
                    contents: [{ parts: [{ text: `${prompt}\nRespond strictly with JSON format.` }] }],
                    generationConfig: {
                        temperature: 0.2, // ลดความเพ้อเจ้อเพื่อให้ได้ JSON ที่แม่นยำขึ้น
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Error details:", JSON.stringify(errorData));
                throw new Error(`AI API Error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

            // ใช้ Regex ในการค้นหา JSON ที่อยู่ภายใต้ Code Block หรืออยู่โดดๆ
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : "{}";

            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("AI Service Error:", error);
            // คืนค่าโครงสร้างที่ปลอดภัยแทนการ throw error เพื่อไม่ให้ UI ค้าง
            return {
                summary: "ระบบ AI ขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง หรือตรวจสอบ API Key",
                points: [],
                analysis: "ไม่สามารถส่งข้อมูลได้",
                recommendations: []
            };
        }
    }
};
