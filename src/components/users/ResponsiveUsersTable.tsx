'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEnvelope,
    faBuilding,
    faUserTag,
    faCheckCircle,
    faTimesCircle,
    faUserFriends,
} from '@fortawesome/free-solid-svg-icons';

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

interface ResponsiveUsersTableProps {
    users: User[];
}

export function ResponsiveUsersTable({ users }: ResponsiveUsersTableProps) {
    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 opacity-50">
                <FontAwesomeIcon icon={faUserFriends} className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">ไม่พบข้อมูลผู้ใช้งาน</p>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block table-container">
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
                        {users.map((user) => (
                            <tr key={user.id} className="hover">
                                <td className="whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="avatar">
                                            {user.image ? (
                                                <div className="w-10 rounded-full">
                                                    <img src={user.image} alt={user.name} />
                                                </div>
                                            ) : (
                                                <div className="avatar placeholder">
                                                    <div className="bg-neutral text-neutral-content rounded-full w-10">
                                                        <span className="text-xl">{user.name.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            )}
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
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-4">
                {users.map((user) => (
                    <div key={user.id} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body p-4">
                            {/* Header with Avatar */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="avatar">
                                    {user.image ? (
                                        <div className="w-12 rounded-full">
                                            <img src={user.image} alt={user.name} />
                                        </div>
                                    ) : (
                                        <div className="avatar placeholder">
                                            <div className="bg-neutral text-neutral-content rounded-full w-12">
                                                <span className="text-xl">{user.name.charAt(0).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base truncate">{user.name}</h3>
                                    <p className="text-xs opacity-60 truncate flex items-center gap-1">
                                        <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3" />
                                        {user.email || "ไม่มีอีเมล"}
                                    </p>
                                </div>
                                {user.isActive ? (
                                    <span className="badge badge-success badge-sm shrink-0">
                                        <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                                    </span>
                                ) : (
                                    <span className="badge badge-error badge-sm shrink-0">
                                        <FontAwesomeIcon icon={faTimesCircle} className="w-3 h-3" />
                                    </span>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="space-y-2 mb-3">
                                <div>
                                    <div className="text-xs opacity-60 mb-1">หน่วยงาน</div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 opacity-50" />
                                        <span className="truncate">{user.department?.name || "ไม่ระบุสังกัด"}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs opacity-60 mb-1">สิทธิ์การใช้งาน</div>
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
                                            <span className="text-sm italic opacity-50">ไม่มีสิทธิ์</span>
                                        )}
                                    </div>
                                </div>
                                {user.lastLoginAt && (
                                    <div>
                                        <div className="text-xs opacity-60 mb-1">เข้าสู่ระบบล่าสุด</div>
                                        <div className="text-sm">
                                            {new Date(user.lastLoginAt).toLocaleDateString("th-TH", {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <Link
                                href={`/users/${user.id}/edit`}
                                className="btn btn-primary btn-sm w-full"
                            >
                                แก้ไขข้อมูล
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
