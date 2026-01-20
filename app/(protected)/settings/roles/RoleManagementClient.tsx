"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faTrash, faUserShield, faShieldAlt, faUsers } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { createRoleAction, updateRoleAction, deleteRoleAction, assignRoleAction, removeRoleAction } from "@/actions/roleActions";

interface Role {
    id: number;
    name: string;
    label: string | null;
}

interface User {
    id: number;
    name: string;
    email: string | null;
    department: { name: string } | null;
    roles: { role: Role }[];
}

interface RoleManagementClientProps {
    roles: Role[];
    users: User[];
}

export default function RoleManagementClient({ roles, users }: RoleManagementClientProps) {
    const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");
    const [isLoading, setIsLoading] = useState(false);

    // Search State
    const [searchTerm, setSearchTerm] = useState("");

    // Role Modal State
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    // User Assignment Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Filter Users
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.department?.name && user.department.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // --- Role CRUD ---
    const handleSaveRole = async (formData: FormData) => {
        setIsLoading(true);
        try {
            let res;
            if (editingRole) {
                res = await updateRoleAction(editingRole.id, formData);
            } else {
                res = await createRoleAction(formData);
            }

            if (res.success) {
                toast.success(editingRole ? "Updated role" : "Created role");
                setIsRoleModalOpen(false);
                setEditingRole(null);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRole = async (id: number) => {
        if (!confirm("Are you sure you want to delete this role? This cannot be undone.")) return;
        setIsLoading(true);
        try {
            const res = await deleteRoleAction(id);
            if (res.success) {
                toast.success("Role deleted");
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // --- User Assignment ---
    const handleToggleRole = async (user: User, roleId: number, hasRole: boolean) => {
        try {
            let res;
            if (hasRole) {
                res = await removeRoleAction(user.id, roleId);
            } else {
                res = await assignRoleAction(user.id, roleId);
            }

            if (res.success) {
                toast.success(hasRole ? "Role removed" : "Role assigned");
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Failed to change role");
        }
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div role="tablist" className="tabs tabs-boxed p-2 bg-base-200/50 rounded-box">
                <a
                    role="tab"
                    className={`tab tab-lg transition-all rounded-btn ${activeTab === "roles" ? "tab-active bg-primary text-primary-content shadow-sm" : "hover:bg-base-200"}`}
                    onClick={() => setActiveTab("roles")}
                >
                    <FontAwesomeIcon icon={faShieldAlt} className="mr-2" />
                    Manage Roles
                </a>
                <a
                    role="tab"
                    className={`tab tab-lg transition-all rounded-btn ${activeTab === "users" ? "tab-active bg-primary text-primary-content shadow-sm" : "hover:bg-base-200"}`}
                    onClick={() => setActiveTab("users")}
                >
                    <FontAwesomeIcon icon={faUsers} className="mr-2" />
                    User Assignments
                </a>
            </div>

            {/* Content */}
            {activeTab === "roles" && (
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-base-200">
                            <div>
                                <h2 className="card-title text-lg">Defined Roles</h2>
                                <p className="text-sm text-base-content/60">Define roles available in the system</p>
                            </div>
                            <button
                                className="btn btn-primary btn-sm gap-2"
                                onClick={() => { setEditingRole(null); setIsRoleModalOpen(true); }}
                            >
                                <FontAwesomeIcon icon={faPlus} /> Add Role
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="table table-zebra table-lg">
                                <thead className="bg-base-200/50">
                                    <tr>
                                        <th>Name (Key)</th>
                                        <th>Label (Display)</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roles.map(role => (
                                        <tr key={role.id} className="hover">
                                            <td className="font-mono text-sm font-bold opacity-70">{role.name}</td>
                                            <td className="font-medium">{role.label || "-"}</td>
                                            <td className="text-right space-x-2">
                                                <button
                                                    className="btn btn-ghost btn-xs"
                                                    onClick={() => { setEditingRole(role); setIsRoleModalOpen(true); }}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                                                    onClick={() => handleDeleteRole(role.id)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {roles.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="text-center text-base-content/50 py-8">No roles defined</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "users" && (
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-base-200 pb-4">
                            <div>
                                <h2 className="card-title text-lg">User Role Assignments</h2>
                                <p className="text-sm text-base-content/60">Assign roles to users</p>
                            </div>
                            <div className="form-control w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="input input-bordered w-full sm:w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="table table-zebra table-lg">
                                <thead className="bg-base-200/50">
                                    <tr>
                                        <th>User</th>
                                        <th>Department</th>
                                        <th>Roles</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover">
                                            <td>
                                                <div className="font-bold">{user.name}</div>
                                                <div className="text-xs text-base-content/50">{user.email}</div>
                                            </td>
                                            <td className="text-sm">{user.department?.name || "-"}</td>
                                            <td>
                                                <div className="flex flex-wrap gap-2">
                                                    {user.roles.map(ur => (
                                                        <span key={ur.role.id} className="badge badge-primary badge-outline badge-sm gap-1">
                                                            <FontAwesomeIcon icon={faShieldAlt} className="w-3 h-3" />
                                                            {ur.role.label || ur.role.name}
                                                        </span>
                                                    ))}
                                                    {user.roles.length === 0 && <span className="text-xs opacity-50 italic">No roles</span>}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    className="btn btn-sm btn-ghost hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => { setSelectedUser(user); setIsAssignModalOpen(true); }}
                                                >
                                                    <FontAwesomeIcon icon={faUserShield} /> Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-12 text-base-content/50">
                                                No users found matching "{searchTerm}"
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Modal */}
            {isRoleModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">{editingRole ? "Edit Role" : "Create Role"}</h3>
                        <form action={handleSaveRole}>
                            <div className="form-control mb-4">
                                <label className="label"><span className="label-text">Role Name (Key)</span></label>
                                <input
                                    name="name"
                                    className="input input-bordered"
                                    defaultValue={editingRole?.name}
                                    placeholder="e.g. ADMIN"
                                    required
                                />
                                <label className="label"><span className="label-text-alt text-warning">Must be unique and usually uppercase English</span></label>
                            </div>
                            <div className="form-control mb-6">
                                <label className="label"><span className="label-text">Label (Display Name)</span></label>
                                <input
                                    name="label"
                                    className="input input-bordered"
                                    defaultValue={editingRole?.label || ""}
                                    placeholder="e.g. ผู้ดูแลระบบ"
                                    required
                                />
                            </div>
                            <div className="modal-action">
                                <button type="button" className="btn" onClick={() => setIsRoleModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                    {isLoading && <span className="loading loading-spinner"></span>}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {isAssignModalOpen && selectedUser && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Manage Roles for {selectedUser.name}</h3>
                        <div className="space-y-2">
                            {roles.map(role => {
                                const hasRole = selectedUser.roles.some(ur => ur.role.id === role.id);
                                return (
                                    <div key={role.id} className="form-control">
                                        <label className="label cursor-pointer justify-start gap-4 border p-2 rounded hover:bg-base-100">
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-primary"
                                                checked={hasRole}
                                                onChange={() => handleToggleRole(selectedUser, role.id, hasRole)}
                                            />
                                            <span className="label-text font-medium">{role.label || role.name}</span>
                                            <span className="label-text text-base-content/50 text-xs">({role.name})</span>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="modal-action">
                            <button type="button" className="btn" onClick={() => setIsAssignModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
