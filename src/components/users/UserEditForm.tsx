"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

interface UserEditFormProps {
    user: any;
    departments: any[];
}

export function UserEditForm({ user, departments }: UserEditFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const isLineUser = !!user.lineUserId;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);

        try {
            const { updateUserAction } = await import("@/actions/userActions");
            const result = await updateUserAction(user.id, formData);

            if (result?.message) {
                toast.error(result.message);
            } else if (result?.success) {
                toast.success("อัปเดตข้อมูลผู้ใช้สำเร็จ");
                router.push("/users");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setIsLoading(false);
        }
    }

    return (

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body p-6">
                    <h2 className="card-title text-lg border-b border-base-200 pb-4 mb-6">
                        ข้อมูลผู้ใช้งาน
                    </h2>

                    <div className="grid gap-6">
                        <div className="form-control">
                            <label className="label" htmlFor="name">
                                <span className="label-text">
                                    ชื่อ-นามสกุล {isLineUser && <span className="text-base-content/50">(จาก LINE)</span>}
                                </span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                defaultValue={user.name}
                                readOnly={isLineUser}
                                className={`input input-bordered w-full ${isLineUser ? 'input-disabled' : ''}`}
                            />
                            {isLineUser && (
                                <label className="label">
                                    <span className="label-text-alt text-base-content/50">ชื่อผู้ใช้ LINE ไม่สามารถแก้ไขได้</span>
                                </label>
                            )}
                        </div>

                        <div className="form-control">
                            <label className="label" htmlFor="email">
                                <span className="label-text">อีเมล</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                defaultValue={user.email || ""}
                                placeholder="user@example.com"
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label" htmlFor="departmentId">
                                <span className="label-text">หน่วยงาน</span>
                            </label>
                            <select
                                name="departmentId"
                                id="departmentId"
                                defaultValue={user.department?.id}
                                className="select select-bordered w-full"
                            >
                                <option value="">ไม่ระบุสังกัด</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Status Toggle moved inside the card body or separate section */}
                    <div className="flex items-center justify-between border-t border-base-200 pt-4 mt-4">
                        <span className="label-text font-medium">สถานะการใช้งาน</span>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm ${user.isActive ? 'text-success' : 'text-base-content/50'}`}>
                                {user.isActive ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'}
                            </span>
                            <input
                                type="checkbox"
                                className="toggle toggle-success"
                                checked={user.isActive}
                                onChange={async () => {
                                    const { toggleUserStatusAction } = await import("@/actions/userActions");
                                    await toggleUserStatusAction(user.id, user.isActive);
                                    toast.success(user.isActive ? "ระงับการใช้งานผู้ใช้แล้ว" : "เปิดใช้งานผู้ใช้แล้ว");
                                    router.refresh();
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="btn btn-ghost gap-2"
                >
                    <FontAwesomeIcon icon={faTimes} />
                    ยกเลิก
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary gap-2"
                >
                    {isLoading ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            กำลังบันทึก...
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faSave} />
                            บันทึกข้อมูล
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
