"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "./FileUpload";
import { FileList } from "./FileList";
import { getProjectAttachmentsAction } from "@/actions/attachmentActions";

interface AttachmentManagerProps {
    projectId: number;
    reportId?: number;
    canUpload?: boolean;
    canDelete?: boolean;
}

export function AttachmentManager({ projectId, reportId, canUpload = true, canDelete = false }: AttachmentManagerProps) {
    const [attachments, setAttachments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAttachments = async () => {
        setLoading(true);
        try {
            const result = await getProjectAttachmentsAction(projectId);
            if (result.success && result.data) {
                // Filter by reportId if provided
                const filtered = reportId
                    ? result.data.filter((att: any) => att.reportId === reportId)
                    : result.data;
                setAttachments(filtered);
            }
        } catch (error) {
            console.error("Failed to fetch attachments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttachments();
    }, [projectId, reportId]);

    const handleUploadSuccess = () => {
        fetchAttachments();
    };

    const handleDelete = () => {
        fetchAttachments();
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {canUpload && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">อัปโหลดไฟล์แนบ</h3>
                    <FileUpload
                        projectId={projectId}
                        reportId={reportId}
                        onUploadSuccess={handleUploadSuccess}
                    />
                </div>
            )}

            <div>
                <h3 className="text-lg font-semibold mb-4">
                    ไฟล์แนบ ({attachments.length})
                </h3>
                <FileList
                    attachments={attachments}
                    onDelete={handleDelete}
                    onRefresh={fetchAttachments}
                    canDelete={canDelete}
                />
            </div>
        </div>
    );
}
