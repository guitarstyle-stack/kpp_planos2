"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

interface AnnualPlanFormProps {
    initialData?: {
        id?: number;
        name: string;
        fiscalYear: number;
    };
}

export function AnnualPlanForm({ initialData }: AnnualPlanFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const isEdit = !!initialData?.id;

    const currentYear = new Date().getFullYear() + 543;
    const fiscalYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);

        try {
            const { createAnnualPlanAction, updateAnnualPlanAction } = await import("@/actions/developmentPlanActions");

            if (isEdit && initialData?.id) {
                await updateAnnualPlanAction(initialData.id, formData);
                toast.success("อัปเดตแผนสำเร็จ");
            } else {
                await createAnnualPlanAction(null, formData);
                toast.success("สร้างแผนสำเร็จ");
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
                    {isEdit ? "แก้ไขแผนพัฒนาสังคมประจำปี" : "สร้างแผนพัฒนาสังคมประจำปี"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="form-control col-span-1 md:col-span-2">
                        <label className="label">
                            <span className="label-text">ชื่อแผน <span className="text-error">*</span></span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            defaultValue={initialData?.name}
                            placeholder="เช่น แผนพัฒนาสังคม พ.ศ. 2568"
                            className="input input-bordered w-full"
                        />
                    </div>

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
