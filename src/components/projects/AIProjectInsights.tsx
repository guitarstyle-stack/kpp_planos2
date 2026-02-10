"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagic, faSpinner, faLightbulb, faChartLine } from "@fortawesome/free-solid-svg-icons";
import { generateReportSummaryAction } from "@/actions/aiActions";
import { toast } from "sonner";

interface AIProjectInsightsProps {
    project: {
        id: number;
        name: string;
        fiscalYear: number;
        budgetTotal: number | null;
        budgetSpent: number | null;
        progressPercent: number | null;
        indicators: any[];
    };
}

export function AIProjectInsights({ project }: AIProjectInsightsProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [insights, setInsights] = useState<{ summary: string; points: string[] } | null>(null);

    async function handleGenerateInsights() {
        setIsAnalyzing(true);
        try {
            // ใช้ action เดียวกับรายงานแต่ส่งข้อมูลภาพรวมโครงการไปแทน
            const indicatorsData = project.indicators?.map(ind => ({
                name: ind.name,
                targetValue: ind.targetValue,
                unit: ind.unit,
                actualValue: (ind.reportResults || []).reduce((sum: number, r: any) => sum + (r.actualValue || 0), 0)
            })) || [];

            const result = await generateReportSummaryAction(undefined, {
                projectName: project.name,
                fiscalYear: project.fiscalYear,
                periodType: "ภาพรวมโครงการ",
                indicators: indicatorsData
            });

            if (result.success && result.data) {
                setInsights(result.data);
                toast.success("วิเคราะห์ข้อมูลโครงการเรียบร้อยแล้ว");
            } else {
                toast.error(result.error || "ไม่สามารถเรียกใช้ AI ได้");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการวิเคราะห์");
        } finally {
            setIsAnalyzing(false);
        }
    }

    return (
        <div className="card bg-gradient-to-br from-indigo-50 to-blue-50 shadow-sm border border-blue-100 mb-8">
            <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title text-indigo-900">
                        <FontAwesomeIcon icon={faLightbulb} className="text-amber-500" />
                        AI Project Insights (บทวิเคราะห์โครงการ)
                    </h2>
                    {!insights && (
                        <button
                            onClick={handleGenerateInsights}
                            disabled={isAnalyzing}
                            className="btn btn-sm btn-primary gap-2"
                        >
                            {isAnalyzing ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faMagic} />}
                            วิเคราะห์ด้วย AI
                        </button>
                    )}
                </div>

                {isAnalyzing && (
                    <div className="flex flex-col items-center py-8 opacity-60">
                        <span className="loading loading-bars loading-lg text-primary mb-4"></span>
                        <p className="text-sm font-medium">AI กำลังประมวลผลข้อมูลโครงการ...</p>
                    </div>
                )}

                {insights && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="bg-white/80 p-4 rounded-xl border border-indigo-100 shadow-sm">
                            <p className="text-sm leading-relaxed text-indigo-950 font-medium">
                                {insights.summary}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {insights.points.map((point, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-blue-50">
                                    <div className="mt-1">
                                        <FontAwesomeIcon icon={faChartLine} className="text-indigo-400 text-xs" />
                                    </div>
                                    <span className="text-xs text-indigo-900">{point}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end mt-2">
                            <button
                                onClick={() => setInsights(null)}
                                className="btn btn-xs btn-ghost text-indigo-500 opacity-60 hover:opacity-100"
                            >
                                ล้างข้อมูลบทวิเคราะห์
                            </button>
                        </div>
                    </div>
                )}

                {!insights && !isAnalyzing && (
                    <div className="text-center py-6 opacity-40">
                        <p className="text-sm italic">ใช้ AI เพื่อสรุปภาพรวมโครงการและความคืบหน้าเชิงลึก</p>
                    </div>
                )}
            </div>
        </div>
    );
}
