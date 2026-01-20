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
    const isEdit = !!initialData?.id;

    // Generate fiscal year options (current year +/- 2)
    const currentYear = new Date().getFullYear() + 543; // Convert to Buddhist year
    const fiscalYears = [currentYear - 1, currentYear, currentYear + 1];

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);

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
                        {/* Project */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">โครงการ <span className="text-error">*</span></span>
                            </label>
                            <select
                                name="projectId"
                                required
                                defaultValue={initialData?.projectId || ""}
                                className="select select-bordered w-full"
                            >
                                <option value="">-- เลือกโครงการ --</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.code} - {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Fiscal Year */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">ปีงบประมาณ <span className="text-error">*</span></span>
                            </label>
                            <select
                                name="fiscalYear"
                                required
                                defaultValue={initialData?.fiscalYear || currentYear}
                                className="select select-bordered w-full"
                            >
                                {fiscalYears.map((year) => (
                                    <option key={year} value={year}>
                                        ปีงบประมาณ {year}
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
                                <span className="label-text">งบที่เบิกสะสม (บาท)</span>
                            </label>
                            <input
                                type="number"
                                name="budgetSpentCumulative"
                                min="0"
                                step="0.01"
                                defaultValue={initialData?.budgetSpentCumulative || ""}
                                placeholder="0.00"
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">ร้อยละความคืบหน้า (%)</span>
                            </label>
                            <input
                                type="number"
                                name="budgetProgressPercent"
                                min="0"
                                max="100"
                                defaultValue={initialData?.budgetProgressPercent || ""}
                                placeholder="0"
                                className="input input-bordered w-full"
                            />
                        </div>
                    </div>

                    {/* KPI Section */}
                    <div className="divider mt-6">ข้อมูลตัวชี้วัด (KPI)</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">จำนวนที่บรรลุ</span>
                            </label>
                            <input
                                type="number"
                                name="kpiAchievedCount"
                                min="0"
                                defaultValue={initialData?.kpiAchievedCount || ""}
                                placeholder="0"
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">จำนวนทั้งหมด</span>
                            </label>
                            <input
                                type="number"
                                name="kpiTotalCount"
                                min="0"
                                defaultValue={initialData?.kpiTotalCount || ""}
                                placeholder="0"
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">ร้อยละความสำเร็จ (%)</span>
                            </label>
                            <input
                                type="number"
                                name="kpiAchievementPercent"
                                min="0"
                                max="100"
                                defaultValue={initialData?.kpiAchievementPercent || ""}
                                placeholder="0"
                                className="input input-bordered w-full"
                            />
                        </div>
                    </div>

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
