import { getCurrentUser } from "@/lib/auth";
import { getDepartments, getDepartmentTypes } from "@/services/departmentService";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIdCard } from "@fortawesome/free-solid-svg-icons";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const user = await getCurrentUser();
    if (!user) redirect("/");

    const [departments, departmentTypes] = await Promise.all([
        getDepartments(),
        getDepartmentTypes()
    ]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-focus bg-clip-text text-transparent flex items-center gap-3">
                    <FontAwesomeIcon icon={faIdCard} className="text-primary h-8 w-8" />
                    โปรไฟล์ของฉัน
                </h1>
                <p className="text-sm opacity-70 mt-2">
                    จัดการข้อมูลส่วนตัวและหน่วยงานสังกัด
                </p>
            </div>

            <ProfileForm
                key={user.updatedAt.toISOString()}
                user={user}
                departments={departments}
                departmentTypes={departmentTypes}
            />
        </div>
    );
}
