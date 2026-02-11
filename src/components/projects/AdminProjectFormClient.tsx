"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectForm } from "./ProjectForm";

interface User {
    id: number;
    name: string;
    departmentId: number;
    department: {
        id: number;
        name: string;
    };
}

interface MasterData {
    departments: any[];
    annualPlans: any[];
    users: User[];
}

interface AdminProjectFormClientProps {
    masterData: MasterData;
    userId: number;
}

export function AdminProjectFormClient({ masterData, userId }: AdminProjectFormClientProps) {
    const router = useRouter();
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
    const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);

    // กรองผู้ใช้ตามหน่วยงานที่เลือก
    const filteredUsers = useMemo(() => {
        if (!selectedDepartmentId) return [];
        return masterData.users.filter(user => user.departmentId === selectedDepartmentId);
    }, [selectedDepartmentId, masterData.users]);

    return (
        <div className="space-y-6">
            {/* ส่วนเลือกหน่วยงานและผู้รับผิดชอบ */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
                    <h3 className="card-title text-base">ข้อมูลผู้รับผิดชอบ</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* เลือกหน่วยงาน */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    หน่วยงาน <span className="text-error">*</span>
                                </span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={selectedDepartmentId || ""}
                                onChange={(e) => {
                                    const deptId = e.target.value ? Number(e.target.value) : null;
                                    setSelectedDepartmentId(deptId);
                                    setSelectedOwnerId(null); // รีเซ็ตผู้รับผิดชอบเมื่อเปลี่ยนหน่วยงาน
                                }}
                            >
                                <option value="">เลือกหน่วยงาน</option>
                                {masterData.departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* เลือกผู้รับผิดชอบ */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    ผู้รับผิดชอบโครงการ <span className="text-error">*</span>
                                </span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={selectedOwnerId || ""}
                                onChange={(e) => setSelectedOwnerId(e.target.value ? Number(e.target.value) : null)}
                                disabled={!selectedDepartmentId}
                            >
                                <option value="">
                                    {selectedDepartmentId ? "เลือกผู้รับผิดชอบ" : "กรุณาเลือกหน่วยงานก่อน"}
                                </option>
                                {filteredUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                            {selectedDepartmentId && filteredUsers.length === 0 && (
                                <span className="text-warning text-xs mt-1">
                                    ไม่มีผู้ใช้ในหน่วยงานนี้
                                </span>
                            )}
                        </div>
                    </div>

                    {selectedOwnerId && (
                        <div className="alert alert-info mt-4">
                            <span className="text-sm">
                                ผู้รับผิดชอบ: <strong>{filteredUsers.find(u => u.id === selectedOwnerId)?.name}</strong>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ProjectForm Component */}
            {selectedDepartmentId && selectedOwnerId ? (
                <ProjectForm
                    masterData={{
                        departments: masterData.departments.filter(d => d.id === selectedDepartmentId),
                        annualPlans: masterData.annualPlans,
                    }}
                    userId={userId}
                    adminOwnerId={selectedOwnerId}
                />
            ) : (
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body">
                        <div className="text-center py-12 opacity-50">
                            <p>กรุณาเลือกหน่วยงานและผู้รับผิดชอบก่อนกรอกข้อมูลโครงการ</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
