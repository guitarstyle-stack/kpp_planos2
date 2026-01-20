"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

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
                const percent = Math.min(Math.round((project.budgetSpent / project.budgetTotal) * 100), 100);
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
            achievement = Math.min(Math.round((actual / targetValue) * 100), 100);
        }

        setIndicatorValues(prev => ({
            ...prev,
            [indicatorId]: {
                actualValue: actual,
                achievementPercent: achievement
            }
        }));
    }

    // Auto-calculate summary KPI counts
    const kpiTotal = selectedProject?.indicators?.length || 0;
    const kpiAchieved = Object.values(indicatorValues).filter(v => v.achievementPercent >= 80).length;
    const kpiPercent = kpiTotal > 0 ? Math.round((kpiAchieved / kpiTotal) * 100) : 0;

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
                            <input
                                type="number"
                                name="overallProgressPercent"
                                min="0"
                                max="100"
                                defaultValue={initialData?.overallProgressPercent || 0}
                                className="input input-bordered w-full"
                            />
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
                                                <div className={`badge ${indicatorValues[indicator.id]?.achievementPercent >= 80 ? 'badge-success' : 'badge-warning'} badge-sm whitespace-nowrap`}>
                                                    {indicatorValues[indicator.id]?.achievementPercent >= 80 ? 'บรรลุเเป้า' : 'ยังไม่บรรลุ'}
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
                                    <div className="stat-title text-xs">KPI ที่บรรลุ (80%+)</div>
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
                        <label className="label">
                            <span className="label-text">สรุปผลการดำเนินงาน</span>
                        </label>
                        <textarea
                            name="summary"
                            rows={4}
                            defaultValue={initialData?.summary || ""}
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
                            defaultValue={initialData?.issues || ""}
                            placeholder="ปัญหาหรืออุปสรรคที่พบระหว่างดำเนินงาน..."
                            className="textarea textarea-bordered w-full"
                        />
                    </div>

                    {/* Resolution Plan */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">แนวทางแก้ไข</span>
                        </label>
                        <textarea
                            name="resolutionPlan"
                            rows={3}
                            defaultValue={initialData?.resolutionPlan || ""}
                            placeholder="แนวทางการแก้ไขปัญหาหรือปรับปรุงการดำเนินงาน..."
                            className="textarea textarea-bordered w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="btn btn-ghost"
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
        </form>
    );
}
