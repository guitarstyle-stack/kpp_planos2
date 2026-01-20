"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEnvelope,
    faBuilding,
    faUserTag,
    faCheckCircle,
    faTimesCircle,
    faSearch,
    faFilter,
} from "@fortawesome/free-solid-svg-icons";

interface User {
    id: number;
    name: string;
    email: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    department: { id: number; name: string } | null;
    roles: Array<{ role: { id: number; name: string; label: string | null } }>;
}

interface Department {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    label: string | null;
}

interface UsersClientProps {
    users: User[];
    departments: Department[];
    roles: Role[];
}

export function UsersClient({ users, departments, roles }: UsersClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesName = user.name.toLowerCase().includes(query);
                const matchesEmail = user.email?.toLowerCase().includes(query);
                if (!matchesName && !matchesEmail) return false;
            }

            // Department filter
            if (departmentFilter && user.department?.id !== parseInt(departmentFilter)) {
                return false;
            }

            // Role filter
            if (roleFilter) {
                const hasRole = user.roles.some((ur) => ur.role.id === parseInt(roleFilter));
                if (!hasRole) return false;
            }

            // Status filter
            if (statusFilter === "active" && !user.isActive) return false;
            if (statusFilter === "inactive" && user.isActive) return false;

            return true;
        });
    }, [users, searchQuery, departmentFilter, roleFilter, statusFilter]);

    return (
        <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="card bg-base-100 shadow-sm border border-base-300 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="form-control flex-1">
                        <div className="input-group">
                            <span className="bg-base-200">
                                <FontAwesomeIcon icon={faSearch} className="h-4 w-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อหรืออีเมล..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input input-bordered flex-1"
                            />
                        </div>
                    </div>

                    {/* Department Filter */}
                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="select select-bordered"
                    >
                        <option value="">ทุกหน่วยงาน</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>

                    {/* Role Filter */}
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="select select-bordered"
                    >
                        <option value="">ทุกสิทธิ์</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.label || role.name}
                            </option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="select select-bordered"
                    >
                        <option value="">ทุกสถานะ</option>
                        <option value="active">ใช้งานปกติ</option>
                        <option value="inactive">ระงับการใช้งาน</option>
                    </select>
                </div>

                {/* Results count */}
                <div className="text-sm opacity-70 mt-2">
                    พบ {filteredUsers.length} จาก {users.length} คน
                </div>
            </div>

            {/* Users Table */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>ชื่อ-นามสกุล</th>
                                <th>หน่วยงาน</th>
                                <th>สิทธิ์</th>
                                <th>สถานะ</th>
                                <th>เข้าสู่ระบบล่าสุด</th>
                                <th><span className="sr-only">จัดการ</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover">
                                    <td className="whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="avatar placeholder">
                                                <div className="bg-neutral text-neutral-content rounded-full w-10">
                                                    <span className="text-xl">{user.name.charAt(0).toUpperCase()}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-bold">{user.name}</div>
                                                <div className="text-xs opacity-50 flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3" />
                                                    {user.email || "ไม่มีอีเมล"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 opacity-50" />
                                            <span>{user.department?.name || "ไม่ระบุสังกัด"}</span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap">
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.length > 0 ? (
                                                user.roles.map(({ role }) => (
                                                    <span
                                                        key={role.id}
                                                        className="badge badge-info badge-sm"
                                                    >
                                                        <FontAwesomeIcon icon={faUserTag} className="mr-1 w-3 h-3" />
                                                        {role.label || role.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="italic opacity-50">ไม่มีสิทธิ์</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap">
                                        {user.isActive ? (
                                            <span className="badge badge-success badge-sm gap-1">
                                                <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                                                ใช้งานปกติ
                                            </span>
                                        ) : (
                                            <span className="badge badge-error badge-sm gap-1">
                                                <FontAwesomeIcon icon={faTimesCircle} className="w-3 h-3" />
                                                ระงับการใช้งาน
                                            </span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap opacity-70">
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("th-TH") : "-"}
                                    </td>
                                    <td className="whitespace-nowrap text-right">
                                        <Link href={`/users/${user.id}/edit`} className="btn btn-link btn-xs no-underline hover:text-primary">
                                            แก้ไข
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 opacity-50">
                                        ไม่พบข้อมูลผู้ใช้งาน
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
