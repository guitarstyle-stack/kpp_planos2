"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTag, faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

interface UserRoleManagementProps {
    user: any;
    availableRoles: any[];
}

export function UserRoleManagement({ user, availableRoles }: UserRoleManagementProps) {
    const router = useRouter();
    const [selectedRoleId, setSelectedRoleId] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const userRoleIds = new Set(user.roles.map((ur: any) => ur.roleId));
    const unassignedRoles = availableRoles.filter(role => !userRoleIds.has(role.id));

    async function handleAssignRole() {
        if (!selectedRoleId) return;

        setIsAdding(true);
        try {
            const { assignRoleAction } = await import("@/actions/userActions");
            const result = await assignRoleAction(user.id, parseInt(selectedRoleId));

            if (result?.message) {
                toast.error(result.message);
            } else {
                toast.success("มอบหมายสิทธิ์สำเร็จ");
                setSelectedRoleId("");
                router.refresh();
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการมอบหมายสิทธิ์");
        } finally {
            setIsAdding(false);
        }
    }

    async function handleRemoveRole(roleId: number, roleName: string) {
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะถอดสิทธิ์ "${roleName}"?`)) {
            return;
        }

        try {
            const { removeRoleAction } = await import("@/actions/userActions");
            const result = await removeRoleAction(user.id, roleId);

            if (result?.message) {
                toast.error(result.message);
            } else {
                toast.success("ถอดสิทธิ์สำเร็จ");
                router.refresh();
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการถอดสิทธิ์");
        }
    }

    return (
        <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                จัดการสิทธิ์การใช้งาน
            </h2>

            {/* Current Roles */}
            <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                    สิทธิ์ปัจจุบัน
                </h3>
                {user.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {user.roles.map((userRole: any) => (
                            <div
                                key={userRole.id}
                                className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                                <FontAwesomeIcon icon={faUserTag} className="w-4 h-4" />
                                {userRole.role.label || userRole.role.name}
                                <button
                                    onClick={() => handleRemoveRole(userRole.roleId, userRole.role.label || userRole.role.name)}
                                    className="ml-1 text-blue-600 hover:text-red-600 dark:text-blue-400 dark:hover:text-red-400"
                                    title="ถอดสิทธิ์"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-zinc-500 italic">ยังไม่มีสิทธิ์ที่กำหนด</p>
                )}
            </div>

            {/* Add Role */}
            {unassignedRoles.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                        เพิ่มสิทธิ์
                    </h3>
                    <div className="flex gap-2">
                        <select
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            className="flex-1 rounded-lg border-zinc-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700"
                        >
                            <option value="">เลือกสิทธิ์...</option>
                            {unassignedRoles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.label || role.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleAssignRole}
                            disabled={!selectedRoleId || isAdding}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                            เพิ่ม
                        </button>
                    </div>
                </div>
            )}

            {unassignedRoles.length === 0 && user.roles.length > 0 && (
                <p className="text-sm text-zinc-500">ผู้ใช้ได้รับมอบหมายสิทธิ์ครบทุกประเภทแล้ว</p>
            )}
        </div>
    );
}
