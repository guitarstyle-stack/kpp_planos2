import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getIndicatorAction, getIndicatorTrendAction, calculateIndicatorProgressAction } from "@/actions/indicatorActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faChartLine,
    faBullseye,
    faCalendar,
    faCheckCircle,
    faExclamationTriangle,
    faTimesCircle
} from "@fortawesome/free-solid-svg-icons";
import { IndicatorProgressChart } from "@/components/indicators/IndicatorProgressChart";

export const dynamic = "force-dynamic";

interface IndicatorDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function IndicatorDetailPage({ params }: IndicatorDetailPageProps) {
    const session = await getSession();
    if (!session?.user) {
        redirect("/");
    }

    const { id } = await params;
    const indicatorId = parseInt(id, 10);

    if (isNaN(indicatorId)) {
        notFound();
    }

    const [indicatorResult, trendResult, progressResult] = await Promise.all([
        getIndicatorAction(indicatorId),
        getIndicatorTrendAction(indicatorId),
        calculateIndicatorProgressAction(indicatorId),
    ]);

    if (!indicatorResult.success || !indicatorResult.data) {
        notFound();
    }

    const indicator = indicatorResult.data;
    const trend = trendResult.success && trendResult.data ? trendResult.data : [];
    const progress = progressResult.success ? progressResult.data : null;

    // Prepare chart data
    const chartData = Array.isArray(trend) ? trend.map((result: any) => ({
        label: `${result.report.fiscalYear} - ${result.report.periodType}`,
        actualValue: result.actualValue,
        targetValue: indicator.targetValue || 0,
        date: result.createdAt,
    })) : [];

    // Calculate cumulative actual value
    const cumulativeActual = Array.isArray(trend) ? trend.reduce((sum: number, result: any) => sum + (result.actualValue || 0), 0) : 0;

    // Status badge
    const getStatusBadge = () => {
        if (!progress || progress.status === "NO_TARGET" || progress.status === "NO_DATA") {
            return <span className="badge badge-ghost">ไม่มีข้อมูล</span>;
        }

        const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
            ACHIEVED: { label: "บรรลุเป้าหมาย", class: "badge-success", icon: faCheckCircle },
            ON_TRACK: { label: "กำลังไปได้ดี", class: "badge-info", icon: faChartLine },
            AT_RISK: { label: "ต้องติดตาม", class: "badge-warning", icon: faExclamationTriangle },
            BEHIND: { label: "ต่ำกว่าเป้า", class: "badge-error", icon: faTimesCircle },
        };

        const config = statusConfig[progress.status] || statusConfig.BEHIND;

