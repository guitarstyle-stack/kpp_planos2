"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

interface AnnualPlan {
    id: number;
    name: string;
    fiscalYear: number;
}

interface DevelopmentIssueFormProps {
    initialData?: {
        id?: number;
        annualPlanId: number;
        code: string;
        name: string;
        description?: string | null;
    };
    annualPlans: AnnualPlan[];
}

export function DevelopmentIssueForm({ initialData, annualPlans }: DevelopmentIssueFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const isEdit = !!initialData?.id;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);

        try {
            const { createIssueAction, updateIssueAction } = await import("@/actions/developmentPlanActions");

            if (isEdit && initialData?.id) {
                await updateIssueAction(initialData.id, formData);
                toast.success("อัปเดตประเด็นสำเร็จ");
            } else {
                await createIssueAction(null, formData);
                toast.success("สร้างประเด็นสำเร็จ");
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
                    {isEdit ? "แก้ไขประเด็นการพัฒนา" : "สร้างประเด็นการพัฒนา"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">แผนพัฒนาสังคม <span className="text-error">*</span></span>
                        </label>
                        <select
                            name="annualPlanId"
                            required
                            defaultValue={initialData?.annualPlanId}
                            className="select select-bordered w-full"
                        >
                            <option value="">-- เลือกแผน --</option>
                            {annualPlans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.name} ({plan.fiscalYear})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">รหัสประเด็น <span className="text-error">*</span></span>
                        </label>
                        <input
                            type="text"
                            name="code"
                            required
                            defaultValue={initialData?.code}
                            placeholder="เช่น D1, D2"
                            className="input input-bordered w-full"
                        />
                    </div>

                    <div className="form-control col-span-1 md:col-span-2">
                        <label className="label">
                            <span className="label-text">ชื่อประเด็น <span className="text-error">*</span></span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            defaultValue={initialData?.name}
                            placeholder="เช่น ส่งเสริมคุณภาพชีวิตผู้สูงอายุ"
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
                            placeholder="รายละเอียดประเด็นการพัฒนา..."
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
