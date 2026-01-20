"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

interface DepartmentType {
    id: number;
    code: string;
    name: string;
}

interface DepartmentFormProps {
    initialData?: {
        id?: number;
        code: string;
        name: string;
        typeId?: number | null;
        isActive: boolean;
    };
    departmentTypes?: DepartmentType[];
}

export function DepartmentForm({ initialData, departmentTypes = [] }: DepartmentFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const isEdit = !!initialData?.id;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        const formData = new FormData(event.currentTarget);

        try {
            // Dynamic import to avoid build errors if action doesn't exist yet
            const { createDepartmentAction, updateDepartmentAction } = await import("@/actions/departmentActions");

            if (isEdit && initialData?.id) {
                await updateDepartmentAction(initialData.id, formData);
                toast.success("อัปเดตข้อมูลหน่วยงานสำเร็จ");
            } else {
                await createDepartmentAction(null, formData);
                toast.success("สร้างหน่วยงานสำเร็จ");
            }

            router.push("/settings/departments");
            router.refresh();
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    {isEdit ? "แก้ไขข้อมูลหน่วยงาน" : "เพิ่มหน่วยงานใหม่"}
                </h2>

                <div className="grid grid-cols-1 gap-6">
                    {/* ประเภทหน่วยงาน */}
                    <div>
                        <label htmlFor="typeId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            ประเภทหน่วยงาน <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="typeId"
                            id="typeId"
                            required
                            defaultValue={initialData?.typeId || ""}
                            className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700"
                        >
                            <option value="">-- เลือกประเภทหน่วยงาน --</option>
                            {departmentTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            รหัสหน่วยงาน <span className="text-zinc-400">(ถ้าไม่ระบุจะสร้างอัตโนมัติ)</span>
                        </label>
                        <input
                            type="text"
                            name="code"
                            id="code"
                            defaultValue={initialData?.code}
                            placeholder="เว้นว่างเพื่อสร้างอัตโนมัติ หรือกรอก เช่น IT, HR, AC"
                            className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700"
                        />
                        <p className="mt-1 text-xs text-zinc-500">
                            ตัวอย่าง: "ฝ่ายเทคโนโลยี" → รหัส "TECH-001"
                        </p>
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            ชื่อหน่วยงาน <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            defaultValue={initialData?.name}
                            placeholder="เช่น ฝ่ายเทคโนโลยีสารสนเทศ"
                            className="w-full rounded-lg border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            id="isActive"
                            name="isActive"
                            type="checkbox"
                            defaultChecked={initialData?.isActive ?? true}
                            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-900"
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm text-zinc-900 dark:text-zinc-300">
                            เปิดใช้งาน (Active)
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                    <FontAwesomeIcon icon={faTimes} className="mr-2" />
                    ยกเลิก
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    {isLoading ? "กำลังบันทึก..." : (
                        <>
                            <FontAwesomeIcon icon={faSave} className="mr-2" />
                            บันทึกข้อมูล
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

