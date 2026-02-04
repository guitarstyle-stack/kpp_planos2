"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStatusAction, deleteConversationAction, updateConversationAction } from "@/actions/conversationActions";
import { ConversationStatus, ConversationPriority } from "@/services/conversationService";

interface AdminConversationControlsProps {
    conversationId: number;
    currentStatus: ConversationStatus;
    currentTitle: string;
    currentPriority: ConversationPriority;
    onStatusChanged?: () => void;
}

export function AdminConversationControls({
    conversationId,
    currentStatus,
    currentTitle,
    currentPriority,
    onStatusChanged,
}: AdminConversationControlsProps) {
    const router = useRouter();
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTitle, setEditTitle] = useState(currentTitle);
    const [editPriority, setEditPriority] = useState(currentPriority);
    const [isUpdating, setIsUpdating] = useState(false);

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleStatusChange = async (newStatus: ConversationStatus) => {
        if (newStatus === currentStatus) return;

        setIsChangingStatus(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await updateStatusAction(conversationId, newStatus);

            if (result.success) {
                setSuccess("เปลี่ยนสถานะสำเร็จ");
                onStatusChanged?.();

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(result.error || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
            }
        } catch (err) {
            setError("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
        } finally {
            setIsChangingStatus(false);
        }
    };

    const handleUpdate = async () => {
        setIsUpdating(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await updateConversationAction(conversationId, {
                title: editTitle,
                priority: editPriority,
            });

            if (result.success) {
                setSuccess("แก้ไขการสนทนาสำเร็จ");
                setShowEditModal(false);
                onStatusChanged?.();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(result.error || "เกิดข้อผิดพลาดในการแก้ไข");
            }
        } catch (err) {
            setError("เกิดข้อผิดพลาดในการแก้ไข");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const result = await deleteConversationAction(conversationId);

            if (result.success) {
                router.push("/conversations");
            } else {
                setError(result.error || "เกิดข้อผิดพลาดในการลบ");
                setShowDeleteConfirm(false);
            }
        } catch (err) {
            setError("เกิดข้อผิดพลาดในการลบ");
            setShowDeleteConfirm(false);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🛠️</span>
                            <h3 className="font-semibold">
                                เครื่องมือผู้ดูแลระบบ
                            </h3>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="btn btn-sm btn-ghost"
                            >
                                ✏️ แก้ไข
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="btn btn-sm btn-error btn-outline"
                            >
                                🗑️ ลบ
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-error mb-3">
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success mb-3">
                            <span>{success}</span>
                        </div>
                    )}

                    <div>
                        <label className="label">
                            <span className="label-text font-medium">เปลี่ยนสถานะการสนทนา</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as ConversationStatus[]).map(
                                (status) => {
                                    const labels: Record<ConversationStatus, string> = {
                                        OPEN: "เปิด",
                                        IN_PROGRESS: "กำลังดำเนินการ",
                                        RESOLVED: "แก้ไขแล้ว",
                                        CLOSED: "ปิด",
                                    };

                                    const colors: Record<ConversationStatus, string> = {
                                        OPEN: "btn-info",
                                        IN_PROGRESS: "btn-warning",
                                        RESOLVED: "btn-success",
                                        CLOSED: "btn-neutral",
                                    };

                                    const isCurrentStatus = status === currentStatus;

                                    return (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(status)}
                                            disabled={isCurrentStatus || isChangingStatus}
                                            className={`btn btn-sm ${isCurrentStatus ? "btn-disabled" : colors[status]}`}
                                        >
                                            {labels[status]}
                                            {isCurrentStatus && " ✓"}
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">แก้ไขการสนทนา</h3>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">หัวข้อการสนทนา</span>
                            </label>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="input input-bordered"
                            />
                        </div>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">ระดับความสำคัญ</span>
                            </label>
                            <select
                                value={editPriority}
                                onChange={(e) => setEditPriority(e.target.value as ConversationPriority)}
                                className="select select-bordered"
                            >
                                <option value="LOW">ต่ำ</option>
                                <option value="NORMAL">ปกติ</option>
                                <option value="HIGH">สูง</option>
                                <option value="URGENT">ด่วน</option>
                            </select>
                        </div>

                        <div className="modal-action">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="btn btn-ghost"
                                disabled={isUpdating}
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="btn btn-primary"
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    "บันทึก"
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowEditModal(false)}></div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">ยืนยันการลบการสนทนา</h3>
                        <p className="mb-4">
                            คุณแน่ใจหรือไม่ที่จะลบการสนทนานี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                        </p>

                        <div className="modal-action">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="btn btn-ghost"
                                disabled={isDeleting}
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleDelete}
                                className="btn btn-error"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        กำลังลบ...
                                    </>
                                ) : (
                                    "ลบการสนทนา"
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowDeleteConfirm(false)}></div>
                </div>
            )}
        </>
    );
}

