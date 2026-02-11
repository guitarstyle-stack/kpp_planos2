'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderOpen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { deleteProjectAction } from '@/actions/projectActions';
import { toast } from 'sonner';
import { useState } from 'react';

const STATUS_MAP: Record<string, { label: string, color: string }> = {
    "NOT_STARTED": { label: "ยังไม่เริ่ม", color: "badge-ghost" },
    "IN_PROGRESS": { label: "กำลังดำเนินการ", color: "badge-info" },
    "COMPLETED": { label: "เสร็จสิ้น", color: "badge-success" },
    "CANCELLED": { label: "ยกเลิก", color: "badge-error" },
};

interface Project {
    id: number;
    code: string;
    name: string;
    status: string;
    progressPercent?: number;
    budgetTotal?: number | null;
    developmentGoal?: { name: string } | null;
    department?: { name: string } | null;
}

interface ResponsiveProjectsListProps {
    projects: Project[];
}

const formatMoney = (amount: number) =>
    amount.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function ResponsiveProjectsList({ projects }: ResponsiveProjectsListProps) {
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 opacity-50">
                <FontAwesomeIcon icon={faFolderOpen} className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">ยังไม่มีโครงการ</p>
                <p className="text-sm">เริ่มต้นด้วยการสร้างโครงการใหม่</p>
            </div>
        );
    }

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`คุณต้องการลบโครงการ "${name}" หรือไม่?\nการดำเนินการนี้จะลบข้อมูลที่เกี่ยวข้องทั้งหมดคืนไม่ได้`)) return;

        setIsDeleting(id);
        const result = await deleteProjectAction(id);
        setIsDeleting(null);

        if (result.success) {
            toast.success('ลบโครงการเรียบร้อยแล้ว');
        } else {
            toast.error(result.message || 'เกิดข้อผิดพลาดในการลบโครงการ');
        }
    };

    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block table-container">
                <table className="table table-zebra w-full">
                    <thead>
                        <tr className="bg-base-200/50">
                            <th>รหัสโครงการ</th>
                            <th>ชื่อโครงการ</th>
                            <th className="text-center">สถานะ</th>
                            <th className="text-center">ความคืบหน้า</th>
                            <th>เป้าประสงค์</th>
                            <th>หน่วยงาน</th>
                            <th>งบประมาณ</th>
                            <th className="text-right">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => (
                            <tr key={project.id} className="hover">
                                <td className="font-mono text-xs opacity-70">
                                    {project.code}
                                </td>
                                <td>
                                    <div className="font-bold text-sm line-clamp-2 max-w-sm" title={project.name}>
                                        {project.name}
                                    </div>
                                </td>
                                <td className="text-center whitespace-nowrap">
                                    <span className={`badge ${STATUS_MAP[project.status]?.color || 'badge-ghost'} badge-sm`}>
                                        {STATUS_MAP[project.status]?.label || project.status}
                                    </span>
                                </td>
                                <td className="text-center">
                                    <div className="flex items-center gap-2 justify-center">
                                        <progress
                                            className="progress progress-primary w-20"
                                            value={project.progressPercent || 0}
                                            max="100"
                                        />
                                        <span className="text-xs font-medium">{project.progressPercent || 0}%</span>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap max-w-[200px]">
                                    <div className="truncate text-xs opacity-70" title={project.developmentGoal?.name || ""}>
                                        {project.developmentGoal?.name || "-"}
                                    </div>
                                </td>
                                <td className="whitespace-nowrap text-sm">
                                    {project.department?.name || "-"}
                                </td>
                                <td className="whitespace-nowrap text-xs font-mono">
                                    {project.budgetTotal ? formatMoney(project.budgetTotal) : "-"}
                                </td>
                                <td className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="btn btn-ghost btn-xs text-primary"
                                        >
                                            ดูรายละเอียด
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(project.id, project.name)}
                                            className="btn btn-ghost btn-xs text-error"
                                            disabled={isDeleting === project.id}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-4">
                {projects.map((project) => (
                    <div key={project.id} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body p-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base line-clamp-2 mb-1">
                                        {project.name}
                                    </h3>
                                    <p className="text-xs font-mono opacity-60">
                                        {project.code}
                                    </p>
                                </div>
                                <span className={`badge ${STATUS_MAP[project.status]?.color || 'badge-ghost'} badge-sm shrink-0`}>
                                    {STATUS_MAP[project.status]?.label || project.status}
                                </span>
                            </div>

                            {/* Progress */}
                            <div className="space-y-1 mb-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="opacity-60">ความคืบหน้า</span>
                                    <span className="font-bold">{project.progressPercent || 0}%</span>
                                </div>
                                <progress
                                    className="progress progress-primary w-full h-2"
                                    value={project.progressPercent || 0}
                                    max="100"
                                />
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                <div>
                                    <div className="text-xs opacity-60 mb-1">หน่วยงาน</div>
                                    <div className="font-medium truncate">
                                        {project.department?.name || "-"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs opacity-60 mb-1">งบประมาณ</div>
                                    <div className="font-mono font-medium text-xs">
                                        {project.budgetTotal ? formatMoney(project.budgetTotal) : "-"}
                                    </div>
                                </div>
                            </div>

                            {project.developmentGoal?.name && (
                                <div className="text-xs opacity-70 mb-3 line-clamp-2">
                                    <span className="font-medium">เป้าประสงค์:</span> {project.developmentGoal.name}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Link
                                    href={`/projects/${project.id}`}
                                    className="btn btn-primary btn-sm flex-1"
                                >
                                    ดูรายละเอียด
                                </Link>
                                <button
                                    onClick={() => handleDelete(project.id, project.name)}
                                    className="btn btn-error btn-outline btn-sm"
                                    disabled={isDeleting === project.id}
                                    title="ลบโครงการ"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
