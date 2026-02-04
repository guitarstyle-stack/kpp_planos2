"use client";

import { useState } from "react";
import { createConversationAction } from "@/actions/conversationActions";
import { useRouter } from "next/navigation";
import { ConversationPriority } from "@/services/conversationService";

interface NewConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    adminUsers?: Array<{ id: number; name: string; department: { name: string } }>;
}

export function NewConversationModal({
    isOpen,
    onClose,
    adminUsers = [],
}: NewConversationModalProps) {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [priority, setPriority] = useState<ConversationPriority>("NORMAL");
    const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            setError("กรุณากรอกหัวข้อและข้อความ");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await createConversationAction({
                title: title.trim(),
                content: content.trim(),
                priority,
                participantIds: selectedParticipants,
            });

            if (result.success) {
                // Reset form
                setTitle("");
                setContent("");
                setPriority("NORMAL");
                setSelectedParticipants([]);
                onClose();

                // Navigate to the new conversation
                router.push(`/conversations/${result.data.id}`);
                router.refresh();
            } else {
                setError(result.error || "เกิดข้อผิดพลาดในการสร้างการสนทนา");
            }
        } catch (err) {
            setError("เกิดข้อผิดพลาดในการสร้างการสนทนา");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleParticipant = (userId: number) => {
        setSelectedParticipants((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-lg mb-4">
                    สร้างการสนทนาใหม่
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="alert alert-error">
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Title */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">
                                หัวข้อการสนทนา <span className="text-error">*</span>
                            </span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="เช่น ต้องการความช่วยเหลือเรื่อง..."
                            className="input input-bordered w-full"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Content */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">
                                ข้อความ <span className="text-error">*</span>
                            </span>
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="รายละเอียดการสนทนา..."
                            rows={5}
                            className="textarea textarea-bordered w-full"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Priority */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">ระดับความสำคัญ</span>
                        </label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as ConversationPriority)}
                            className="select select-bordered w-full"
                            disabled={isSubmitting}
                        >
                            <option value="LOW">ต่ำ</option>
                            <option value="NORMAL">ปกติ</option>
                            <option value="HIGH">สูง</option>
                            <option value="URGENT">ด่วน</option>
                        </select>
                    </div>

                    {/* Participants (Admin selection) */}
                    {adminUsers.length > 0 && (
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    เพิ่มผู้ดูแลระบบเข้าร่วม (ไม่บังคับ)
                                </span>
                            </label>
                            <div className="border border-base-300 rounded-lg max-h-40 overflow-y-auto">
                                {adminUsers.map((user) => (
                                    <label
                                        key={user.id}
                                        className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedParticipants.includes(user.id)}
                                            onChange={() => toggleParticipant(user.id)}
                                            className="checkbox checkbox-primary checkbox-sm"
                                            disabled={isSubmitting}
                                        />
                                        <div>
                                            <div className="text-sm font-medium">
                                                {user.name}
                                            </div>
                                            <div className="text-xs opacity-60">
                                                {user.department.name}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {selectedParticipants.length > 0 && (
                                <label className="label">
                                    <span className="label-text-alt opacity-70">
                                        เลือกแล้ว {selectedParticipants.length} คน
                                    </span>
                                </label>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="modal-action">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost"
                            disabled={isSubmitting}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting || !title.trim() || !content.trim()}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    กำลังสร้าง...
                                </>
                            ) : (
                                "สร้างการสนทนา"
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}
