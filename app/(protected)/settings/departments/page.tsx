import Link from "next/link";
import { getDepartments } from "@/services/departmentService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faTrash, faBuilding } from "@fortawesome/free-solid-svg-icons";

export default async function DepartmentsPage() {
    const departments = await getDepartments();

    return (

        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        จัดการหน่วยงาน
                    </h1>
                    <p className="text-sm opacity-70">
                        เพิ่ม ลบ แก้ไข ข้อมูลหน่วยงานภายในองค์กร
                    </p>
                </div>
                <Link
                    href="/settings/departments/new"
                    className="btn btn-primary gap-2"
                >
                    <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                    เพิ่มหน่วยงาน
                </Link>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>รหัสหน่วยงาน</th>
                                <th>ชื่อหน่วยงาน</th>
                                <th>สถานะ</th>
                                <th className="text-right">ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map((dept: any) => (
                                <tr key={dept.id} className="hover">
                                    <td className="font-medium whitespace-nowrap">
                                        {dept.code}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faBuilding} className="opacity-50" />
                                            {dept.name}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap">
                                        <span className={`badge ${dept.isActive ? 'badge-success' : 'badge-error'}`}>
                                            {dept.isActive ? "ใช้งานปกติ" : "ไม่ใช้งาน"}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/settings/departments/${dept.id}/edit`}
                                                className="btn btn-ghost btn-xs text-info"
                                                title="แก้ไข"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </Link>
                                            <button className="btn btn-ghost btn-xs text-error" title="ลบ">
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {departments.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-12 opacity-50">
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
