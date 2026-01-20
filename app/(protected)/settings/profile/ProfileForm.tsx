"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { User, Department, DepartmentType } from "@prisma/client";
import { updateProfileAction, createDepartmentAction } from "@/actions/userActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faBuilding, faUser, faPlus, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import Image from "next/image";

interface ProfileFormProps {
    user: User & { department: Department };
    departments: Department[];
    departmentTypes: DepartmentType[];
}

export default function ProfileForm({ user, departments: initialDepartments, departmentTypes }: ProfileFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [departments, setDepartments] = useState(initialDepartments);
    const [selectedDeptId, setSelectedDeptId] = useState<number>(user.departmentId);

    // New Department State
    const [isCreatingDept, setIsCreatingDept] = useState(false);
    const [newDeptName, setNewDeptName] = useState("");
    const [newDeptTypeId, setNewDeptTypeId] = useState<number | "">("");

    async function handleProfileUpdate(formData: FormData) {
        startTransition(async () => {
            formData.set("departmentId", selectedDeptId.toString());

            const result = await updateProfileAction(user.id, formData);
            if (result.success) {
                toast.success("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว");
                router.refresh();
            } else {
                toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            }
        });
    }

    async function handleCreateDepartment() {
        if (!newDeptName) return toast.error("กรุณาระบุชื่อหน่วยงาน");

        const formData = new FormData();
        formData.append("name", newDeptName);
        if (newDeptTypeId) formData.append("typeId", newDeptTypeId.toString());

        startTransition(async () => {
            const result = await createDepartmentAction(formData);
            if (result.success && result.department) {
                toast.success("สร้างหน่วยงานใหม่เรียบร้อยแล้ว");
                setDepartments(prev => [...prev, result.department as Department]);
                setSelectedDeptId(result.department.id);
                setIsCreatingDept(false);
                setNewDeptName("");
                setNewDeptTypeId("");
                router.refresh();
            } else {
                toast.error(result.message || "เกิดข้อผิดพลาดในการสร้างหน่วยงาน");
            }
        });
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Form */}
            <div className="lg:col-span-2 space-y-6">
                <form action={handleProfileUpdate} className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body">
                        <h2 className="card-title text-lg border-b pb-2 mb-4">
                            <FontAwesomeIcon icon={faUser} className="mr-2 text-primary" />
                            ข้อมูลส่วนตัว
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">ชื่อที่ใช้แสดง (Display Name) <span className="text-error">*</span></span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    defaultValue={user.name}
                                    className="input input-bordered w-full"
                                    required
                                />
                                <label className="label">
                                    <span className="label-text-alt text-base-content/60">ชื่อที่จะแสดงในระบบ</span>
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">อีเมล</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    defaultValue={user.email || ""}
                                    className="input input-bordered w-full"
                                    placeholder="example@domain.com"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">ชื่อจริง</span>
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    defaultValue={user.firstName || ""}
                                    className="input input-bordered w-full"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">นามสกุล</span>
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    defaultValue={user.lastName || ""}
                                    className="input input-bordered w-full"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">เบอร์โทรศัพท์</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    defaultValue={user.phoneNumber || ""}
                                    className="input input-bordered w-full"
                                    placeholder="0xxxxxxxxx"
                                />
                            </div>
                        </div>

                        {/* Department Selection */}
                        <div className="divider my-6">ข้อมูลหน่วยงาน</div>

                        <div className="bg-base-50 p-4 rounded-lg border border-base-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <FontAwesomeIcon icon={faBuilding} className="text-secondary" />
                                    สังกัดหน่วยงาน
                                </h3>
                                {!isCreatingDept ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingDept(true)}
                                        className="btn btn-xs btn-outline btn-primary"
                                    >
                                        <FontAwesomeIcon icon={faPlus} /> สร้างใหม่
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingDept(false)}
                                        className="btn btn-xs btn-ghost"
                                    >
                                        ยกเลิก
                                    </button>
                                )}
                            </div>

                            {!isCreatingDept ? (
                                <div className="form-control w-full">
                                    <select
                                        className="select select-bordered w-full"
                                        value={selectedDeptId}
                                        onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                                    >
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name} ({dept.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="form-control">
                                        <label className="label pb-0">
                                            <span className="label-text">ชื่อหน่วยงานใหม่</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered w-full"
                                            placeholder="ระบุชื่อหน่วยงาน..."
                                            value={newDeptName}
                                            onChange={(e) => setNewDeptName(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label pb-0">
                                            <span className="label-text">ประเภทหน่วยงาน</span>
                                        </label>
                                        <select
                                            className="select select-bordered w-full"
                                            value={newDeptTypeId}
                                            onChange={(e) => setNewDeptTypeId(Number(e.target.value))}
                                        >
                                            <option value="">-- เลือกประเภท --</option>
                                            {departmentTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            onClick={handleCreateDepartment}
                                            disabled={isPending || !newDeptName}
                                        >
                                            {isPending ? <FontAwesomeIcon icon={faSpinner} spin /> : "ยืนยันสร้างหน่วยงาน"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="card-actions justify-end mt-6 pt-4 border-t border-base-200">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isPending || isCreatingDept}
                            >
                                {isPending ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faSave} />
                                        บันทึกการเปลี่ยนแปลง
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Right Column: Profile Card */}
            <div className="lg:col-span-1">
                <div className="card bg-base-100 shadow-sm border border-base-200 sticky top-8">
                    <div className="card-body items-center text-center">
                        <div className="avatar mb-4">
                            <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 relative">
                                {user.image ? (
                                    <Image
                                        src={user.image}
                                        alt={user.name}
                                        width={128}
                                        height={128}
                                        className="object-cover"
                                        unoptimized // Handle external LINE URLs
                                    />
                                ) : (
                                    <div className="bg-neutral text-neutral-content w-full h-full flex items-center justify-center text-3xl font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                )}
                                <div className="absolute bottom-0 right-0 bg-base-100 rounded-full p-1 shadow">
                                    {/* LINE Icon indicator */}
                                    <div className="w-6 h-6 bg-[#00B900] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        L
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h2 className="card-title">{user.name}</h2>
                        <p className="text-sm opacity-70 mb-4">{user.department.name}</p>

                        <div className="w-full text-left bg-base-50 p-4 rounded-lg text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="opacity-60">LINE ID:</span>
                                <span className="font-mono text-xs truncate max-w-[150px]" title={user.lineUserId}>{user.lineUserId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-60">เข้าสู่ระบบล่าสุด:</span>
                                <span>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("th-TH") : "-"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