        return (
            <span className={`badge ${config.class} gap-2`}>
                <FontAwesomeIcon icon={config.icon} className="h-3 w-3" />
                {config.label}
            </span>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <Link href="/indicators" className="btn btn-ghost btn-sm gap-2">
                    <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
                    กลับ
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">
                        {indicator.name}
                    </h1>
                    {indicator.description && (
                        <p className="text-sm opacity-70 mt-1">{indicator.description}</p>
                    )}
                </div>
                {getStatusBadge()}
            </div>

            {/* Project Info Card */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
                    <h3 className="card-title text-lg">โครงการที่เกี่ยวข้อง</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                            <p className="text-sm opacity-70">โครงการ</p>
                            <Link
                                href={`/projects/${indicator.project.id}`}
                                className="link link-primary font-medium"
                            >
                                {indicator.project.code} - {indicator.project.name}
                            </Link>
                        </div>
                        <div>
                            <p className="text-sm opacity-70">หน่วยงาน</p>
                            <p className="font-medium">{indicator.project.department.name}</p>
                        </div>
                        <div>
                            <p className="text-sm opacity-70">ปีงบประมาณ</p>
                            <p className="font-medium">{indicator.project.fiscalYear}</p>
                        </div>
                        <div>
                            <p className="text-sm opacity-70">หน่วยนับ</p>
                            <p className="font-medium">{indicator.unit}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats shadow-sm border border-base-200 w-full bg-base-100 lg:stats-horizontal stats-vertical">
                <div className="stat">
                    <div className="stat-figure text-info">
                        <FontAwesomeIcon icon={faChartLine} className="h-8 w-8" />
                    </div>
                    <div className="stat-title">ค่าฐาน (Baseline)</div>
                    <div className="stat-value text-info">
                        {indicator.baselineValue?.toLocaleString() || "-"}
                    </div>
                    <div className="stat-desc">{indicator.unit}</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-success">
                        <FontAwesomeIcon icon={faBullseye} className="h-8 w-8" />
                    </div>
                    <div className="stat-title">เป้าหมาย (Target)</div>
                    <div className="stat-value text-success">
                        {indicator.targetValue?.toLocaleString() || "-"}
                    </div>
                    <div className="stat-desc">{indicator.unit}</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-primary">
                        <FontAwesomeIcon icon={faCalendar} className="h-8 w-8" />
                    </div>
                    <div className="stat-title">ผลรวมสะสม</div>
                    <div className="stat-value text-primary">
                        {cumulativeActual.toLocaleString()}
                    </div>
                    <div className="stat-desc">{indicator.unit}</div>
                </div>

                {progress && progress.percentage !== undefined && (
                    <div className="stat">
                        <div className="stat-figure text-accent">
                            <div className="radial-progress text-accent" style={{ "--value": Math.min(progress.percentage, 100) } as any}>
                                {Math.min(progress.percentage, 100)}%
                            </div>
                        </div>
                        <div className="stat-title">ความก้าวหน้า</div>
                        <div className="stat-value text-accent">{progress.percentage}%</div>
                        <div className="stat-desc">
                            {progress.percentage >= 100 ? "บรรลุเป้าหมาย" : "ของเป้าหมาย"}
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Chart */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
                    <h3 className="card-title text-lg mb-4">
                        <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-primary" />
                        กราฟแสดงความก้าวหน้า
                    </h3>
                    <IndicatorProgressChart data={chartData} unit={indicator.unit} />
                </div>
            </div>

            {/* Historical Results Table */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="border-b border-base-200 bg-base-200/30 px-6 py-4">
                    <h3 className="font-bold text-lg">ประวัติผลลัพธ์ ({trend.length} รายการ)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr className="bg-base-200/50">
                                <th>ปีงบประมาณ</th>
                                <th>งวด</th>
                                <th className="text-right">ค่าจริง</th>
                                <th className="text-right">เป้าหมาย</th>
                                <th className="text-center">% ความสำเร็จ</th>
                                <th>วันที่บันทึก</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trend.map((result: any) => {
                                const percentage = indicator.targetValue && result.actualValue
                                    ? Math.round((result.actualValue / indicator.targetValue) * 100)
                                    : 0;

                                return (
                                    <tr key={result.id} className="hover">
                                        <td className="font-medium">{result.report.fiscalYear}</td>
                                        <td>
                                            <span className="badge badge-sm badge-outline">
                                                {result.report.periodType}
                                            </span>
                                        </td>
                                        <td className="text-right font-mono">
                                            {result.actualValue?.toLocaleString() || "-"}
                                        </td>
                                        <td className="text-right font-mono opacity-70">
                                            {indicator.targetValue?.toLocaleString() || "-"}
                                        </td>
                                        <td className="text-center">
                                            <span
                                                className={`badge badge-sm ${percentage >= 100
                                                    ? "badge-success"
                                                    : percentage >= 75
                                                        ? "badge-info"
                                                        : percentage >= 50
                                                            ? "badge-warning"
                                                            : "badge-error"
                                                    }`}
                                            >
                                                {percentage}%
                                            </span>
                                        </td>
                                        <td className="text-sm opacity-70">
                                            {new Date(result.createdAt).toLocaleDateString("th-TH", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </td>
                                    </tr>
                                );
                            })}
                            {trend.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 opacity-50">
                                        ยังไม่มีข้อมูลผลลัพธ์
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
