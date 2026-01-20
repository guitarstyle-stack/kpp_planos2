"use client";

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
