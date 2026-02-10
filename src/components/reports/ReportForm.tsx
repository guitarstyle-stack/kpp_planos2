"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes, faTrash, faMagic, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { FileUpload } from "@/components/attachments/FileUpload";
import { AttachmentManager } from "@/components/attachments/AttachmentManager";
import { generateReportSummaryAction, analyzeRiskAction } from "@/actions/aiActions";


interface Project {
    id: number;
    name: string;
    code: string;
    fiscalYear: number;
    budgetTotal?: number | null;
    budgetSpent?: number | null;
    progressPercent?: number | null;
    indicators?: Array<{
        id: number;
        name: string;
        unit: string;
        targetValue: number | null;
        baselineValue: number | null;
    }>;
}

interface ReportFormProps {
    initialData?: {
        id?: number;
        projectId: number;
        fiscalYear: number;
        periodType: string;
        summary?: string | null;
        issues?: string | null;
        resolutionPlan?: string | null;
        overallProgressPercent?: number | null;

        // Budget fields
        budgetSpentInPeriod?: number | null;
        budgetSpentCumulative?: number | null;
        budgetProgressPercent?: number | null;

        // KPI fields
        kpiAchievedCount?: number | null;
        kpiTotalCount?: number | null;
        kpiAchievementPercent?: number | null;

        // Results
        indicatorResults?: Array<{
            indicatorId: number;
            actualValue: number | null;
            achievementPercent: number | null;
        }>;
    };
    projects: Project[];
}

const periodOptions = [
    { value: "MID_6M", label: "รอบ 6 เดือน (ต.ค. - มี.ค.)" },
    { value: "MID_9M", label: "รอบ 9 เดือน (ต.ค. - มิ.ย.)" },
    { value: "FULL_12M", label: "รอบ 12 เดือน (ต.ค. - ก.ย.)" },
];

