"use client";

import { cssVars } from "@/lib/utils";

interface StatusChartProps {
    statusCounts: {
        NOT_STARTED: number;
        IN_PROGRESS: number;
        COMPLETED: number;
        CANCELLED: number;
    };
}

interface DepartmentChartProps {
    departmentCounts: Record<string, number>;
}

interface FiscalYearChartProps {
    yearlyCounts: Record<string, number>;
}

interface BudgetChartProps {
    budgetByDepartment: Record<string, { total: number; spent: number }>;
}

interface ProgressDistributionChartProps {
    distribution: Record<string, number>;
}

const statusLabels: Record<string, { label: string; color: string }> = {
    NOT_STARTED: { label: "ยังไม่เริ่ม", color: "bg-base-300" },
    IN_PROGRESS: { label: "กำลังดำเนินการ", color: "bg-info" },
    COMPLETED: { label: "เสร็จสิ้น", color: "bg-success" },
    CANCELLED: { label: "ยกเลิก", color: "bg-error" },
};

export function StatusChart({ statusCounts }: StatusChartProps) {
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    if (total === 0) return <div className="text-center text-base-content/50 py-8">ไม่มีข้อมูลโครงการ</div>;

    return (
        <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => {
                const percentage = Math.round((count / total) * 100);
                const { label, color } = statusLabels[status] || { label: status, color: "bg-base-300" };
                return (
                    <div key={status} className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>{label}</span>
                            <span className="font-medium">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-base-200 rounded-full h-3">
                            <div
                                className={`${color} h-3 rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function DepartmentChart({ departmentCounts }: DepartmentChartProps) {
    const entries = Object.entries(departmentCounts).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    if (total === 0) return <div className="text-center text-base-content/50 py-8">ไม่มีข้อมูลโครงการ</div>;

    const colors = ["bg-primary", "bg-secondary", "bg-accent", "bg-info", "bg-success", "bg-warning"];

    return (
        <div className="space-y-3">
            {entries.slice(0, 6).map(([dept, count], index) => {
                const percentage = Math.round((count / total) * 100);
                return (
                    <div key={dept} className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="truncate max-w-[200px]" title={dept}>{dept}</span>
                            <span className="font-medium">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-base-200 rounded-full h-3">
                            <div
                                className={`${colors[index % colors.length]} h-3 rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                );
            })}
            {entries.length > 6 && (
                <div className="text-sm text-base-content/50 text-center">
                    และอีก {entries.length - 6} หน่วยงาน...
                </div>
            )}
        </div>
    );
}

export function FiscalYearChart({ yearlyCounts }: FiscalYearChartProps) {
    const entries = Object.entries(yearlyCounts).sort((a, b) => Number(a[0]) - Number(b[0]));
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    if (total === 0) return <div className="text-center text-base-content/50 py-8">ไม่มีข้อมูลโครงการ</div>;

    const maxCount = Math.max(...entries.map(([, count]) => count));

    return (
        <div className="flex items-end justify-center space-x-4 h-48 pt-6">
            {entries.map(([year, count]) => {
                const heightPercentage = Math.max(10, Math.round((count / maxCount) * 100)); // Min 10% height for visibility
                return (
                    <div key={year} className="flex flex-col items-center gap-2 group w-16">
                        <div className="relative w-full flex justify-center h-full items-end">
                            <div
                                className="w-8 bg-primary/80 hover:bg-primary transition-all duration-300 rounded-t-lg"
                                style={{ height: `${heightPercentage}%` }}
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-base-300 text-xs px-2 py-1 rounded shadow whitespace-nowrap z-10">
                                    {count} โครงการ
                                </div>
                            </div>
                        </div>
                        <div className="text-sm font-medium">{year}</div>
                    </div>
                );
            })}
        </div>
    );
}

