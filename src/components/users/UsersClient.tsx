"use client";

import { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { ResponsiveUsersTable } from "./ResponsiveUsersTable";

interface User {
    id: number;
    name: string;
    email: string | null;
    image: string | null;
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
                        {departments.map((dept: any) => (
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
                        {roles.map((role: any) => (
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
                <div className="p-0 md:p-4">
                    <ResponsiveUsersTable users={filteredUsers} />
                </div>
            </div>
        </div>
    );
}
