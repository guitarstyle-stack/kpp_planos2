"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

interface DevelopmentIssue {
    id: number;
    code: string;
    name: string;
    annualPlan: { name: string; fiscalYear: number };
}

interface DevelopmentGoalFormProps {
    initialData?: {
        id?: number;
        issueId: number;
        code: string;
        name: string;
        description?: string | null;
    };
    issues: DevelopmentIssue[];
}

export function DevelopmentGoalForm({ initialData, issues }: DevelopmentGoalFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const isEdit = !!initialData?.id;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);

        try {
            const { createGoalAction, updateGoalAction } = await import("@/actions/developmentPlanActions");

            if (isEdit && initialData?.id) {
                await updateGoalAction(initialData.id, formData);
                toast.success("อัปเดตเป้าหมายสำเร็จ");
            } else {
                await createGoalAction(null, formData);
                toast.success("สร้างเป้าหมายสำเร็จ");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-sm border border-base-300 max-w-2xl mx-auto">
            <div className="card-body">
                <h2 className="card-title border-b border-base-200 pb-4">
                    {isEdit ? "แก้ไขเป้าหมาย" : "สร้างเป้าหมาย"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="form-control col-span-1 md:col-span-2">
                        <label className="label">
                            <span className="label-text">ประเด็นการพัฒนา <span className="text-error">*</span></span>
                        </label>
                        <select
                            name="issueId"
                            required
                            defaultValue={initialData?.issueId}
                            className="select select-bordered w-full"
                        >
                            <option value="">-- เลือกประเด็น --</option>
                            {issues.map((issue) => (
                                <option key={issue.id} value={issue.id}>
                                    [{issue.code}] {issue.name} ({issue.annualPlan.fiscalYear})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">รหัสเป้าหมาย <span className="text-error">*</span></span>
                        </label>
                        <input
                            type="text"
                            name="code"
                            required
                            defaultValue={initialData?.code}
                            placeholder="เช่น G1.1, G1.2"
                            className="input input-bordered w-full"
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">ชื่อเป้าหมาย <span className="text-error">*</span></span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            defaultValue={initialData?.name}
                            placeholder="เช่น ผู้สูงอายุมีสุขภาพดี"
                            className="input input-bordered w-full"
                        />
                    </div>

                    <div className="form-control col-span-1 md:col-span-2">
                        <label className="label">
                            <span className="label-text">รายละเอียด</span>
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            defaultValue={initialData?.description || ""}
                            placeholder="รายละเอียดเป้าหมาย..."
                            className="textarea textarea-bordered w-full"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={() => router.back()} className="btn btn-ghost">
                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                        ยกเลิก
                    </button>
                    <button type="submit" disabled={isLoading} className="btn btn-primary">
                        {isLoading ? (
                            <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                            <FontAwesomeIcon icon={faSave} className="mr-2" />
                        )}
                        บันทึก
                    </button>
                </div>
            </div>
        </form>
    );
}
