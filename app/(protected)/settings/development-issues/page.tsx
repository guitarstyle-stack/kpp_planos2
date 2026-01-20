import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { getDevelopmentIssues } from "@/services/developmentPlanService";

export default async function DevelopmentIssuesPage() {
    const issues = await getDevelopmentIssues();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        ประเด็นการพัฒนา
                    </h1>
                    <p className="text-sm opacity-70">
                        จัดการประเด็นการพัฒนาภายใต้แผนพัฒนาสังคม
                    </p>
                </div>
                <Link href="/settings/development-issues/new" className="btn btn-primary">
                    <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
                    สร้างประเด็นใหม่
                </Link>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>รหัส</th>
                                <th>ชื่อประเด็น</th>
                                <th>แผนพัฒนาสังคม</th>
                                <th>จำนวนเป้าหมาย</th>
                                <th><span className="sr-only">จัดการ</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {issues.map((issue: any) => (
                                <tr key={issue.id} className="hover">
                                    <td>
                                        <span className="badge badge-outline">{issue.code}</span>
                                    </td>
                                    <td className="font-medium">{issue.name}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faLayerGroup} className="h-4 w-4 opacity-50" />
                                            {issue.annualPlan.name}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-ghost">{issue.goals.length} เป้าหมาย</span>
                                    </td>
                                    <td className="text-right">
                                        <Link href={`/settings/development-issues/${issue.id}/edit`} className="btn btn-ghost btn-sm">
                                            <FontAwesomeIcon icon={faEdit} className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {issues.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 opacity-50">
                                        ยังไม่มีประเด็นการพัฒนา
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
