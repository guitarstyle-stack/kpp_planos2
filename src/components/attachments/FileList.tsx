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
            <div className="text-center py-12 text-base-content/40 bg-base-50/50 rounded-2xl border-2 border-dashed border-base-200">
                <p>ไม่มีไฟล์แนบในโครงการนี้</p>
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
        <div className="space-y-10">
            {/* Image Gallery */}
            {images.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                    <div className="flex items-center justify-between mb-4 border-b border-base-200 pb-3">
                        <h4 className="text-sm font-bold opacity-80 uppercase tracking-wider flex items-center gap-2 text-primary">
                            <FontAwesomeIcon icon={faImage} />
                            รูปภาพ ({images.length})
                        </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {images.map((att, index) => (
                            <div
                                key={att.id}
                                className="group relative aspect-square bg-base-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 border border-base-200"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={att.fileUrl}
                                    alt={att.fileName}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-zoom-in"
                                    onClick={() => window.open(att.fileUrl, '_blank')}
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3 pointer-events-none">
                                    <p className="text-white text-xs font-medium truncate translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                        {att.fileName}
                                    </p>
                                    <p className="text-white/70 text-[10px] translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                        {new Date(att.createdAt).toLocaleDateString('th-TH')}
                                    </p>
                                </div>

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1 z-10">
                                    <button
                                        onClick={() => window.open(att.fileUrl, '_blank')}
                                        className="btn btn-circle btn-xs btn-neutral bg-black/50 border-none text-white hover:bg-black/70 backdrop-blur-md"
                                        title="ดูรูปภาพ"
                                    >
                                        <FontAwesomeIcon icon={faSearch} className="h-3 w-3" />
                                    </button>

                                    {canDelete && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(att.id);
                                            }}
                                            className="btn btn-circle btn-xs btn-error text-white shadow-lg"
                                            title="ลบ"
                                            disabled={deletingId === att.id}
                                        >
                                            <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 ease-out">
                    <div className="flex items-center justify-between mb-4 border-b border-base-200 pb-3">
                        <h4 className="text-sm font-bold opacity-80 uppercase tracking-wider flex items-center gap-2 text-secondary">
                            <FontAwesomeIcon icon={faFileAlt} />
                            เอกสาร ({files.length})
                        </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {files.map((att, index) => (
                            <div
                                key={att.id}
                                className="flex items-center p-3 bg-base-100 border border-base-200 rounded-2xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group hover:-translate-y-0.5"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div
                                    className="flex items-center gap-4 overflow-hidden cursor-pointer flex-1"
                                    onClick={() => window.open(att.fileUrl, '_blank')}
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-base-50 border border-base-100 flex items-center justify-center text-2xl ${getIconColor(att.fileType)} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                        <FontAwesomeIcon icon={getFileIcon(att.fileType)} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold truncate text-sm text-base-content group-hover:text-primary transition-colors">
                                            {att.fileName}
                                        </div>
                                        <div className="text-[11px] text-base-content/50 flex flex-wrap gap-2 items-center mt-1">
                                            <span className="bg-base-200/50 px-2 py-0.5 rounded-full">
                                                {new Date(att.createdAt).toLocaleDateString('th-TH')}
                                            </span>
                                            {att.reportId && (
                                                <span className="text-info/80 flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-info"></span>
                                                    รายงาน #{att.reportId}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 pl-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={att.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-ghost btn-sm btn-circle text-base-content/40 hover:text-primary hover:bg-primary/10"
                                        title="ดาวน์โหลด"
                                    >
                                        <FontAwesomeIcon icon={faDownload} />
                                    </a>
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(att.id)}
                                            className="btn btn-ghost btn-sm btn-circle text-error/40 hover:text-error hover:bg-error/10"
                                            title="ลบ"
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