export function ReportForm({ initialData, projects }: ReportFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzingSummary, setIsAnalyzingSummary] = useState(false);
    const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);
    const [summary, setSummary] = useState(initialData?.summary || "");
    const [issues, setIssues] = useState(initialData?.issues || "");
    const [resolutionPlan, setResolutionPlan] = useState(initialData?.resolutionPlan || "");

    // Current Buddhist year
    const currentYear = new Date().getFullYear() + 543;
    const fiscalYears = [currentYear - 1, currentYear, currentYear + 1];

    // Filter states
    const [fiscalYearFilter, setFiscalYearFilter] = useState<number>(
        initialData?.fiscalYear || currentYear
    );
    const filteredProjects = projects.filter(p => p.fiscalYear === fiscalYearFilter);

    // Selected states
    const [selectedProject, setSelectedProject] = useState<Project | null>(
        initialData?.projectId
            ? projects.find(p => p.id === initialData.projectId) || null
            : null
    );

    // Auto-calculate states
    const [budgetSpentCumulative, setBudgetSpentCumulative] = useState<number | "">(
        initialData?.budgetSpentCumulative ?? ""
    );
    const [budgetProgressPercent, setBudgetProgressPercent] = useState<number | "">(
        initialData?.budgetProgressPercent ?? ""
    );

    // KPI Results state: Record<indicatorId, { actualValue: number | "", achievementPercent: number }>
    const [indicatorValues, setIndicatorValues] = useState<Record<number, { actualValue: number | "", achievementPercent: number }>>(
        initialData?.indicatorResults?.reduce((acc, curr) => ({
            ...acc,
            [curr.indicatorId]: {
                actualValue: curr.actualValue ?? "",
                achievementPercent: curr.achievementPercent ?? 0
            }
        }), {}) || {}
    );

    // New attachments state
    const [newAttachments, setNewAttachments] = useState<any[]>([]);

    const isEdit = !!initialData?.id;


    // Trigger auto-calculation on project change
    function handleProjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const projectId = parseInt(e.target.value);
        const project = projects.find(p => p.id === projectId);
        setSelectedProject(project || null);

        if (project) {
            // Auto-fill budget spent cumulative
            setBudgetSpentCumulative(project.budgetSpent || 0);

            // Auto-calculate budget progress percent
            if (project.budgetTotal && project.budgetSpent !== null && project.budgetSpent !== undefined) {
                const percent = Math.round((project.budgetSpent / project.budgetTotal) * 100);
                setBudgetProgressPercent(percent);
            } else {
                setBudgetProgressPercent(0);
            }

            // Initialize indicator results if they don't exist
            const newIndicatorValues = { ...indicatorValues };
            project.indicators?.forEach(ind => {
                if (!newIndicatorValues[ind.id]) {
                    newIndicatorValues[ind.id] = { actualValue: "", achievementPercent: 0 };
                }
            });
            setIndicatorValues(newIndicatorValues);
        }
    }

    // Indicator change handler
    function handleIndicatorActualChange(indicatorId: number, targetValue: number | null, value: string) {
        const actual = value === "" ? "" : parseFloat(value);
        let achievement = 0;

        if (actual !== "" && targetValue && targetValue > 0) {
            achievement = Math.round((actual / targetValue) * 100);
        }

        setIndicatorValues(prev => ({
            ...prev,
            [indicatorId]: {
                actualValue: actual,
                achievementPercent: achievement
            }
        }));
    }

    // Budget in period change handler - auto-calculate cumulative and progress
    function handleBudgetInPeriodChange(e: React.ChangeEvent<HTMLInputElement>) {
        const inPeriod = parseFloat(e.target.value) || 0;
        const previousCumulative = selectedProject?.budgetSpent || 0;
        const newCumulative = previousCumulative + inPeriod;

        setBudgetSpentCumulative(newCumulative);

        // Calculate progress percentage
        if (selectedProject?.budgetTotal && selectedProject.budgetTotal > 0) {
            const percent = Math.round((newCumulative / selectedProject.budgetTotal) * 100);
            setBudgetProgressPercent(percent);
        } else {
            setBudgetProgressPercent(0);
        }
    }

    // Auto-calculate summary KPI counts
    // Auto-calculate summary KPI counts
    const kpiTotal = selectedProject?.indicators?.length || 0;
    const kpiAchieved = Object.values(indicatorValues).filter(v => v.achievementPercent >= 100).length;
    const kpiPercent = kpiTotal > 0 ? Math.round((kpiAchieved / kpiTotal) * 100) : 0;

    const [overallProgressPercent, setOverallProgressPercent] = useState<number | "">(
        initialData?.overallProgressPercent ?? ""
    );

    // Calculate Average KPI Achievement
    const kpiAverageAchievement = kpiTotal > 0
        ? Math.round(Object.values(indicatorValues).reduce((sum, v) => sum + v.achievementPercent, 0) / kpiTotal)
        : 0;

    async function handleAISummary() {
        if (!selectedProject) {
            toast.error("กรุณาเลือกโครงการก่อนใช้ AI สรุปผล");
            return;
        }

        setIsAnalyzingSummary(true);
        try {
            const indicatorsData = selectedProject.indicators?.map(ind => ({
                name: ind.name,
                targetValue: ind.targetValue,
                unit: ind.unit,
                actualValue: indicatorValues[ind.id]?.actualValue || 0
            })) || [];

            const result = await generateReportSummaryAction(initialData?.id, {
                projectName: selectedProject.name,
                fiscalYear: fiscalYearFilter,
                periodType: (document.getElementsByName("periodType")[0] as HTMLSelectElement)?.value || "",
                indicators: indicatorsData
            });

            if (result.success && result.data) {
                setSummary(result.data.summary);
                toast.success("AI สรุปผลเรียบร้อยแล้ว");
            } else {
                toast.error(result.error || "ไม่สามารถเรียกใช้ AI ได้");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการสรุปผล");
        } finally {
            setIsAnalyzingSummary(false);
        }
    }

    async function handleAIRiskAnalysis() {
        if (!selectedProject) {
            toast.error("กรุณาเลือกโครงการก่อนใช้ AI วิเคราะห์");
            return;
        }

        setIsAnalyzingRisk(true);
        try {
            const result = await analyzeRiskAction(initialData?.id, {
                projectName: selectedProject.name,
                issues: issues,
                progress: typeof overallProgressPercent === 'number' ? overallProgressPercent : 0
            });

            if (result.success && result.data) {
                setResolutionPlan(result.data.recommendations.join("\n"));
                toast.success("AI วิเคราะห์แนวทางแก้ไขเรียบร้อยแล้ว");
            } else {
                toast.error(result.error || "ไม่สามารถเรียกใช้ AI ได้");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการวิเคราะห์");
        } finally {
            setIsAnalyzingRisk(false);
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);

        // Append KPI results as JSON string for the action to handle
        const results = Object.entries(indicatorValues).map(([id, val]) => ({
            indicatorId: parseInt(id),
            actualValue: val.actualValue === "" ? null : val.actualValue,
            achievementPercent: val.achievementPercent
        }));
        formData.append("indicatorResults", JSON.stringify(results));

        // Also ensure summary counts are updated
        formData.append("kpiAchievedCount", kpiAchieved.toString());
        formData.append("kpiTotalCount", kpiTotal.toString());
        formData.append("kpiAchievementPercent", kpiPercent.toString());

        // Append new attachment IDs
        if (newAttachments.length > 0) {
            formData.append("newAttachmentIds", JSON.stringify(newAttachments.map(a => a.id)));
        }

        try {

            const { createReportAction, updateReportAction } = await import("@/actions/reportActions");

            if (isEdit && initialData?.id) {
                await updateReportAction(initialData.id, formData);
                toast.success("อัปเดตรายงานสำเร็จ");
            } else {
                await createReportAction(null, formData);
                toast.success("สร้างรายงานสำเร็จ");
            }

            router.push("/reports");
            router.refresh();
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                    <h2 className="card-title border-b border-base-200 pb-4">
                        {isEdit ? "แก้ไขรายงาน" : "สร้างรายงานใหม่"}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {/* Fiscal Year Filter */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">ปีงบประมาณ <span className="text-error">*</span></span>
                            </label>
                            <select
                                name="fiscalYear"
                                required
                                value={fiscalYearFilter}
                                onChange={(e) => setFiscalYearFilter(parseInt(e.target.value))}
                                className="select select-bordered w-full"
                            >
                                {fiscalYears.map((year) => (
                                    <option key={year} value={year}>
                                        ปีงบประมาณ {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Project (Filtered by Year) */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">โครงการ <span className="text-error">*</span></span>
                            </label>
                            <select
                                name="projectId"
                                required
                                defaultValue={initialData?.projectId || ""}
                                onChange={handleProjectChange}
                                className="select select-bordered w-full"
                            >
                                <option value="">-- เลือกโครงการ ({filteredProjects.length} โครงการ) --</option>
                                {filteredProjects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.code} - {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Period Type */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">รอบรายงาน <span className="text-error">*</span></span>
                            </label>
                            <select
                                name="periodType"
                                required
                                defaultValue={initialData?.periodType || ""}
                                className="select select-bordered w-full"
                            >
                                <option value="">-- เลือกรอบรายงาน --</option>
                                {periodOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Progress */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">ความก้าวหน้าโครงการ (%)</span>
                            </label>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="number"
                                    name="overallProgressPercent"
                                    min="0"
                                    value={overallProgressPercent}
                                    onChange={(e) => setOverallProgressPercent(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                    className="input input-bordered w-full"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setOverallProgressPercent(typeof budgetProgressPercent === 'number' ? budgetProgressPercent : 0)}
                                        className="btn btn-xs btn-outline"
                                        disabled={typeof budgetProgressPercent !== 'number'}
                                    >
                                        ใช้ตามงบฯ ({budgetProgressPercent || 0}%)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOverallProgressPercent(kpiAverageAchievement)}
                                        className="btn btn-xs btn-outline"
                                        disabled={kpiTotal === 0}
                                    >
                                        ใช้ตาม KPI ({kpiAverageAchievement}%)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project Information Display */}
                    {selectedProject && (
                        <div className="alert alert-info mt-6">
                            <div className="w-full">
                                <h3 className="font-bold mb-2 text-info-content">ข้อมูลโครงการ</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-info-content">
                                    <div>
                                        <span className="opacity-70 text-info-content">งบประมาณทั้งหมด:</span>
                                        <div className="font-semibold text-info-content">
                                            {selectedProject.budgetTotal?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'} บาท
                                        </div>
                                    </div>
                                    <div>
                                        <span className="opacity-70 text-info-content">งบที่เบิกไปแล้ว:</span>
                                        <div className="font-semibold text-info-content">
                                            {selectedProject.budgetSpent?.toLocaleString('th-TH', { minimumFractionDigits: 2 }) || '0.00'} บาท
                                        </div>
                                    </div>
                                    <div>
                                        <span className="opacity-70 text-info-content">จำนวนตัวชี้วัด:</span>
                                        <div className="font-semibold text-info-content">
                                            {selectedProject.indicators?.length || 0} ตัว
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Budget Section */}
                    <div className="divider mt-6">ข้อมูลงบประมาณ</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">งบที่เบิกในรอบนี้ (บาท)</span>
                            </label>
                            <input
                                type="number"
                                name="budgetSpentInPeriod"
                                min="0"
                                step="0.01"
                                defaultValue={initialData?.budgetSpentInPeriod || ""}
                                onChange={handleBudgetInPeriodChange}
                                placeholder="0.00"
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold">งบที่เบิกสะสมรวมรอบนี้ (บาท)</span>
                            </label>
                            <input
                                type="number"
                                name="budgetSpentCumulative"
                                readOnly
                                value={budgetSpentCumulative}
                                className="input input-bordered w-full bg-base-200"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold">ร้อยละความคืบหน้า (%)</span>
                            </label>
                            <input
                                type="number"
                                name="budgetProgressPercent"
                                readOnly
                                value={budgetProgressPercent}
                                className="input input-bordered w-full bg-base-200"
                            />
                        </div>
                    </div>

                    {/* KPI Section - Detailed Indicators */}
                    <div className="divider mt-6">ข้อมูลตัวชี้วัด (KPI)</div>

                    {!selectedProject ? (
                        <div className="text-center py-4 bg-base-200 rounded-lg text-sm opacity-60">
                            กรุณาเลือกโครงการเพื่อกรอกข้อมูลตัวชี้วัด
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {selectedProject.indicators?.map((indicator, index) => (
                                <div key={indicator.id} className="p-4 bg-base-100 border border-base-200 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-sm">
                                            {index + 1}. {indicator.name}
                                        </h4>
                                        <div className="badge badge-outline">
                                            เป้าหมาย: {indicator.targetValue} {indicator.unit}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label py-1">
                                                <span className="label-text text-xs">ค่าที่บรรลุได้จริง ({indicator.unit})</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={indicatorValues[indicator.id]?.actualValue ?? ""}
                                                onChange={(e) => handleIndicatorActualChange(indicator.id, indicator.targetValue, e.target.value)}
                                                placeholder={`กรอกจำนวน (${indicator.unit})`}
                                                className="input input-sm input-bordered w-full"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label py-1">
                                                <span className="label-text text-xs">ร้อยละความสำเร็จ (%)</span>
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    readOnly
                                                    value={indicatorValues[indicator.id]?.achievementPercent ?? 0}
                                                    className="input input-sm input-bordered w-full bg-base-200"
                                                />
                                                <div className={`badge ${indicatorValues[indicator.id]?.achievementPercent >= 100 ? 'badge-success' : 'badge-warning'} badge-sm whitespace-nowrap`}>
                                                    {indicatorValues[indicator.id]?.achievementPercent >= 100 ? 'บรรลุเป้า' : 'ยังไม่บรรลุ'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Summary KPI Stats */}
                            <div className="stats shadow bg-base-200 w-full mt-2">
                                <div className="stat py-2">
                                    <div className="stat-title text-xs">KPI ทั้งหมด</div>
                                    <div className="stat-value text-lg">{kpiTotal}</div>
                                </div>
                                <div className="stat py-2 border-l border-base-300">
                                    <div className="stat-title text-xs">KPI ที่บรรลุ (100%+)</div>
                                    <div className="stat-value text-lg text-success">{kpiAchieved}</div>
                                </div>
                                <div className="stat py-2 border-l border-base-300">
                                    <div className="stat-title text-xs">ร้อยละความสำเร็จรวม</div>
                                    <div className="stat-value text-lg text-primary">{kpiPercent}%</div>
                                </div>
                            </div>

                            {/* Hidden inputs for summary counts (so they are sent in form data) */}
                            <input type="hidden" name="kpiAchievedCount" value={kpiAchieved} />
                            <input type="hidden" name="kpiTotalCount" value={kpiTotal} />
                            <input type="hidden" name="kpiAchievementPercent" value={kpiPercent} />
                        </div>
                    )}

                    {/* Details Section */}
                    <div className="divider mt-6">รายละเอียดการดำเนินงาน</div>

                    {/* Summary */}
                    <div className="form-control mt-4">
                        <label className="label flex justify-between">
                            <span className="label-text">สรุปผลการดำเนินงาน</span>
                            <button
                                type="button"
                                onClick={handleAISummary}
                                disabled={isAnalyzingSummary || !selectedProject}
                                className="btn btn-xs btn-outline btn-secondary gap-2"
                            >
                                {isAnalyzingSummary ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faMagic} />}
                                สรุปด้วย AI
                            </button>
                        </label>
                        <textarea
                            name="summary"
                            rows={4}
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="สรุปกิจกรรมและผลลัพธ์ที่ดำเนินการในรอบนี้..."
                            className="textarea textarea-bordered w-full"
                        />
                    </div>

                    {/* Issues */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">ปัญหาอุปสรรค</span>
                        </label>
                        <textarea
                            name="issues"
                            rows={3}
                            value={issues}
                            onChange={(e) => setIssues(e.target.value)}
                            placeholder="ปัญหาหรืออุปสรรคที่พบระหว่างดำเนินงาน..."
                            className="textarea textarea-bordered w-full"
                        />
                    </div>

                    {/* Resolution Plan */}
                    <div className="form-control">
                        <label className="label flex justify-between">
                            <span className="label-text">แนวทางแก้ไข</span>
                            <button
                                type="button"
                                onClick={handleAIRiskAnalysis}
                                disabled={isAnalyzingRisk || !selectedProject || !issues}
                                className="btn btn-xs btn-outline btn-secondary gap-2"
                            >
                                {isAnalyzingRisk ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faMagic} />}
                                แนะนำแนวทางแก้ไขด้วย AI
                            </button>
                        </label>
                        <textarea
                            name="resolutionPlan"
                            rows={3}
                            value={resolutionPlan}
                            onChange={(e) => setResolutionPlan(e.target.value)}
                            placeholder="แนวทางการแก้ไขปัญหาหรือปรับปรุงการดำเนินงาน..."
                            className="textarea textarea-bordered w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Attachments Section */}
            {selectedProject && (
                <div className="card bg-base-100 shadow-sm border border-base-300">
                    <div className="card-body">
                        <h2 className="card-title border-b border-base-200 pb-4">
                            เอกสารแนบ / รูปภาพประกอบ
                        </h2>

                        <div className="mt-4">
                            {isEdit && initialData?.id ? (
                                <AttachmentManager
                                    projectId={selectedProject.id}
                                    reportId={initialData.id}
                                    canUpload={true}
                                    canDelete={true}
                                />
                            ) : (
                                <>
                                    <FileUpload
                                        projectId={selectedProject.id}
                                        // reportId is undefined in create mode
                                        onUploadSuccess={(att) => setNewAttachments(prev => [...prev, att])}
                                    />

                                    <NewAttachmentsList
                                        attachments={newAttachments}
                                        onRemove={(id) => setNewAttachments(prev => prev.filter(a => a.id !== id))}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}

            <div className="flex justify-between w-full">
                {isEdit && initialData?.id && (
                    <button
                        type="button"
                        onClick={async () => {
                            if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายงานนี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
                                setIsLoading(true);
                                try {
                                    const { deleteReportAction } = await import("@/actions/reportActions");
                                    await deleteReportAction(initialData.id!);
                                    toast.success("ลบรายงานสำเร็จ");
                                    router.push("/reports");
                                    router.refresh();
                                } catch (error) {
                                    toast.error("เกิดข้อผิดพลาดในการลบรายงาน");
                                    setIsLoading(false);
                                }
                            }
                        }}
                        className="btn btn-error btn-outline"
                        disabled={isLoading}
                    >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        ลบรายงาน
                    </button>
                )}

                <div className="flex gap-3 ml-auto">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn btn-ghost"
                        disabled={isLoading}
                    >
                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary"
                    >
                        {isLoading ? (
                            <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                            <FontAwesomeIcon icon={faSave} className="mr-2" />
                        )}
                        บันทึกรายงาน
                    </button>
                </div>
            </div>
        </form>
    );
}

function NewAttachmentsList({ attachments, onRemove }: { attachments: any[], onRemove: (id: number) => void }) {
    if (attachments.length === 0) return null;

    return (
        <div className="space-y-2 mt-4">
            <h4 className="font-semibold text-sm">ไฟล์ที่อัปโหลดแล้ว ({attachments.length})</h4>
            <div className="grid gap-2">
                {attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-3 bg-base-100 border border-base-200 rounded-lg">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded bg-base-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-base-content/50 uppercase">
                                {att.fileType ? att.fileType.split('/')[1] || 'FILE' : 'FILE'}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{att.fileName}</div>
                                <div className="text-xs opacity-50">พร้อมบันทึก</div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemove(att.id)}
                            className="btn btn-ghost btn-xs text-error"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