export function BudgetChart({ budgetByDepartment }: BudgetChartProps) {
    const entries = Object.entries(budgetByDepartment)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 6); // Top 6 departments by budget

    if (entries.length === 0) return <div className="text-center text-base-content/50 py-8">ไม่มีข้อมูลงบประมาณ</div>;

    const maxBudget = Math.max(...entries.map(([, data]) => data.total));

    const formatMoney = (amount: number) => {
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
        return amount.toLocaleString();
    };

    return (
        <div className="space-y-4">
            {entries.map(([dept, data]) => {
                const spentPercent = data.total > 0 ? Math.min(100, Math.round((data.spent / data.total) * 100)) : 0;

                return (
                    <div key={dept} className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="truncate max-w-[150px] font-medium" title={dept}>{dept}</span>
                            <div className="text-right flex flex-col items-end">
                                <span className="text-xs opacity-70">งบ: {formatMoney(data.total)}</span>
                                <span className="text-xs font-bold text-info">ใช้: {formatMoney(data.spent)} ({spentPercent}%)</span>
                            </div>
                        </div>
                        <div className="relative h-2 bg-base-200 rounded-full w-full">
                            {/* Bar representing spent budget */}
                            <div className="absolute top-0 left-0 h-full bg-info rounded-full z-10" style={{ width: `${spentPercent}%` }}></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function ProgressDistributionChart({ distribution }: ProgressDistributionChartProps) {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

    if (total === 0) return <div className="text-center text-base-content/50 py-8">ไม่มีข้อมูลความก้าวหน้า</div>;

    const colors: Record<string, string> = {
        "0-25%": "bg-error",
        "26-50%": "bg-warning",
        "51-75%": "bg-info",
        "76-100%": "bg-success",
    };

    return (
        <div className="grid grid-cols-4 gap-2 h-40 items-end">
            {Object.entries(distribution).map(([range, count]) => {
                const height = total > 0 ? Math.max(10, Math.round((count / total) * 100)) : 0;
                return (
                    <div key={range} className="flex flex-col items-center gap-2">
                        <div className="relative w-full flex justify-center items-end h-full">
                            <div
                                className={`w-full max-w-[40px] ${colors[range]} rounded-t-lg transition-all duration-500`}
                                style={{ height: `${height}%` }}
                            >
                                <div className="text-center text-xs font-bold -mt-5 text-base-content/70">{count}</div>
                            </div>
                        </div>
                        <div className="text-xs text-center font-medium">{range}</div>
                    </div>
                );
            })}
        </div>
    );
}

export interface KPIChartProps {
    stats: {
        totalIndicators: number;
        achievedIndicators: number;
        avgAchievement: number;
    };
}

export function KPIChart({ stats }: KPIChartProps) {
    if (stats.totalIndicators === 0) return <div className="text-center text-base-content/50 py-8">ไม่มีข้อมูลตัวชี้วัด</div>;

    const achievedPercent = Math.round((stats.achievedIndicators / stats.totalIndicators) * 100);

    return (
        <div className="flex flex-col items-center justify-center py-4 space-y-6">
            {/* Circular Progress for Average Achievement */}
            <div className="relative">
                <div className="radial-progress text-primary" style={cssVars({ "--value": stats.avgAchievement, "--size": "8rem", "--thickness": "0.75rem" })} role="progressbar">
                    <span className="text-2xl font-bold">{stats.avgAchievement}%</span>
                </div>
                <div className="text-center text-sm font-medium mt-2">ความสำเร็จเฉลี่ย</div>
            </div>

            {/* Bar for Count */}
            <div className="w-full space-y-2">
                <div className="flex justify-between text-sm">
                    <span>ต้วชี้วัดที่บรรลุเป้า</span>
                    <span className="font-bold">{stats.achievedIndicators} / {stats.totalIndicators}</span>
                </div>
                <div className="w-full bg-base-200 rounded-full h-4 relative overflow-hidden">
                    <div
                        className="bg-success h-full rounded-full transition-all duration-500 flex items-center justify-end px-2"
                        style={{ width: `${achievedPercent}%` }}
                    >
                        {achievedPercent > 10 && <span className="text-[10px] text-white font-bold">{achievedPercent}%</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// New PMO Dashboard Components
// ----------------------------------------------------------------------

export interface StrategicChartProps {
    strategicCounts: Record<string, number>;
}

export function StrategicChart({ strategicCounts }: StrategicChartProps) {
    const entries = Object.entries(strategicCounts).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    if (total === 0) return <div className="text-center text-base-content/50 py-8">ไม่มีข้อมูลความสอดคล้องเชิงยุทธศาสตร์</div>;

    return (
        <div className="space-y-4">
            {entries.map(([issue, count]) => {
                const percentage = Math.round((count / total) * 100);
                return (
                    <div key={issue} className="space-y-1">
                        <div className="flex justify-between text-sm items-end">
                            <span className="font-medium truncate max-w-[70%] pr-2" title={issue}>{issue}</span>
                            <span className="text-xs opacity-70 whitespace-nowrap">{count} โครงการ ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-base-200 rounded-full h-3 relative overflow-hidden group">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-700 ease-out group-hover:brightness-110"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export interface DepartmentProgressChartProps {
    avgProgressByDepartment: Record<string, number>;
}

export function DepartmentProgressChart({ avgProgressByDepartment }: DepartmentProgressChartProps) {
    const entries = Object.entries(avgProgressByDepartment).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) return <div className="text-center text-base-content/50 py-8">ไม่มีข้อมูลความก้าวหน้าหน่วยงาน</div>;

    return (
        <div className="space-y-3">
            {entries.slice(0, 8).map(([dept, progress]) => {
                // Determine color based on progress (Performance Health)
                let colorClass = "bg-info";
                if (progress < 25) colorClass = "bg-error";
                else if (progress < 50) colorClass = "bg-warning";
                else if (progress >= 80) colorClass = "bg-success";

                return (
                    <div key={dept} className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="truncate max-w-[200px]" title={dept}>{dept}</span>
                            <span className="font-bold">{progress}%</span>
                        </div>
                        <div className="w-full bg-base-200 rounded-full h-2">
                            <div
                                className={`${colorClass} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                );
            })}
            {entries.length > 8 && (
                <div className="text-xs text-base-content/40 text-center pt-2">
                    และอีก {entries.length - 8} หน่วยงาน...
                </div>
            )}
        </div>
    );
}

export interface RiskSummaryCardProps {
    projectsWithIssuesCount: number;
    totalProjects: number;
}

export function RiskSummaryCard({ projectsWithIssuesCount, totalProjects }: RiskSummaryCardProps) {
    const riskPercent = totalProjects > 0 ? Math.round((projectsWithIssuesCount / totalProjects) * 100) : 0;

    // Status Logic
    let statusText = "ปกติ";
    let statusColor = "text-success";
    let alertClass = "alert-success";

    if (riskPercent > 20) {
        statusText = "วิกฤต";
        statusColor = "text-error";
        alertClass = "alert-error";
    } else if (riskPercent > 5) {
        statusText = "เฝ้าระวัง";
        statusColor = "text-warning";
        alertClass = "alert-warning";
    }

    return (
        <div className="text-center space-y-4">
            <div className="radial-progress text-error bg-base-200/50 border-4 border-base-100 shadow-inner" style={cssVars({ "--value": riskPercent, "--size": "8rem", "--thickness": "0.8rem" })}>
                <div className="flex flex-col items-center">
                    <span className="text-3xl font-extrabold">{projectsWithIssuesCount}</span>
                    <span className="text-xs opacity-70">โครงการ</span>
                </div>
            </div>
            <div>
                <p className="text-sm font-medium opacity-70">พบปัญหา/อุปสรรค</p>
                <div className={`mt-2 badge ${alertClass} badge-lg font-bold shadow-sm`}>
                    สถานะ: {statusText}
                </div>
            </div>
            <p className="text-xs opacity-50 px-4">
                คิดเป็น {riskPercent}% จากโครงการทั้งหมดในพอร์ตโฟลิโอ
            </p>
        </div>
    );
}
