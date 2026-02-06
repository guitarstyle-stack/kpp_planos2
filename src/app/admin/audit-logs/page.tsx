import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuditLogTable from "@/components/admin/AuditLogTable";
import { FaShieldAlt } from "react-icons/fa";

export const metadata = {
    title: "System Audit Logs | PlanOS",
    description: "System administration and security logs",
};

export default async function AuditLogsPage() {
    const user = await getCurrentUser();

    if (!user || !user.roles.some((r) => r.role.name === "SYSADMIN")) {
        redirect("/");
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-base-200 pb-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    <FaShieldAlt className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">System Audit Logs</h1>
                    <p className="text-sm text-base-content/60">
                        Monitor system activities, changes, and access logs.
                    </p>
                </div>
            </div>

            <AuditLogTable />
        </div>
    );
}
