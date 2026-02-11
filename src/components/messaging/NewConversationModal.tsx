"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { createPortal } from "react-dom";
import { createConversationAction } from "@/actions/conversationActions";
import { useRouter } from "next/navigation";
import { ConversationPriority } from "@/services/conversationService";
import { cn } from "@/lib/utils";

interface NewConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableUsers?: Array<{ id: number; name: string; department: { name: string; type?: { name: string } } }>;
}

export function NewConversationModal({
    isOpen,
    onClose,
    availableUsers = [],
}: NewConversationModalProps) {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [priority, setPriority] = useState<ConversationPriority>("NORMAL");
    const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    if (!isOpen || !mounted) return null;

    // Use createPortal to render the modal at the document body level
    // This prevents it from being clipped by overflow:hidden in parent containers
    return createPortal(
        <div className={cn("modal", isOpen && "modal-open", "z-[1000]")}>
            <div className="modal-box max-w-2xl lg:max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden shadow-2xl">
                {/* Header - Fixed */}
                <div className="px-6 py-4 border-b border-base-200 bg-base-100 flex-none">
                    <h3 className="font-bold text-xl">
                        สร้างการสนทนาใหม่
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Body - Scrollable */}
                    <div className="p-6 space-y-5 overflow-y-auto flex-1">
                        {error && (
                            <div className="alert alert-error mb-4">
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Title */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text font-medium text-base">
                                    หัวข้อการสนทนา <span className="text-error">*</span>
                                </span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="เช่น ต้องการความช่วยเหลือเรื่อง..."
                                className="input input-bordered w-full h-11"
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Content */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text font-medium text-base">
                                    ข้อความ <span className="text-error">*</span>
                                </span>
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="รายละเอียดการสนทนา..."
                                rows={4}
                                className="textarea textarea-bordered w-full resize-none leading-relaxed"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Priority */}
                            <div className="form-control w-full">
                                <label className="label py-1">
                                    <span className="label-text font-medium">ระดับความสำคัญ</span>
                                </label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as ConversationPriority)}
                                    className="select select-bordered w-full h-11"
                                    disabled={isSubmitting}
                                >
                                    <option value="LOW">ต่ำ</option>
                                    <option value="NORMAL">ปกติ</option>
                                    <option value="HIGH">สูง</option>
                                    <option value="URGENT">ด่วน</option>
                                </select>
                            </div>

                            {/* Unused space or additional field if needed in future */}
                            <div className="hidden md:block"></div>
                        </div>

                        {/* Participants (Admin selection) */}
                        {availableUsers.length > 0 && (
                            <div className="form-control w-full">
                                <label className="label py-1 flex justify-between items-center">
                                    <span className="label-text font-medium">
                                        เพิ่มผู้เข้าร่วม (ไม่บังคับ)
                                    </span>
                                    {selectedParticipants.length > 0 && (
                                        <span className="label-text-alt font-medium text-primary">
                                            เลือกแล้ว {selectedParticipants.length} คน
                                        </span>
                                    )}
                                </label>
                                <div className="border border-base-300 rounded-lg max-h-64 overflow-y-auto bg-base-50/50">
                                    {Object.entries(
                                        availableUsers.reduce((groups, user) => {
                                            const typeName = user.department?.type?.name || "อื่น ๆ";
                                            if (!groups[typeName]) groups[typeName] = [];
                                            groups[typeName].push(user);
                                            return groups;
                                        }, {} as Record<string, typeof availableUsers>)
                                    ).map(([groupName, users]) => {
                                        const isAllSelected = users.every((u) => selectedParticipants.includes(u.id));
                                        const isSomeSelected = users.some((u) => selectedParticipants.includes(u.id));

                                        const toggleGroup = () => {
                                            if (isAllSelected) {
                                                // Deselect all in group
                                                setSelectedParticipants((prev) =>
                                                    prev.filter((id) => !users.find((u) => u.id === id))
                                                );
                                            } else {
                                                // Select all in group
                                                const newIds = users.map((u) => u.id);
                                                setSelectedParticipants((prev) => [
                                                    ...Array.from(new Set([...prev, ...newIds])),
                                                ]);
                                            }
                                        };

                                        return (
                                            <div key={groupName} className="border-b border-base-200 last:border-0">
                                                {/* Group Header */}
                                                <div className="bg-base-200/50 px-4 py-2 flex items-center gap-3 sticky top-0 backdrop-blur-sm z-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllSelected}
                                                        ref={(el) => {
                                                            if (el) el.indeterminate = isSomeSelected && !isAllSelected;
                                                        }}
                                                        onChange={toggleGroup}
                                                        className="checkbox checkbox-xs checkbox-primary rounded-sm"
                                                    />
                                                    <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                                                        {groupName} ({users.length})
                                                    </span>
                                                </div>

                                                {/* Users in Group */}
                                                <div>
                                                    {users.map((user) => (
                                                        <label
                                                            key={user.id}
                                                            className="flex items-center gap-3 px-4 py-2 hover:bg-base-100 cursor-pointer pl-8 border-b border-base-100 last:border-0 transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedParticipants.includes(user.id)}
                                                                onChange={() => toggleParticipant(user.id)}
                                                                className="checkbox checkbox-primary checkbox-sm rounded"
                                                                disabled={isSubmitting}
                                                            />
                                                            <div className="w-8 h-8 flex items-center justify-center text-base-content/50">
                                                                <FontAwesomeIcon icon={faUserCircle} className="w-6 h-6" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-semibold truncate">
                                                                    {user.name}
                                                                </div>
                                                                <div className="text-xs opacity-70 truncate">
                                                                    {user.department.name}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions - Fixed */}
                    <div className="px-6 py-4 border-t border-base-200 bg-base-100 flex-none flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost px-6"
                            disabled={isSubmitting}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary px-8"
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
            <div className="modal-backdrop bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
        </div>,
        document.body
    );
}
