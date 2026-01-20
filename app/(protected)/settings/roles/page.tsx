import { getRoles } from "@/services/userRoleService";
import { getUsers } from "@/services/userService";
import RoleManagementClient from "./RoleManagementClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faShieldAlt } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

export default async function RolesPage() {
    const [roles, users] = await Promise.all([
        getRoles(),
        getUsers(),
    ]);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/settings" className="btn btn-circle btn-ghost btn-sm">
                    <FontAwesomeIcon icon={faArrowLeft} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FontAwesomeIcon icon={faShieldAlt} className="text-primary" />
                        Role Management
                    </h1>
                    <p className="text-sm text-base-content/60">Manage user roles and permissions</p>
                </div>
            </div>

            <RoleManagementClient roles={roles} users={users} />
        </div>
    );
}
