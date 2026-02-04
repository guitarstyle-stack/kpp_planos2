import Link from "next/link";
import { getIndicatorsAction, getIndicatorStatsAction } from "@/actions/indicatorActions";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine, faCheckCircle, faExclamationCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

export const dynamic = "force-dynamic";

export default async function IndicatorsPage() {
    const session = await getSession();
    if (!session?.user) {
        redirect("/");
    }

    const [indicatorsResult, statsResult] = await Promise.all([
        getIndicatorsAction({ limit: 50 }),
        getIndicatorStatsAction(),
    ]);

    if (!indicatorsResult.success || !statsResult.success) {
        return (
            <div className="alert alert-error">
                <span>เกิดข้อผิดพลาด: ไม่สามารถโหลดข้อมูลตัวชี้วัดได้</span>
            </div>
        );
    }

    const data = indicatorsResult.data;
    const indicators = data?.indicators || [];
    const total = data?.total || 0;
    const stats = statsResult.data || { total: 0, achieved: 0, notAchieved: 0, noData: 0, achievementRate: 0 };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">
                    ตัวชี้วัด (Indicators)
                </h1>
                <p className="text-sm opacity-70">
                    ติดตามและจัดการตัวชี้วัดความสำเร็จของโครงการ
                </p>
            </div>

            {/* Stats Cards */}
            <div className="stats shadow-sm border border-base-200 w-full bg-base-100 lg:stats-horizontal stats-vertical">
                <div className="stat">
                    <div className="stat-figure text-primary">
                        <FontAwesomeIcon icon={faChartLine} className="h-8 w-8" />
                    </div>
                    <div className="stat-title">ตัวชี้วัดทั้งหมด</div>
                    <div className="stat-value text-primary">{stats.total}</div>
                    <div className="stat-desc">ตัวชี้วัดในระบบ</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-success">
                        <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8" />
                    </div>
                    <div className="stat-title">บรรลุเป้าหมาย</div>
                    <div className="stat-value text-success">{stats.achieved}</div>
                    <div className="stat-desc">{stats.achievementRate}% ของทั้งหมด</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-warning">
                        <FontAwesomeIcon icon={faExclamationCircle} className="h-8 w-8" />
                    </div>
                    <div className="stat-title">ยังไม่บรรลุ</div>
                    <div className="stat-value text-warning">{stats.notAchieved}</div>
                    <div className="stat-desc">กำลังดำเนินการ</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-error">
                        <FontAwesomeIcon icon={faTimesCircle} className="h-8 w-8" />
                    </div>
                    <div className="stat-title">ไม่มีข้อมูล</div>
                    <div className="stat-value text-error">{stats.noData}</div>
                    <div className="stat-desc">ยังไม่มีรายงาน</div>
                </div>
            </div>

            {/* Indicators Table */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="border-b border-base-200 bg-base-200/30 px-6 py-4">
                    <h3 className="font-bold text-lg">รายการตัวชี้วัด ({total} รายการ)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr className="bg-base-200/50">
                                <th>ตัวชี้วัด</th>
                                <th>โครงการ</th>
                                <th>หน่วยนับ</th>
                                <th className="text-center">ค่าเป้าหมาย</th>
                                <th className="text-center">ค่าล่าสุด</th>
                                <th className="text-right">ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {indicators.map((indicator: any) => {
                                const latestResult = indicator.reportResults?.[0];
                                const actualValue = latestResult?.actualValue;
                                const progress = indicator.targetValue && actualValue
                                    ? Math.round((actualValue / indicator.targetValue) * 100)
                                    : 0;

                                return (
                                    <tr key={indicator.id} className="hover">
                                        <td>
                                            <div className="font-medium">{indicator.name}</div>
                                            {indicator.description && (
                                                <div className="text-xs opacity-70 truncate max-w-xs">
                                                    {indicator.description}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <Link
                                                href={`/projects/${indicator.project.id}`}
                                                className="link link-hover text-xs"
                                            >
                                                {indicator.project.name}
                                            </Link>
                                        </td>
                                        <td className="text-sm">{indicator.unit}</td>
                                        <td className="text-center font-mono text-sm">
                                            {indicator.targetValue?.toLocaleString() || "-"}
                                        </td>
                                        <td className="text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="font-mono text-sm">
                                                    {actualValue?.toLocaleString() || "-"}
                                                </span>
                                                {actualValue && indicator.targetValue && (
                                                    <span
                                                        className={`badge badge-sm ${progress >= 100
                                                            ? "badge-success"
                                                            : progress >= 75
                                                                ? "badge-info"
                                                                : progress >= 50
                                                                    ? "badge-warning"
                                                                    : "badge-error"
                                                            }`}
                                                    >
                                                        {progress}%
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <Link
                                                href={`/indicators/${indicator.id}`}
                                                className="btn btn-ghost btn-xs text-primary"
                                            >
                                                ดูรายละเอียด
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {indicators.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 opacity-50">
                                        ยังไม่มีตัวชี้วัด
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
