"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faBullseye, faListCheck, faPlus, faTrash, faEdit, faSave, faTimes, faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import {
    createAnnualPlanAction, updateAnnualPlanAction, deleteAnnualPlanAction,
    createIssueAction, updateIssueAction, deleteIssueAction,
    createGoalAction, updateGoalAction, deleteGoalAction,
    createIndicatorAction, deleteIndicatorAction
} from "@/actions/developmentPlanActions";
import { toast } from "sonner";

interface StrategicPlanTreeProps {
    initialPlans: any[];
}

export function StrategicPlanTree({ initialPlans }: StrategicPlanTreeProps) {
    // --- State for Forms ---
    // Using a simple state object to track which item is being edited/added
    // Format: { type: 'plan'|'issue'|'goal'|'indicator', id: number | 'new', parentId?: number }
    const [editingItem, setEditingItem] = useState<{ type: string, id: number | 'new', parentId?: number } | null>(null);
    const [formData, setFormData] = useState<any>({});

    // --- Generic Handlers ---
    const handleReset = () => {
        setEditingItem(null);
        setFormData({});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    // --- Submits ---
    async function submitPlan() {
        const name = formData.name?.trim();
        const fiscalYear = formData.fiscalYear;
        if (!name || !fiscalYear) return toast.error("กรุณากรอกข้อมูลให้ครบ");
        const data = new FormData();
        data.append("name", name);
        data.append("fiscalYear", fiscalYear);

        let res;
        if (editingItem?.id === 'new') {
            res = await createAnnualPlanAction(null, data);
        } else {
            res = await updateAnnualPlanAction(editingItem?.id as number, data);
        }

        if (res.success) { toast.success(res.message); handleReset(); }
        else toast.error(res.message);
    }

    async function submitIssue() {
        const name = formData.name?.trim();
        const code = formData.code?.trim();
        const desc = formData.description?.trim();

        if (!name && editingItem?.id === 'new') return toast.error("กรุณากรอกชื่อประเด็น");
        if ((!code || !name) && editingItem?.id !== 'new') return toast.error("กรุณากรอกข้อมูลให้ครบ");

        const data = new FormData();
        data.append("annualPlanId", editingItem?.parentId?.toString() || "");
        if (editingItem?.id !== 'new') data.append("code", code);
        data.append("name", name);
        if (desc) data.append("description", desc);

        let res;
        if (editingItem?.id === 'new') {
            res = await createIssueAction(null, data);
        } else {
            res = await updateIssueAction(editingItem?.id as number, data);
        }

        if (res.success) { toast.success(res.message); handleReset(); }
        else toast.error(res.message);
    }

    async function submitGoal() {
        const name = formData.name?.trim();
        const code = formData.code?.trim();
        const desc = formData.description?.trim();

        if (!name && editingItem?.id === 'new') return toast.error("กรุณากรอกชื่อเป้าหมาย");
        if ((!code || !name) && editingItem?.id !== 'new') return toast.error("กรุณากรอกข้อมูลให้ครบ");

        const data = new FormData();
        data.append("issueId", editingItem?.parentId?.toString() || "");
        if (editingItem?.id !== 'new') data.append("code", code);
        data.append("name", name);
        if (desc) data.append("description", desc);

        let res;
        if (editingItem?.id === 'new') {
            res = await createGoalAction(null, data);
        } else {
            res = await updateGoalAction(editingItem?.id as number, data);
        }

        if (res.success) { toast.success(res.message); handleReset(); }
        else toast.error(res.message);
    }

    async function submitIndicator() {
        const name = formData.name?.trim();
        const unit = formData.unit?.trim();

        if (!name || !unit) return toast.error("กรุณากรอกชื่อและหน่วยนับ");
        const data = new FormData();
        data.append("goalId", editingItem?.parentId?.toString() || "");
        data.append("name", name);
        data.append("unit", unit);
        if (formData.targetValue) data.append("targetValue", formData.targetValue);
        if (formData.baselineValue) data.append("baselineValue", formData.baselineValue);

        const res = await createIndicatorAction(null, data);
        if (res.success) { toast.success(res.message); handleReset(); }
        else toast.error(res.message);
    }

    // --- Deletes ---
    async function handleDelete(type: string, id: number) {
        if (!confirm(`ยืนยันการลบ ${type}? ข้อมูลที่เกี่ยวข้องอาจถูกลบหรือเกิดข้อผิดพลาดหากมีการใช้งานอยู่`)) return;
        let res;
        if (type === 'plan') res = await deleteAnnualPlanAction(id);
        else if (type === 'issue') res = await deleteIssueAction(id);
        else if (type === 'goal') res = await deleteGoalAction(id);
        else if (type === 'indicator') res = await deleteIndicatorAction(id);

        if (res?.success) toast.success("ลบสำเร็จ");
        else toast.error(res?.message || "เกิดข้อผิดพลาด");
    }


    return (
        <div>
            {/* Add Annual Plan Button (Top Level) */}
            <div className="mb-4 flex justify-end">
                {editingItem?.type === 'plan' && editingItem.id === 'new' ? (
                    <div className="card w-full bg-base-100 shadow-sm border border-primary/20 p-4 mb-4">
                        <h3 className="font-bold text-lg mb-2">เพิ่มแผนประจำปี</h3>
                        <div className="flex gap-2">
                            <input name="name" value={formData.name ?? ""} placeholder="ชื่อแผน (เช่น แผนพัฒนาฯ 2568)" className="input input-bordered w-full" onChange={handleChange} autoFocus />
                            <input name="fiscalYear" value={formData.fiscalYear ?? ""} type="number" placeholder="ปีงบประมาณ" className="input input-bordered w-32" onChange={handleChange} />
                            <button className="btn btn-primary" onClick={submitPlan}><FontAwesomeIcon icon={faSave} /> บันทึก</button>
                            <button className="btn btn-ghost" onClick={handleReset}><FontAwesomeIcon icon={faTimes} /></button>
                        </div>
                    </div>
                ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => { setEditingItem({ type: 'plan', id: 'new' }); setFormData({}); }}>
                        <FontAwesomeIcon icon={faPlus} /> เพิ่มแผนประจำปี
                    </button>
                )}
            </div>

            <div className="divide-y divide-base-200 border border-base-200 rounded-lg bg-base-100">
                {initialPlans.map((plan) => (
                    <div key={plan.id} className="collapse collapse-arrow rounded-none group">
                        <input type="checkbox" className="peer" />

                        {/* Plan Header */}
                        <div className="collapse-title text-lg font-medium flex items-center justify-between gap-3 bg-base-50 peer-checked:bg-base-200/50">
                            <div className="flex items-center gap-3">
                                <FontAwesomeIcon icon={faFolder} className="text-primary" />
                                {editingItem?.type === 'plan' && editingItem.id === plan.id ? (
                                    <div className="flex gap-2 items-center relative z-20" onClick={e => e.stopPropagation()}>
                                        <input name="name" value={formData.name ?? ""} className="input input-sm input-bordered" onChange={handleChange} />
                                        <input name="fiscalYear" value={formData.fiscalYear ?? ""} className="input input-sm input-bordered w-20" type="number" onChange={handleChange} />
                                        <button type="button" className="btn btn-xs btn-primary text-white" onClick={submitPlan}><FontAwesomeIcon icon={faSave} /></button>
                                        <button type="button" className="btn btn-xs btn-ghost text-error" onClick={handleReset}><FontAwesomeIcon icon={faTimes} /></button>
                                    </div>
                                ) : (
                                    <span>{plan.name} <span className="text-sm font-normal text-base-content/60">(ปีงบ {plan.fiscalYear})</span></span>
                                )}
                            </div>

                            {/* Plan Actions */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
                                <button className="btn btn-ghost btn-xs text-info" onClick={() => { setEditingItem({ type: 'plan', id: plan.id }); setFormData({ name: plan.name, fiscalYear: plan.fiscalYear }); }}>
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete('plan', plan.id)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>

                        <div className="collapse-content px-0 pb-0 bg-base-100">
                            <div className="p-4 space-y-4">
                                {plan.issues.map((issue: any) => (
                                    <div key={issue.id} className="collapse collapse-plus border border-base-200 rounded-box bg-white">
                                        <input type="checkbox" />
                                        {/* Issue Header */}
                                        <div className="collapse-title text-base font-medium flex items-center gap-2 min-h-0 py-2 pr-12 hover:bg-base-50">
                                            {editingItem?.type === 'issue' && editingItem.id === issue.id ? (
                                                <div className="flex gap-2 items-center w-full relative z-20" onClick={e => e.stopPropagation()}>
                                                    <input name="code" value={formData.code ?? ""} className="input input-xs input-bordered w-20" placeholder="รหัส" onChange={handleChange} />
                                                    <input name="name" value={formData.name ?? ""} className="input input-xs input-bordered w-full" placeholder="ชื่อประเด็น" onChange={handleChange} />
                                                    <button type="button" className="btn btn-xs btn-primary" onClick={submitIssue}><FontAwesomeIcon icon={faSave} /></button>
                                                    <button type="button" className="btn btn-xs btn-ghost" onClick={handleReset}><FontAwesomeIcon icon={faTimes} /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="badge badge-neutral badge-outline font-mono text-xs mr-2">{issue.code}</div>
                                                    <span className="flex-1">{issue.name}</span>
                                                    <div className="flex gap-1 relative z-10" onClick={e => e.stopPropagation()}>
                                                        <button className="btn btn-ghost btn-xs text-info" onClick={() => { setEditingItem({ type: 'issue', id: issue.id, parentId: plan.id }); setFormData({ code: issue.code, name: issue.name, description: issue.description }); }}>
                                                            <FontAwesomeIcon icon={faEdit} />
                                                        </button>
                                                        <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete('issue', issue.id)}>
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="collapse-content bg-base-50 rounded-b-box p-3">
                                            {/* Goal List */}
                                            <div className="space-y-3">
                                                {issue.goals.map((goal: any) => (
                                                    <div key={goal.id} className="bg-white border border-base-200 rounded p-3 shadow-sm hover:border-primary/40 transition-colors">
                                                        {editingItem?.type === 'goal' && editingItem.id === goal.id ? (
                                                            <div className="space-y-2">
                                                                <div className="flex gap-2">
                                                                    <input name="code" value={formData.code ?? ""} className="input input-xs input-bordered w-24" placeholder="รหัส" onChange={handleChange} />
                                                                    <input name="name" value={formData.name ?? ""} className="input input-xs input-bordered w-full" placeholder="ชื่อเป้าหมาย" onChange={handleChange} />
                                                                </div>
                                                                <textarea name="description" value={formData.description ?? ""} className="textarea textarea-xs textarea-bordered w-full" placeholder="รายละเอียดเพิ่มเติม" onChange={handleChange}></textarea>
                                                                <div className="flex justify-end gap-2">
                                                                    <button type="button" className="btn btn-xs btn-ghost" onClick={handleReset}>ยกเลิก</button>
                                                                    <button type="button" className="btn btn-xs btn-primary" onClick={submitGoal}>บันทึก</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex justify-between items-start mb-2 group/goal">
                                                                    <div className="flex items-center gap-2 font-semibold text-primary">
                                                                        <FontAwesomeIcon icon={faBullseye} />
                                                                        <span>{goal.code}</span>
                                                                        <span className="text-base-content">{goal.name}</span>
                                                                    </div>
                                                                    <div className="flex gap-1 opacity-0 group-hover/goal:opacity-100 transition-opacity">
                                                                        <button className="btn btn-ghost btn-xs text-info" onClick={() => { setEditingItem({ type: 'goal', id: goal.id, parentId: issue.id }); setFormData({ code: goal.code, name: goal.name, description: goal.description }); }}>
                                                                            <FontAwesomeIcon icon={faEdit} />
                                                                        </button>
                                                                        <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete('goal', goal.id)}>
                                                                            <FontAwesomeIcon icon={faTrash} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {goal.description && <p className="text-xs text-base-content/70 ml-6 mb-3">{goal.description}</p>}

                                                                {/* Indicators */}
                                                                <div className="ml-6 pl-3 border-l-2 border-base-200">
                                                                    <h6 className="text-[10px] font-bold uppercase text-base-content/40 mb-2 flex items-center gap-1">
                                                                        <FontAwesomeIcon icon={faListCheck} /> ตัวชี้วัดมาตรฐาน (Indicators)
                                                                    </h6>
                                                                    <div className="space-y-1 mb-2">
                                                                        {goal.indicators.map((ind: any) => (
                                                                            <div key={ind.id} className="flex justify-between items-center text-xs bg-base-100 p-1.5 rounded border border-base-100 hover:border-base-300">
                                                                                <span className="flex-1 truncate">{ind.name} <span className="opacity-50">({ind.unit})</span></span>
                                                                                <span className="opacity-50 mr-2">เป้า: {ind.targetValue ?? '-'}</span>
                                                                                <button className="text-error hover:bg-error/10 p-1 rounded" onClick={() => handleDelete('indicator', ind.id)}><FontAwesomeIcon icon={faTrash} /></button>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Add Indicator Form Inline */}
                                                                    {editingItem?.type === 'indicator' && editingItem.parentId === goal.id ? (
                                                                        <div className="bg-base-100 p-2 rounded border border-primary/20 shadow-sm mt-2 text-xs">
                                                                            <input name="name" value={formData.name ?? ""} placeholder="ชื่อตัวชี้วัด" className="input input-xs input-bordered w-full mb-1" onChange={handleChange} autoFocus />
                                                                            <div className="grid grid-cols-2 gap-1 mb-1">
                                                                                <input name="unit" value={formData.unit ?? ""} placeholder="หน่วยนับ" className="input input-xs input-bordered w-full" onChange={handleChange} />
                                                                                <input name="targetValue" value={formData.targetValue ?? ""} type="number" placeholder="เป้าหมาย" className="input input-xs input-bordered w-full" onChange={handleChange} />
                                                                            </div>
                                                                            <div className="flex justify-end gap-1">
                                                                                <button className="btn btn-xs btn-ghost" onClick={handleReset}>ยกเลิก</button>
                                                                                <button className="btn btn-xs btn-primary" onClick={submitIndicator}>เพิ่ม</button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <button className="btn btn-xs btn-ghost text-base-content/50 hover:text-primary w-full text-left" onClick={() => { setEditingItem({ type: 'indicator', id: 'new', parentId: goal.id }); setFormData({}); }}>
                                                                            + เพิ่มตัวชี้วัด
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}

                                                {/* Add Goal Button */}
                                                {editingItem?.type === 'goal' && editingItem.parentId === issue.id && editingItem.id === 'new' ? (
                                                    <div className="bg-white border border-primary/30 rounded p-3 shadow-sm">
                                                        <h4 className="text-xs font-bold mb-2 text-primary">เพิ่มเป้าหมายใหม่</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex gap-2">
                                                                <input name="name" value={formData.name ?? ""} className="input input-xs input-bordered w-full" placeholder="ชื่อเป้าหมาย" onChange={handleChange} autoFocus />
                                                            </div>
                                                            <textarea name="description" value={formData.description ?? ""} className="textarea textarea-xs textarea-bordered w-full" placeholder="รายละเอียดเพิ่มเติม" onChange={handleChange}></textarea>
                                                            <div className="flex justify-end gap-2">
                                                                <button className="btn btn-xs btn-ghost" onClick={handleReset}>ยกเลิก</button>
                                                                <button className="btn btn-xs btn-primary" onClick={submitGoal}>บันทึก</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button className="btn btn-xs btn-outline btn-dashed w-full border-base-300 hover:border-primary hover:text-primary" onClick={() => { setEditingItem({ type: 'goal', id: 'new', parentId: issue.id }); setFormData({}); }}>
                                                        <FontAwesomeIcon icon={faPlus} /> เพิ่มเป้าหมาย
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Issue Button */}
                                {editingItem?.type === 'issue' && editingItem.parentId === plan.id && editingItem.id === 'new' ? (
                                    <div className="bg-base-50 p-4 border border-primary/30 rounded-lg">
                                        <h4 className="font-bold text-sm mb-2 text-primary">เพิ่มประเด็นการพัฒนาใหม่</h4>
                                        <div className="flex gap-2 mb-2">
                                            <input name="name" value={formData.name ?? ""} className="input input-sm input-bordered w-full" placeholder="ชื่อประเด็น" onChange={handleChange} autoFocus />
                                        </div>
                                        <button className="btn btn-sm btn-primary mr-2" onClick={submitIssue}><FontAwesomeIcon icon={faSave} /> บันทึก</button>
                                        <button className="btn btn-sm btn-ghost" onClick={handleReset}>ยกเลิก</button>
                                    </div>
                                ) : (
                                    <button className="btn btn-sm btn-outline w-full border-dashed" onClick={() => { setEditingItem({ type: 'issue', id: 'new', parentId: plan.id }); setFormData({}); }}>
                                        <FontAwesomeIcon icon={faPlus} /> เพิ่มประเด็นการพัฒนา
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {initialPlans.length === 0 && editingItem?.type !== 'plan' && (
                    <div className="p-10 text-center text-base-content/50">
                        ยังไม่มีแผนยุทธศาสตร์ คลิก "เพิ่มแผนประจำปี" ด้านบนเพื่อเริ่มต้น
                    </div>
                )}
            </div>
        </div>
    );
}
