"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faFileAlt,
    faImage,
    faTrash,
    faDownload,
    faFilePdf,
    faFileWord,
    faFileExcel,
    faSearch
} from "@fortawesome/free-solid-svg-icons";
import { deleteAttachmentAction } from "@/actions/attachmentActions";
import { toast } from "sonner";
import { useState } from "react";

interface FileAttachment {
    id: number;
    fileName: string;
    fileUrl: string;
    fileType: string;
    createdAt: Date;
    reportId?: number | null;
}

interface FileListProps {
    attachments: any[]; // relaxed type for now to match what's passed
    onDelete: () => void;
    onRefresh: () => void;
    canDelete?: boolean;
}

export function FileList({ attachments, onDelete, onRefresh, canDelete = false }: FileListProps) {
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Initial Empty State
    if (!attachments || attachments.length === 0) {
        return (
            <div className="text-center py-8 text-base-content/50 bg-base-50 rounded-lg border border-base-200">
                ไม่มีไฟล์แนบ
            </div>
        );
    }

    const handleDelete = async (id: number) => {
        if (!confirm("คุณต้องการลบไฟล์นี้ใช่หรือไม่?")) return;

        setDeletingId(id);
        try {
            const result = await deleteAttachmentAction(id);
            if (result.success) {
                toast.success("ลบไฟล์เรียบร้อยแล้ว");
                onDelete();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("เกิดข้อผิดพลาดในการลบไฟล์");
        } finally {
            setDeletingId(null);
        }
    };

    const getFileIcon = (fileType: string) => {
        if (!fileType) return faFileAlt;
        if (fileType.includes("pdf")) return faFilePdf;
        if (fileType.includes("word") || fileType.includes("document")) return faFileWord;
        if (fileType.includes("excel") || fileType.includes("sheet")) return faFileExcel;
        if (fileType.startsWith("image/")) return faImage;
        return faFileAlt;
    };

    const getIconColor = (fileType: string) => {
        if (!fileType) return "text-gray-500";
        if (fileType.includes("pdf")) return "text-red-500";
        if (fileType.includes("word") || fileType.includes("document")) return "text-blue-500";
        if (fileType.includes("excel") || fileType.includes("sheet")) return "text-green-500";
        if (fileType.startsWith("image/")) return "text-purple-500";
        return "text-gray-500";
    };

    // Helper safely check string
    const isImage = (type: string) => type && type.startsWith("image/");

    // Filter attachments
    const images = attachments.filter(att => isImage(att.fileType));
    const files = attachments.filter(att => !isImage(att.fileType));

    return (
        <div className="space-y-8">
            {/* Image Gallery */}
            {images.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h4 className="text-sm font-bold opacity-70 mb-3 flex items-center gap-2 border-b pb-2">
                        <FontAwesomeIcon icon={faImage} className="text-primary" />
                        รูปภาพแนบ ({images.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {images.map((att) => (
                            <div key={att.id} className="group relative aspect-square bg-base-200 rounded-xl overflow-hidden border border-base-300 shadow-sm hover:shadow-md transition-all">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={att.fileUrl}
                                    alt={att.fileName}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-zoom-in"
                                    onClick={() => window.open(att.fileUrl, '_blank')}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <span className="text-white text-xs font-medium border border-white/50 px-3 py-1 rounded-full backdrop-blur-sm">
                                        <FontAwesomeIcon icon={faSearch} className="mr-1" />
                                        ดูรูปใหญ่
                                    </span>
                                </div>

                                {canDelete && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(att.id);
                                        }}
                                        className="absolute top-2 right-2 btn btn-circle btn-xs btn-error text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 scale-90 hover:scale-100 shadow-md"
                                        title="ลบ"
                                        disabled={deletingId === att.id}
                                    >
                                        <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                                    </button>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 pt-6">
                                    <div className="text-white text-[10px] truncate font-medium">
                                        {att.fileName}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    <h4 className="text-sm font-bold opacity-70 mb-3 flex items-center gap-2 border-b pb-2">
                        <FontAwesomeIcon icon={faFileAlt} className="text-secondary" />
                        เอกสารแนบ ({files.length})
                    </h4>
                    <div className="flex flex-col gap-2">
                        {files.map((att) => (
                            <div key={att.id} className="flex items-center justify-between p-3 bg-base-100 border border-base-200 rounded-xl hover:border-primary/50 hover:bg-base-50 hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-4 overflow-hidden cursor-pointer flex-1" onClick={() => window.open(att.fileUrl, '_blank')}>
                                    <div className={`w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center text-2xl ${getIconColor(att.fileType)} shadow-inner group-hover:scale-105 transition-transform`}>
                                        <FontAwesomeIcon icon={getFileIcon(att.fileType)} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium truncate text-sm group-hover:text-primary transition-colors">{att.fileName}</div>
                                        <div className="text-[11px] opacity-50 flex gap-2 items-center mt-0.5">
                                            <span className="bg-base-200 px-1.5 py-0.5 rounded text-[10px]">
                                                {new Date(att.createdAt).toLocaleDateString('th-TH')}
                                            </span>
                                            {att.reportId && <span className="text-info/80">• จากรายงาน #{att.reportId}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 pl-2">
                                    <a
                                        href={att.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-primary tooltip tooltip-left"
                                        data-tip="ดาวน์โหลด"
                                    >
                                        <FontAwesomeIcon icon={faDownload} />
                                    </a>
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(att.id)}
                                            className="btn btn-ghost btn-sm btn-circle text-error/50 hover:text-error hover:bg-error/10 tooltip tooltip-left"
                                            data-tip="ลบ"
                                            disabled={deletingId === att.id}
                                        >
                                            {deletingId === att.id ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : (
                                                <FontAwesomeIcon icon={faTrash} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
