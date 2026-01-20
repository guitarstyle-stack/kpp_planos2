import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faBullseye } from "@fortawesome/free-solid-svg-icons";
import { getDevelopmentGoals } from "@/services/developmentPlanService";

export default async function DevelopmentGoalsPage() {
    const goals = await getDevelopmentGoals();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        เป้าหมาย/เป้าประสงค์
                    </h1>
                    <p className="text-sm opacity-70">
                        จัดการเป้าหมายภายใต้ประเด็นการพัฒนา
                    </p>
                </div>
                <Link href="/settings/development-goals/new" className="btn btn-primary">
                    <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
                    สร้างเป้าหมายใหม่
                </Link>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>รหัส</th>
                                <th>ชื่อเป้าหมาย</th>
                                <th>ประเด็นการพัฒนา</th>
                                <th>ปีงบประมาณ</th>
                                <th><span className="sr-only">จัดการ</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {goals.map((goal) => (
                                <tr key={goal.id} className="hover">
                                    <td>
                                        <span className="badge badge-primary badge-outline">{goal.code}</span>
                                    </td>
                                    <td className="font-medium">{goal.name}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faBullseye} className="h-4 w-4 opacity-50" />
                                            [{goal.issue.code}] {goal.issue.name}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-ghost">{goal.issue.annualPlan.fiscalYear}</span>
                                    </td>
                                    <td className="text-right">
                                        <Link href={`/settings/development-goals/${goal.id}/edit`} className="btn btn-ghost btn-sm">
                                            <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {goals.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 opacity-50">
                                        ยังไม่มีเป้าหมาย
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
