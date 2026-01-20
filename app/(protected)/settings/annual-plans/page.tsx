import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faCalendar } from "@fortawesome/free-solid-svg-icons";
import { getAnnualPlans } from "@/services/developmentPlanService";

export default async function AnnualPlansPage() {
    const plans = await getAnnualPlans();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        แผนพัฒนาสังคมประจำปี
                    </h1>
                    <p className="text-sm opacity-70">
                        จัดการแผนพัฒนาสังคมประจำปี (แผนสูงสุด)
                    </p>
                </div>
                <Link href="/settings/annual-plans/new" className="btn btn-primary">
                    <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
                    สร้างแผนใหม่
                </Link>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>ชื่อแผน</th>
                                <th>ปีงบประมาณ</th>
                                <th>จำนวนประเด็น</th>
                                <th>สถานะ</th>
                                <th><span className="sr-only">จัดการ</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map((plan) => (
                                <tr key={plan.id} className="hover">
                                    <td className="font-medium">{plan.name}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 opacity-50" />
                                            {plan.fiscalYear}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-ghost">{plan.issues.length} ประเด็น</span>
                                    </td>
                                    <td>
                                        {plan.isActive ? (
                                            <span className="badge badge-success badge-sm">ใช้งาน</span>
                                        ) : (
                                            <span className="badge badge-error badge-sm">ปิดใช้งาน</span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        <Link href={`/settings/annual-plans/${plan.id}/edit`} className="btn btn-ghost btn-sm">
                                            <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {plans.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 opacity-50">
                                        ยังไม่มีแผนพัฒนาสังคม
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
