"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faFile,
    faFilePdf,
    faFileWord,
    faFileExcel,
    faImage,
    faDownload,
    faTrash,
    faEye,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";

interface FileAttachment {
    id: number;
    fileName: string;
    fileUrl: string;
    fileType: string | null;
    uploadedAt: Date;
    uploadedBy: {
        id: number;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
    };
}

interface FileListProps {
    attachments: FileAttachment[];
    onDelete?: (id: number) => void;
    onRefresh?: () => void;
    canDelete?: boolean;
}

export function FileList({ attachments, onDelete, onRefresh, canDelete = false }: FileListProps) {
    const [deleting, setDeleting] = useState<number | null>(null);
    const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

    const getFileIcon = (fileType: string | null) => {
        if (!fileType) return faFile;

        if (fileType.startsWith("image/")) return faImage;
        if (fileType === "application/pdf") return faFilePdf;
        if (fileType.includes("word")) return faFileWord;
        if (fileType.includes("excel") || fileType.includes("spreadsheet")) return faFileExcel;

        return faFile;
    };

    const getFileIconColor = (fileType: string | null) => {
        if (!fileType) return "text-base-content/50";

        if (fileType.startsWith("image/")) return "text-info";
        if (fileType === "application/pdf") return "text-error";
        if (fileType.includes("word")) return "text-primary";
        if (fileType.includes("excel")) return "text-success";

        return "text-base-content/50";
    };

    const handleDownload = async (attachment: FileAttachment) => {
        try {
            const response = await fetch(`/api/attachments/${attachment.id}`);
            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = attachment.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download error:", error);
            alert("เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้?")) return;

        setDeleting(id);
        try {
            const response = await fetch(`/api/attachments/${id}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (result.success) {
                onDelete?.(id);
                onRefresh?.();
            } else {
                alert(result.error || "เกิดข้อผิดพลาดในการลบไฟล์");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("เกิดข้อผิดพลาดในการลบไฟล์");
        } finally {
            setDeleting(null);
        }
    };

    const handlePreview = (attachment: FileAttachment) => {
        const fileType = attachment.fileType || "";
        // Only allow preview for images and PDFs
        if (fileType.startsWith("image/") || fileType === "application/pdf") {
            setPreviewFile(attachment);
        } else {
            handleDownload(attachment);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getUserName = (user: FileAttachment["uploadedBy"]) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user.email || "ไม่ทราบชื่อ";
    };

    if (attachments.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-base-300 rounded-lg">
                <FontAwesomeIcon icon={faFile} className="h-12 w-12 opacity-30 mb-4" />
                <p className="opacity-60">ยังไม่มีไฟล์แนบ</p>
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    <thead>
                        <tr>
                            <th className="w-12"></th>
                            <th>ชื่อไฟล์</th>
                            <th>อัปโหลดโดย</th>
                            <th>วันที่</th>
                            <th className="text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attachments.map((attachment) => (
                            <tr key={attachment.id}>
                                <td>
                                    <FontAwesomeIcon
                                        icon={getFileIcon(attachment.fileType)}
                                        className={`h-6 w-6 ${getFileIconColor(attachment.fileType)}`}
                                    />
                                </td>
                                <td>
                                    <button
                                        onClick={() => handlePreview(attachment)}
                                        className="font-medium hover:underline text-left"
                                    >
                                        {attachment.fileName}
                                    </button>
                                </td>
                                <td>{getUserName(attachment.uploadedBy)}</td>
                                <td className="text-sm opacity-70">{formatDate(attachment.uploadedAt)}</td>
                                <td className="text-right">
                                    <div className="flex gap-2 justify-end">
                                        {(attachment.fileType?.startsWith("image/") ||
                                            attachment.fileType === "application/pdf") && (
                                                <button
                                                    onClick={() => handlePreview(attachment)}
                                                    className="btn btn-sm btn-ghost btn-square"
                                                    title="ดูตัวอย่าง"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                            )}
                                        <button
                                            onClick={() => handleDownload(attachment)}
                                            className="btn btn-sm btn-ghost btn-square"
                                            title="ดาวน์โหลด"
                                        >
                                            <FontAwesomeIcon icon={faDownload} />
                                        </button>
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(attachment.id)}
                                                className="btn btn-sm btn-ghost btn-square text-error"
                                                title="ลบ"
                                                disabled={deleting === attachment.id}
                                            >
                                                {deleting === attachment.id ? (
                                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                ) : (
                                                    <FontAwesomeIcon icon={faTrash} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Preview Modal */}
            {previewFile && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-4xl">
                        <h3 className="font-bold text-lg mb-4">{previewFile.fileName}</h3>

                        <div className="mb-4">
                            {previewFile.fileType?.startsWith("image/") ? (
                                <img
                                    src={`/api/attachments/${previewFile.id}`}
                                    alt={previewFile.fileName}
                                    className="w-full rounded-lg"
                                />
                            ) : previewFile.fileType === "application/pdf" ? (
                                <iframe
                                    src={`/api/attachments/${previewFile.id}`}
                                    className="w-full h-[600px] rounded-lg"
                                    title={previewFile.fileName}
                                />
                            ) : null}
                        </div>

                        <div className="modal-action">
                            <button onClick={() => handleDownload(previewFile)} className="btn btn-primary">
                                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                ดาวน์โหลด
                            </button>
                            <button onClick={() => setPreviewFile(null)} className="btn">
                                ปิด
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setPreviewFile(null)} />
                </div>
            )}
        </>
    );
}
