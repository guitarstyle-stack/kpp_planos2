"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes, faPlus, faTrash, faListCheck } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { useForm, useFieldArray, Controller, SubmitHandler } from "react-hook-form";
import { DatePickerTh } from "@/components/ui/DatePickerTh";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectSchema, ProjectFormData, ProjectFormInput } from "@/schemas/projectSchema";

interface Indicator {
    id?: number;
    name: string;
    unit: string;
    targetValue?: number | null;
    baselineValue?: number | null;
}

interface DevelopmentGoal {
    id: number;
    code: string;
    name: string;
    indicators: Indicator[];
    issue?: {
        id: number;
        annualPlan: {
            id: number;
        };
    };
}

interface DevelopmentIssue {
    id: number;
    code: string;
    name: string;
    goals: DevelopmentGoal[];
}

interface AnnualPlan {
    id: number;
    name: string;
    fiscalYear: number;
    issues: DevelopmentIssue[];
}

interface MasterData {
    departments: any[];
    annualPlans: AnnualPlan[];
}

interface ProjectFormProps {
    initialData?: any;
    masterData: MasterData;
    userId: number; // For ownership
    adminOwnerId?: number; // Optional: For admin mode to specify project owner
}

export function ProjectForm({ initialData, masterData, userId, adminOwnerId }: ProjectFormProps): React.JSX.Element {
    const router = useRouter();

    // Default values for form - Use Input type (strings for dates)
    // We need to transform initialData dates to strings YYYY-MM-DD
    const defaultValues: Partial<ProjectFormData> = useMemo(() => {
        if (!initialData) return {
            indicators: [],
            budgetTotal: 0,
            targetGroup: "",
            progressPercent: 0,
            fiscalYear: new Date().getFullYear() + 543
        };

        return {
            ...initialData,
            startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : undefined,
            endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : undefined,
            indicators: initialData.indicators || [],
            budgetTotal: initialData.budgetTotal || 0,
            targetGroup: initialData.targetGroup || "",
            progressPercent: initialData.progressPercent || 0,
        };
    }, [initialData]);

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
        reset
    } = useForm<ProjectFormData>({
        resolver: zodResolver(ProjectSchema) as any,
        defaultValues
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "indicators"
    });

    // Filtering State
    // We need to construct the filter state based on initialData (if editing)
    // Find planId and issueId from the goalId (initialData.developmentGoalId)
    const initialCascade = useMemo(() => {
        if (!initialData?.developmentGoalId) return { planId: null, issueId: null };
        const goalId = Number(initialData.developmentGoalId);

        // Search through masterData
        for (const plan of masterData.annualPlans) {
            for (const issue of plan.issues) {
                const foundGoal = issue.goals.find(g => g.id === goalId);
                if (foundGoal) {
                    return { planId: plan.id, issueId: issue.id };
                }
            }
        }
        return { planId: null, issueId: null };
    }, [initialData, masterData.annualPlans]);

    const [filterPlanId, setFilterPlanId] = useState<number | null>(initialCascade.planId);
    const [filterIssueId, setFilterIssueId] = useState<number | null>(initialCascade.issueId);

    // Update derived lists
    const filteredIssues = useMemo<DevelopmentIssue[]>(() => {
        if (!filterPlanId) return [];
        const plan = masterData.annualPlans.find(p => p.id === filterPlanId);
        return plan?.issues || [];
    }, [filterPlanId, masterData.annualPlans]);

    const filteredGoals = useMemo<DevelopmentGoal[]>(() => {
        if (!filterIssueId) return [];
        const issue = filteredIssues.find((i) => i.id === filterIssueId);
        return issue?.goals || [];
    }, [filterIssueId, filteredIssues]);

    const selectedGoalId = watch("developmentGoalId");

    const onSubmit: SubmitHandler<ProjectFormData> = async (data) => {
        const formData = new FormData();

        // Append all simple fields
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'indicators') {
                formData.append('indicatorsJson', JSON.stringify(value));
            } else if (value instanceof Date) {
                formData.append(key, value.toISOString());
            } else if (value !== undefined && value !== null) {
                formData.append(key, value.toString());
            }
        });

        // เพิ่ม ownerId สำหรับ Admin mode
        if (adminOwnerId) {
            formData.append('ownerId', adminOwnerId.toString());
        }

        try {
            let res;
            if (initialData?.id) {
                const { updateProjectAction } = await import("@/actions/projectActions");
                res = await updateProjectAction(initialData.id, formData);
            } else {
                // ใช้ createProjectAsAdmin ถ้าอยู่ใน Admin mode
                if (adminOwnerId) {
                    const { createProjectAsAdmin } = await import("@/actions/projectActions");
                    res = await createProjectAsAdmin(null, formData);
                } else {
                    const { createProjectAction } = await import("@/actions/projectActions");
                    res = await createProjectAction(null, formData);
                }
            }

            if (res?.success) {
                toast.success(initialData?.id ? "อัปเดตโครงการสำเร็จ" : "สร้างโครงการสำเร็จ");
                // Redirect ไปที่หน้าที่เหมาะสม
                if (adminOwnerId) {
                    router.push("/admin/projects");
                } else {
                    router.push("/projects");
                }
                router.refresh();
            } else {
                toast.error(res?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            console.error(error);
        }
    };

    // Helper to add standard indicators
    const addStandardIndicator = (std: any) => {
        const currentInds = watch("indicators") || [];
        const exists = currentInds.some((ind) => ind?.name === std.name);
        if (!exists) {
            append({
                name: std.name,
                unit: std.unit,
                targetValue: std.targetValue || 0,
                baselineValue: std.baselineValue || 0
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="card bg-base-100 shadow-sm border border-base-300 max-w-5xl mx-auto">
            <div className="card-body p-6 md:p-8">
                <h2 className="card-title text-lg border-b border-base-200 pb-4 mb-6">
                    ข้อมูลทั่วไปของโครงการ
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Project Code */}
                    <div className="form-control col-span-1">
                        <label htmlFor="code" className="label">
                            <span className="label-text">
                                รหัสโครงการ <span className="text-error">*</span>
                            </span>
                        </label>
                        <input
                            {...register("code")}
                            id="code"
                            disabled={!initialData?.id}
                            placeholder={initialData?.id ? "เช่น 67-001" : "รหัสจะถูกสร้างอัตโนมัติ (Auto-generated)"}
                            className={`input input-bordered w-full ${errors.code ? "input-error" : ""}`}
                        />
                        {errors.code && <span className="text-error text-xs mt-1">{errors.code.message}</span>}
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
                            {...register("fiscalYear")}
                            className={`input input-bordered w-full ${errors.fiscalYear ? "input-error" : ""}`}
                        />
                        {errors.fiscalYear && <span className="text-error text-xs mt-1">{errors.fiscalYear.message}</span>}
                    </div>

                    {/* Project Name */}
                    <div className="form-control col-span-2">
                        <label htmlFor="name" className="label">
                            <span className="label-text">
                                ชื่อโครงการ <span className="text-error">*</span>
                            </span>
                        </label>
                        <input
                            {...register("name")}
                            className={`input input-bordered w-full ${errors.name ? "input-error" : ""}`}
                        />
                        {errors.name && <span className="text-error text-xs mt-1">{errors.name.message}</span>}
                    </div>

                    {/* Description */}
                    <div className="form-control col-span-2">
                        <label htmlFor="description" className="label">
                            <span className="label-text">รายละเอียดโครงการ</span>
                        </label>
                        <textarea
                            {...register("description")}
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
                            {...register("departmentId")}
                            className={`select select-bordered w-full ${errors.departmentId ? "select-error" : ""}`}
                        >
                            <option value="">-- เลือกหน่วยงาน --</option>
                            {masterData.departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                        {errors.departmentId && <span className="text-error text-xs mt-1">{errors.departmentId.message}</span>}
                    </div>

                    {/* --- ความเชื่อมโยงแผนพัฒนา --- */}
                    <div className="col-span-1 md:col-span-2 divider text-sm text-base-content/50 uppercase tracking-widest font-bold mt-4">
                        ความเชื่อมโยงแผนพัฒนา
                    </div>

                    {/* Annual Plan (Filter) */}
                    <div className="form-control col-span-1">
                        <label className="label">
                            <span className="label-text">แผนพัฒนาคุณภาพชีวิต</span>
                        </label>
                        <select
                            value={filterPlanId || ""}
                            onChange={(e) => {
                                setFilterPlanId(e.target.value ? Number(e.target.value) : null);
                                setFilterIssueId(null);
                                setValue("developmentGoalId", undefined as any);
                            }}
                            className="select select-bordered w-full"
                        >
                            <option value="">-- เลือกแผนพัฒนา --</option>
                            {masterData.annualPlans.map((plan: AnnualPlan) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} (งบ {plan.fiscalYear})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Issue (Filter) */}
                    <div className="form-control col-span-1">
                        <label className="label">
                            <span className="label-text">ประเด็นการพัฒนา</span>
                        </label>
                        <select
                            value={filterIssueId || ""}
                            onChange={(e) => {
                                setFilterIssueId(e.target.value ? Number(e.target.value) : null);
                                setValue("developmentGoalId", undefined as any);
                            }}
                            disabled={!filterPlanId}
                            className="select select-bordered w-full"
                        >
                            <option value="">-- เลือกประเด็น --</option>
                            {filteredIssues.map((issue) => (
                                <option key={issue.id} value={issue.id}>
                                    [{issue.code}] {issue.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Goal (Real Field) */}
                    <div className="form-control col-span-2">
                        <label htmlFor="developmentGoalId" className="label">
                            <span className="label-text">เป้าหมาย/เป้าประสงค์ <span className="text-error">*</span></span>
                        </label>
                        <select
                            id="developmentGoalId"
                            {...register("developmentGoalId")}
                            disabled={!filterIssueId}
                            className={`select select-bordered w-full ${errors.developmentGoalId ? "select-error" : ""}`}
                        >
                            <option value="">-- เลือกเป้าหมาย --</option>
                            {filteredGoals.map((goal) => (
                                <option key={goal.id} value={goal.id}>
                                    {goal.code} - {goal.name}
                                </option>
                            ))}
                        </select>
                        {errors.developmentGoalId && <span className="text-error text-xs mt-1">{errors.developmentGoalId.message}</span>}
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
                            {...register("budgetTotal")}
                            step="0.01"
                            className={`input input-bordered w-full ${errors.budgetTotal ? "input-error" : ""}`}
                        />
                        {errors.budgetTotal && <span className="text-error text-xs mt-1">{errors.budgetTotal.message}</span>}
                    </div>

                    {/* Target Group */}
                    <div className="form-control col-span-1">
                        <label htmlFor="targetGroup" className="label">
                            <span className="label-text">
                                กลุ่มเป้าหมาย
                            </span>
                        </label>
                        <input
                            type="text"
                            {...register("targetGroup")}
                            className={`input input-bordered w-full ${errors.targetGroup ? "input-error" : ""}`}
                            placeholder="กลุ่มเป้าหมาย เช่น เด็ก, เยาวชน"
                        />
                        {errors.targetGroup && <span className="text-error text-xs mt-1">{errors.targetGroup.message}</span>}
                    </div>

                    {/* --- New Section: Timeline & Status --- */}
                    <div className="col-span-1 md:col-span-2 divider text-sm text-base-content/50 uppercase tracking-widest font-bold mt-4">
                        สถานะและระยะเวลา
                    </div>

                    {/* Start Date */}
                    <div className="form-control col-span-1">
                        <Controller
                            control={control}
                            name="startDate"
                            render={({ field: { onChange, value } }) => (
                                <DatePickerTh
                                    label="วันที่เริ่มต้น (Start Date)"
                                    selected={value ? new Date(value) : null}
                                    onChange={(date) => {
                                        // Store as YYYY-MM-DD string or undefined
                                        onChange(date ? date.toISOString().split('T')[0] : "");
                                    }}
                                    error={errors.startDate?.message}
                                />
                            )}
                        />
                    </div>

                    {/* End Date */}
                    <div className="form-control col-span-1">
                        <Controller
                            control={control}
                            name="endDate"
                            render={({ field: { onChange, value } }) => (
                                <DatePickerTh
                                    label="วันที่สิ้นสุด (End Date)"
                                    selected={value ? new Date(value) : null}
                                    onChange={(date) => {
                                        // Store as YYYY-MM-DD string or undefined
                                        onChange(date ? date.toISOString().split('T')[0] : "");
                                    }}
                                    error={errors.endDate?.message}
                                />
                            )}
                        />
                    </div>

                    {/* Status */}
                    <div className="form-control col-span-1">
                        <label htmlFor="status" className="label">
                            <span className="label-text">สถานะโครงการ</span>
                        </label>
                        <select
                            {...register("status")}
                            className="select select-bordered w-full"
                        >
                            <option value="NOT_STARTED">ยังไม่เริ่ม</option>
                            <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                            <option value="COMPLETED">เสร็จสิ้น</option>
                            <option value="CANCELLED">ยกเลิก</option>
                        </select>
                    </div>

                    {/* --- INDICATORS --- */}
                    <div className="col-span-1 md:col-span-2 mt-6">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-base-200">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FontAwesomeIcon icon={faListCheck} className="text-primary" />
                                ตัวชี้วัดโครงการ (Indicators)
                            </h3>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline btn-primary"
                                onClick={() => append({ name: "", unit: "", targetValue: 0, baselineValue: 0 })}
                            >
                                <FontAwesomeIcon icon={faPlus} /> เพิ่มตัวชี้วัด
                            </button>
                        </div>

                        {/* Standard Indicators Suggestion */}
                        <div className="mb-4">
                            <div className="dropdown dropdown-hover">
                                <div tabIndex={0} role="button" className="btn btn-xs btn-ghost text-base-content/60">
                                    + เลือกตัวชี้วัดมาตรฐาน
                                </div>
                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                    <li><a onClick={() => addStandardIndicator({ name: "ร้อยละความพึงพอใจ", unit: "ร้อยละ", targetValue: 80 })}>ร้อยละความพึงพอใจ</a></li>
                                    <li><a onClick={() => addStandardIndicator({ name: "จำนวนผู้เข้าร่วมโครงการ", unit: "คน", targetValue: 0 })}>จำนวนผู้เข้าร่วมโครงการ</a></li>
                                </ul>
                            </div>
                        </div>

                        {selectedGoalId && (
                            <div className="col-span-1 md:col-span-2 mb-4">
                                <div className="alert alert-info bg-info/10 border-info/20 text-sm py-2">
                                    <div className="flex flex-col w-full">
                                        <div className="font-bold flex items-center gap-2">
                                            <FontAwesomeIcon icon={faListCheck} /> ตัวชี้วัดมาตรฐานจากแผน (Standard Indicators)
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            {(() => {
                                                const issue = filteredIssues.find((i) => i.id === filterIssueId);
                                                const goal = filteredGoals.find((g) => g.id === Number(selectedGoalId));
                                                const standardIndicators = goal?.indicators || [];

                                                if (standardIndicators.length === 0) return <span className="opacity-60">ไม่มีตัวชี้วัดมาตรฐานในเป้าหมายนี้</span>;

                                                return standardIndicators.map((std: any) => {
                                                    const currentInds = watch("indicators") || [];
                                                    const isAdded = currentInds.some((ind) => ind?.name === std.name);
                                                    return (
                                                        <div key={std.id} className="flex justify-between items-center bg-base-100 p-2 rounded border border-base-200">
                                                            <span>{std.name} <span className="text-xs opacity-50">({std.unit}) - เป้า: {std.targetValue ?? '-'}</span></span>
                                                            <button
                                                                type="button"
                                                                disabled={isAdded}
                                                                onClick={() => addStandardIndicator(std)}
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

                        {fields.length === 0 && (
                            <div className="text-center py-8 bg-base-100 rounded-lg border-2 border-dashed border-base-200 text-base-content/40">
                                ยังไม่มีตัวชี้วัด กดปุ่ม "เพิ่มตัวชี้วัด" เพื่อเริ่มกำหนด
                            </div>
                        )}

                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="collapse collapse-arrow bg-base-50 border border-base-200">
                                    <input type="checkbox" defaultChecked />
                                    <div className="collapse-title font-medium flex items-center gap-2 pr-4">
                                        <div className="badge badge-sm badge-ghost">{index + 1}</div>
                                        <span className="truncate flex-1 font-bold text-sm">
                                            {watch(`indicators.${index}.name`) || "ตัวชี้วัดใหม่"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); remove(index); }}
                                            className="btn btn-xs btn-circle btn-ghost text-error z-10 hover:bg-error/10"
                                            title="ลบตัวชี้วัด"
                                        >
                                            <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="collapse-content">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div className="form-control col-span-2">
                                                <label className="label label-text-alt">ชื่อตัวชี้วัด</label>
                                                <input
                                                    {...register(`indicators.${index}.name` as const)}
                                                    className={`input input-sm input-bordered ${errors.indicators?.[index]?.name ? "input-error" : ""}`}
                                                    placeholder="เช่น ร้อยละของผู้เข้าร่วม..."
                                                />
                                                {errors.indicators?.[index]?.name && <span className="text-error text-[10px]">{errors.indicators[index]?.name?.message}</span>}
                                            </div>
                                            <div className="form-control">
                                                <label className="label label-text-alt">หน่วยนับ</label>
                                                <input
                                                    {...register(`indicators.${index}.unit` as const)}
                                                    className={`input input-sm input-bordered ${errors.indicators?.[index]?.unit ? "input-error" : ""}`}
                                                    placeholder="เช่น คน, แห่ง, ร้อยละ"
                                                />
                                                {errors.indicators?.[index]?.unit && <span className="text-error text-[10px]">{errors.indicators[index]?.unit?.message}</span>}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="form-control">
                                                    <label className="label label-text-alt">ค่าเป้าหมาย (Target)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        {...register(`indicators.${index}.targetValue` as const)}
                                                        className="input input-sm input-bordered"
                                                    />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label label-text-alt">ค่าฐาน (Baseline)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        {...register(`indicators.${index}.baselineValue` as const)}
                                                        className="input input-sm input-bordered"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors.indicators && typeof errors.indicators.message === 'string' && (
                            <div className="text-error text-xs mt-2 text-center">{errors.indicators.message}</div>
                        )}
                    </div>
                </div>

                <div className="card-actions justify-end mt-8 pt-6 border-t border-base-200">
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => router.back()}
                    >
                        <FontAwesomeIcon icon={faTimes} /> ยกเลิก
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                    >
                        <FontAwesomeIcon icon={faSave} />
                        {initialData?.id ? "บันทึกการแก้ไข" : "บันทึกโครงการ"}
                    </button>
                    {Object.keys(errors).length > 0 && (
                        <div className="text-error text-xs">
                            Please check fields {Object.keys(errors).join(", ")}
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
