"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes, faPlus, faTrash, faListCheck } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

interface MasterData {
    departments: any[];
    annualPlans: any[];
}

interface ProjectFormProps {
    initialData?: any;
    masterData: MasterData;
    userId: number; // For ownership
}

interface IndicatorItem {
    id?: number; // For existing indicators in edit mode (not fully implemented in this step, but good for type)
    name: string;
    unit: string;
    targetValue: string; // Keep as string for input, convert later
    baselineValue: string;
}

export function ProjectForm({ initialData, masterData, userId }: ProjectFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const isEdit = !!initialData?.id;

    // --- State for Cascading Dropdowns ---
    // Try to derive initial state from initialData (if editing)
    // We need to Find the plan and issue from the goal ID if provided.
    // However, initialData usually only has developmentGoalId.
    // Ideally, initialData should include the full relation `developmentGoal.issue.annualPlanId`.
    // For now, assuming initialData might have it or we default to empty.

    // Helper to find initial IDs
    const getInitialIds = () => {
        if (!initialData?.developmentGoal) return { planId: null, issueId: null, goalId: null };
        const goal = initialData.developmentGoal;
        const issue = goal.issue;
        const plan = issue?.annualPlan;

        // If relations are missing in initialData, we might fail to pre-fill.
        // But for "Create New", this is always null. 
        // For "Edit", we need to make sure `getProjects` includes these.
        // For this task (Create), we start fresh.
        return {
            planId: plan?.id || null,
            issueId: issue?.id || null,
            goalId: goal.id || null
        };
    };

    const initialIds = getInitialIds();

    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(initialIds.planId);
    const [selectedIssueId, setSelectedIssueId] = useState<number | null>(initialIds.issueId);
    const [selectedGoalId, setSelectedGoalId] = useState<number | null>(initialIds.goalId);

    // --- Data Derivation values ---
    const issues = useMemo(() => {
        if (!selectedPlanId) return [];
        const plan = masterData.annualPlans.find(p => p.id === selectedPlanId);
        return plan?.issues || [];
    }, [selectedPlanId, masterData.annualPlans]);

    const goals = useMemo(() => {
        if (!selectedIssueId) return [];
        const issue = issues.find((i: any) => i.id === selectedIssueId);
        return issue?.goals || [];
    }, [selectedIssueId, issues]);


    // --- State for Indicators ---
    const [indicators, setIndicators] = useState<IndicatorItem[]>(
        // In Edit mode, map initialData.indicators if available
        initialData?.indicators?.map((i: any) => ({
            id: i.id,
            name: i.name,
            unit: i.unit,
            targetValue: i.targetValue?.toString() || "",
            baselineValue: i.baselineValue?.toString() || ""
        })) || []
    );

    const addIndicator = () => {
        setIndicators([...indicators, { name: "", unit: "", targetValue: "", baselineValue: "" }]);
    };

    const removeIndicator = (index: number) => {
        const newIndicators = [...indicators];
        newIndicators.splice(index, 1);
        setIndicators(newIndicators);
    };

    const updateIndicator = (index: number, field: keyof IndicatorItem, value: string) => {
        const newIndicators = [...indicators];
        newIndicators[index] = { ...newIndicators[index], [field]: value };
        setIndicators(newIndicators);
    };


    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);

        // Append indicators as JSON
        formData.append("indicatorsJson", JSON.stringify(indicators));

        try {
            let res;
            if (isEdit) {
                const { updateProjectAction } = await import("@/actions/projectActions");
                res = await updateProjectAction(initialData.id, formData);
            } else {
                const { createProjectAction } = await import("@/actions/projectActions");
                res = await createProjectAction(null, formData);
            }

            if (res?.success) {
                toast.success(isEdit ? "อัปเดตโครงการสำเร็จ" : "สร้างโครงการสำเร็จ");
                router.push("/projects");
                router.refresh();
            } else {
                toast.error(res?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
                setIsLoading(false);
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-sm border border-base-300 max-w-5xl mx-auto">
            <div className="card-body p-6 md:p-8">
                <h2 className="card-title text-lg border-b border-base-200 pb-4 mb-6">
                    ข้อมูลทั่วไปของโครงการ
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Project Code */}
                    <div className="form-control col-span-1">
                        <label htmlFor="code" className="label">
                            <span className="label-text">
                                รหัสโครงการ {isEdit && <span className="text-error">*</span>}
                            </span>
                        </label>
                        <input
                            type="text"
                            name="code"
                            id="code"
                            required={isEdit}
                            disabled={!isEdit}
                            defaultValue={initialData?.code}
                            placeholder={isEdit ? "เช่น 67-001" : "รหัสจะถูกสร้างอัตโนมัติ (Auto-generated)"}
                            className="input input-bordered w-full disabled:bg-base-200 disabled:text-base-content/50"
                        />
                    </div>

                    {/* Fiscal Year */}
                    <div className="form-control col-span-1">
                        <label htmlFor="fiscalYear" className="label">
                            <span className="label-text">
                                ปีงบประมาณ <span className="text-error">*</span>
                            </span>
                        </label>
                        <input
                            type="number"
                            name="fiscalYear"
                            id="fiscalYear"
                            required
                            // If user selects an Annual Plan, we could verify/sync this, but typically Project Budget Year might differ slightly? 
                            // Or usually it matches. Let's keep it editable but maybe default to current year.
                            defaultValue={initialData?.fiscalYear || new Date().getFullYear() + 543}
                            className="input input-bordered w-full"
                        />
                    </div>

                    {/* Project Name */}
                    <div className="form-control col-span-2">
                        <label htmlFor="name" className="label">
                            <span className="label-text">
                                ชื่อโครงการ <span className="text-error">*</span>
                            </span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            defaultValue={initialData?.name}
                            className="input input-bordered w-full"
                        />
                    </div>

                    {/* Description */}
                    <div className="form-control col-span-2">
                        <label htmlFor="description" className="label">
                            <span className="label-text">รายละเอียดโครงการ</span>
                        </label>
                        <textarea
                            name="description"
                            id="description"
                            defaultValue={initialData?.description}
                            className="textarea textarea-bordered w-full h-24"
                            placeholder="กรุณาระบุรายละเอียด เช่น หลักการและเหตุผล วัตถุประสงค์โครงการ รายละเอียดสำคัญอื่นๆ"
                        ></textarea>
                    </div>

                    {/* Department */}
                    <div className="form-control col-span-1">
                        <label htmlFor="departmentId" className="label">
                            <span className="label-text">
                                หน่วยงานรับผิดชอบ <span className="text-error">*</span>
                            </span>
                        </label>
                        <select
                            name="departmentId"
                            id="departmentId"
                            required
                            defaultValue={initialData?.departmentId}
                            className="select select-bordered w-full"
                        >
                            <option value="">-- เลือกหน่วยงาน --</option>
                            {masterData.departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>



                    {/* --- ความเชื่อมโยงแผนพัฒนา --- */}
                    <div className="col-span-1 md:col-span-2 divider text-sm text-base-content/50 uppercase tracking-widest font-bold mt-4">
                        ความเชื่อมโยงแผนพัฒนา
                    </div>

                    {/* Annual Plan (New) */}
                    <div className="form-control col-span-1">
                        <label htmlFor="annualPlanId" className="label">
                            <span className="label-text">แผนพัฒนาคุณภาพชีวิต</span>
                        </label>
                        <select
                            name="annualPlanId" // Not used directly in project schema, but helps filtering
                            id="annualPlanId"
                            value={selectedPlanId || ""}
                            onChange={(e) => {
                                setSelectedPlanId(e.target.value ? Number(e.target.value) : null);
                                setSelectedIssueId(null);
                                setSelectedGoalId(null);
                            }}
                            className="select select-bordered w-full"
                        >
                            <option value="">-- เลือกแผนพัฒนา --</option>
                            {masterData.annualPlans.map((plan: any) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} (งบ {plan.fiscalYear})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ประเด็นการพัฒนา */}
                    <div className="form-control col-span-1">
                        <label htmlFor="issueId" className="label">
                            <span className="label-text">ประเด็นการพัฒนา</span>
                        </label>
                        <select
                            name="issueId"
                            id="issueId"
                            value={selectedIssueId || ""}
                            onChange={(e) => {
                                setSelectedIssueId(e.target.value ? Number(e.target.value) : null);
                                setSelectedGoalId(null);
                            }}
                            disabled={!selectedPlanId}
                            className="select select-bordered w-full"
                        >
                            <option value="">-- เลือกประเด็น --</option>
                            {issues.map((issue: any) => (
                                <option key={issue.id} value={issue.id}>
                                    [{issue.code}] {issue.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* เป้าหมาย/เป้าประสงค์ (cascading) */}
                    <div className="form-control col-span-2">
                        <label htmlFor="developmentGoalId" className="label">
                            <span className="label-text">เป้าหมาย/เป้าประสงค์ <span className="text-error">*</span></span>
                        </label>
                        <select
                            name="developmentGoalId"
                            id="developmentGoalId"
                            value={selectedGoalId || ""}
                            onChange={(e) => setSelectedGoalId(e.target.value ? Number(e.target.value) : null)}
                            required
                            disabled={!selectedIssueId}
                            className="select select-bordered w-full"
                        >
                            <option value="">-- เลือกเป้าหมาย --</option>
                            {goals.map((goal: any) => (
                                <option key={goal.id} value={goal.id}>
                                    {goal.code} - {goal.name}
                                </option>
                            ))}
                        </select>
                    </div>


                    {/* --- New Section: Financial & Target --- */}
                    <div className="col-span-1 md:col-span-2 divider text-sm text-base-content/50 uppercase tracking-widest font-bold mt-4">
                        ข้อมูลเชิงลึก
                    </div>

                    {/* Budget */}
                    <div className="form-control col-span-1">
                        <label htmlFor="budgetTotal" className="label">
                            <span className="label-text">
                                งบประมาณ (บาท) <span className="text-error">*</span>
                            </span>
                        </label>
                        <input
                            type="number"
                            name="budgetTotal"
                            id="budgetTotal"
                            step="0.01"
                            required
                            defaultValue={initialData?.budgetTotal}
                            placeholder="0.00"
                            className="input input-bordered w-full"
                        />
                    </div>

                    {/* Target Group */}
                    <div className="form-control col-span-1">
                        <label htmlFor="targetGroup" className="label">
                            <span className="label-text">กลุ่มเป้าหมาย</span>
                        </label>
                        <input
                            type="text"
                            name="targetGroup"
                            id="targetGroup"
                            defaultValue={initialData?.targetGroup}
                            placeholder="กลุ่มเป้าหมาย เช่น เด็ก, คนพิการ, ผู้สูงอายุ, สตรี เป็นต้น"
                            className="input input-bordered w-full"
                        />
                    </div>

                    {/* Progress Percent */}
                    <div className="form-control col-span-1">
                        <label htmlFor="progressPercent" className="label">
                            <span className="label-text">ความคืบหน้า (%)</span>
                        </label>
                        <input
                            type="number"
                            name="progressPercent"
                            id="progressPercent"
                            step="1"
                            min="0"
                            max="100"
                            defaultValue={initialData?.progressPercent}
                            placeholder="0"
                            className="input input-bordered w-full"
                        />
                    </div>

                    {/* --- New Section: Timeline & Status --- */}
                    <div className="col-span-1 md:col-span-2 divider text-sm text-base-content/50 uppercase tracking-widest font-bold mt-4">
                        สถานะและระยะเวลา
                    </div>

                    {/* Start Date */}
                    <div className="form-control col-span-1">
                        <label htmlFor="startDate" className="label">
                            <span className="label-text">วันที่เริ่มต้น</span>
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            id="startDate"
                            defaultValue={initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : ''}
                            className="input input-bordered w-full"
                        />
                    </div>

                    {/* End Date */}
                    <div className="form-control col-span-1">
                        <label htmlFor="endDate" className="label">
                            <span className="label-text">วันที่สิ้นสุด</span>
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            id="endDate"
                            defaultValue={initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : ''}
                            className="input input-bordered w-full"
                        />
                    </div>

                    {/* Status */}
                    <div className="form-control col-span-1">
                        <label htmlFor="status" className="label">
                            <span className="label-text">สถานะโครงการ</span>
                        </label>
                        <select
                            name="status"
                            id="status"
                            defaultValue={initialData?.status || "NOT_STARTED"}
                            className="select select-bordered w-full"
                        >
                            <option value="NOT_STARTED">ยังไม่เริ่ม</option>
                            <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                            <option value="COMPLETED">เสร็จสิ้น</option>
                            <option value="CANCELLED">ยกเลิก</option>
                        </select>
                    </div>

                    {/* --- New Section: Project Indicators --- */}
                    {/* Standard Indicators Selection */}
                    {selectedGoalId && (
                        <div className="col-span-1 md:col-span-2 mb-4">
                            <div className="alert alert-info bg-info/10 border-info/20 text-sm py-2">
                                <div className="flex flex-col w-full">
                                    <div className="font-bold flex items-center gap-2">
                                        <FontAwesomeIcon icon={faListCheck} /> ตัวชี้วัดมาตรฐานจากแผน (Standard Indicators)
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {(() => {
                                            // Find the selected goal object from masterData
                                            const issue = issues.find((i: any) => i.id === selectedIssueId);
                                            const goal = issue?.goals.find((g: any) => g.id === selectedGoalId);
                                            const standardIndicators = goal?.indicators || [];

                                            if (standardIndicators.length === 0) return <span className="opacity-60">ไม่มีตัวชี้วัดมาตรฐานในเป้าหมายนี้</span>;

                                            return standardIndicators.map((std: any) => {
                                                const isAdded = indicators.some((ind) => ind.name === std.name); // Simple check by name
                                                return (
                                                    <div key={std.id} className="flex justify-between items-center bg-base-100 p-2 rounded border border-base-200">
                                                        <span>{std.name} <span className="text-xs opacity-50">({std.unit}) - เป้า: {std.targetValue ?? '-'}</span></span>
                                                        <button
                                                            type="button"
                                                            disabled={isAdded}
                                                            onClick={() => {
                                                                setIndicators([...indicators, {
                                                                    name: std.name,
                                                                    unit: std.unit,
                                                                    targetValue: std.targetValue?.toString() || "",
                                                                    baselineValue: std.baselineValue?.toString() || ""
                                                                }]);
                                                            }}
                                                            className="btn btn-xs btn-primary btn-outline"
                                                        >
                                                            {isAdded ? "เพิ่มแล้ว" : "เลือกใช้"}
                                                        </button>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="col-span-1 md:col-span-2 divider text-sm text-base-content/50 uppercase tracking-widest font-bold mt-4 text-green-700">
                        ตัวชี้วัดโครงการ (Project Indicators)
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-4 rounded-lg border border-base-200 p-4 bg-base-50">
                        {indicators.map((indicator, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-10 gap-2 items-end border-b border-base-200 pb-2 last:border-0">
                                <div className="md:col-span-3 form-control">
                                    <label className="label label-text text-xs p-1">ชื่อตัวชี้วัด</label>
                                    <input
                                        type="text"
                                        value={indicator.name}
                                        onChange={(e) => updateIndicator(index, 'name', e.target.value)}
                                        placeholder="ชื่อตัวชี้วัด"
                                        className="input input-sm input-bordered"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2 form-control">
                                    <label className="label label-text text-xs p-1">หน่วยนับ</label>
                                    <input
                                        type="text"
                                        value={indicator.unit}
                                        onChange={(e) => updateIndicator(index, 'unit', e.target.value)}
                                        placeholder="เช่น ร้อยละ, คน"
                                        className="input input-sm input-bordered"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2 form-control">
                                    <label className="label label-text text-xs p-1">ค่าเป้าหมาย</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={indicator.targetValue}
                                        onChange={(e) => updateIndicator(index, 'targetValue', e.target.value)}
                                        placeholder="0"
                                        className="input input-sm input-bordered"
                                    />
                                </div>
                                <div className="md:col-span-2 form-control">
                                    <label className="label label-text text-xs p-1">ค่าฐาน (Baseline)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={indicator.baselineValue}
                                        onChange={(e) => updateIndicator(index, 'baselineValue', e.target.value)}
                                        placeholder="0"
                                        className="input input-sm input-bordered"
                                    />
                                </div>
                                <div className="md:col-span-1 flex justify-center pb-1">
                                    <button
                                        type="button"
                                        onClick={() => removeIndicator(index)}
                                        className="btn btn-ghost btn-xs text-error"
                                        title="ลบตัวชี้วัด"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button type="button" onClick={addIndicator} className="btn btn-sm btn-outline btn-success w-full gap-2 border-dashed">
                            <FontAwesomeIcon icon={faPlus} /> เพิ่มตัวชี้วัดใหม่
                        </button>
                    </div>

                </div>

                {/* Action Buttons */}
                <div className="card-actions justify-end mt-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn btn-ghost"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary"
                    >
                        {isLoading ? <span className="loading loading-spinner"></span> : <FontAwesomeIcon icon={faSave} />}
                        {isLoading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                    </button>
                </div>
            </div>
        </form>
    );
}
