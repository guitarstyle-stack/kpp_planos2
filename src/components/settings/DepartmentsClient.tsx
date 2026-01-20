"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faBuilding } from "@fortawesome/free-solid-svg-icons";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { deleteDepartmentAction } from "@/actions/departmentActions";

interface Department {
    id: number;
    code: string;
    name: string;
    isActive: boolean;
}

interface DepartmentsClientProps {
    departments: Department[];
}

export function DepartmentsClient({ departments }: DepartmentsClientProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        จัดการหน่วยงาน
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        เพิ่ม ลบ แก้ไข ข้อมูลหน่วยงานภายในองค์กร
                    </p>
                </div>
                <Link
                    href="/settings/departments/new"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 shadow-sm transition-all"
                >
                    <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                    เพิ่มหน่วยงาน
                </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
                        <thead className="bg-zinc-50 text-xs uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">รหัสหน่วยงาน</th>
                                <th scope="col" className="px-6 py-3">ชื่อหน่วยงาน</th>
                                <th scope="col" className="px-6 py-3">สถานะ</th>
                                <th scope="col" className="px-6 py-3 text-right">ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {departments.map((dept) => (
                                <tr key={dept.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                                        {dept.code}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faBuilding} className="text-zinc-400" />
                                            {dept.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${dept.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                            {dept.isActive ? "ใช้งานปกติ" : "ไม่ใช้งาน"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/settings/departments/${dept.id}/edit`}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                                                title="แก้ไข"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </Link>
                                            <DeleteButton
                                                id={dept.id}
                                                itemName={dept.name}
                                                deleteAction={deleteDepartmentAction}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {departments.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        ไม่พบข้อมูลหน่วยงาน
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
