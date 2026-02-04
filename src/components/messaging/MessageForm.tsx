"use client";

import { useState } from "react";
import { sendMessageAction } from "@/actions/conversationActions";

interface MessageFormProps {
    conversationId: number;
    onMessageSent?: () => void;
}

export function MessageForm({ conversationId, onMessageSent }: MessageFormProps) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            setError("กรุณากรอกข้อความ");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await sendMessageAction({
                conversationId,
                content: content.trim(),
            });

            if (result.success) {
                setContent("");
                onMessageSent?.();
            } else {
                setError(result.error || "เกิดข้อผิดพลาดในการส่งข้อความ");
            }
        } catch (err) {
            setError("เกิดข้อผิดพลาดในการส่งข้อความ");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Submit on Ctrl+Enter or Cmd+Enter
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-base-100 border-t border-base-300 p-4">
            {error && (
                <div className="alert alert-error mb-3">
                    <span>{error}</span>
                </div>
            )}

            <div className="flex gap-3">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="พิมพ์ข้อความ... (กด Ctrl+Enter เพื่อส่ง)"
                    className="textarea textarea-bordered flex-1 min-h-[80px] max-h-[200px]"
                    disabled={isSubmitting}
                />

                <button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className="btn btn-primary self-end"
                >
                    {isSubmitting ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            กำลังส่ง...
                        </>
                    ) : (
                        "ส่ง"
                    )}
                </button>
            </div>

            {content.length > 0 && (
                <div className="mt-2 text-xs opacity-60 text-right">
                    {content.length} ตัวอักษร
                </div>
            )}
        </form>
    );
}
