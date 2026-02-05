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
    faSearch,
    faChevronLeft,
    faChevronRight,
    faTimes
} from "@fortawesome/free-solid-svg-icons";
import { deleteAttachmentAction } from "@/actions/attachmentActions";
import { toast } from "sonner";
import { useState, useEffect } from "react";

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
    // State for Image Gallery Modal
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

    // Keyboard navigation for gallery
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedImageIndex === null) return;
            if (e.key === "Escape") setSelectedImageIndex(null);
            if (e.key === "ArrowLeft") navigateGallery(-1);
            if (e.key === "ArrowRight") navigateGallery(1);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedImageIndex]);

    const navigateGallery = (direction: number) => {
        if (selectedImageIndex === null) return;
        const newIndex = selectedImageIndex + direction;
        if (newIndex >= 0 && newIndex < images.length) {
            setSelectedImageIndex(newIndex);
        }
    };

    // Helper to get valid URL
    const getAttachmentUrl = (att: any) => {
        // If it's already a full URL, use it (legacy or ext links)
        if (att.fileUrl && (att.fileUrl.startsWith('http://') || att.fileUrl.startsWith('https://'))) {
            return att.fileUrl;
        }
        // Otherwise use our API proxy
        return `/api/attachments/${att.id}`;
    };
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

                    {/* Adjusted Grid: Larger images (2 cols mobile, 3 tablet, 4 desktop) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {images.map((att, index) => (
                            <div
                                key={att.id}
                                className="group relative aspect-[4/3] bg-base-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 border border-base-200 cursor-pointer"
                                style={{ animationDelay: `${index * 50}ms` }}
                                onClick={() => setSelectedImageIndex(index)}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={getAttachmentUrl(att)}
                                    alt={att.fileName}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                                    <p className="text-white text-sm font-medium truncate translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                        {att.fileName}
                                    </p>
                                </div>

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1 z-10">
                                    {canDelete && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Stop opening modal
                                                handleDelete(att.id);
                                            }}
                                            className="btn btn-circle btn-sm btn-error text-white shadow-lg"
                                            title="ลบ"
                                            disabled={deletingId === att.id}
                                        >
                                            <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* File List - Vertical Layout */}
            {files.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 ease-out">
                    <div className="flex items-center justify-between mb-4 border-b border-base-200 pb-3">
                        <h4 className="text-sm font-bold opacity-80 uppercase tracking-wider flex items-center gap-2 text-secondary">
                            <FontAwesomeIcon icon={faFileAlt} />
                            เอกสาร ({files.length})
                        </h4>
                    </div>

                    <div className="flex flex-col space-y-3">
                        {files.map((att, index) => (
                            <div
                                key={att.id}
                                className="flex items-center p-3 bg-base-100 border border-base-200 rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div
                                    className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                                    onClick={() => window.open(getAttachmentUrl(att), '_blank')}
                                >
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-lg bg-base-50 border border-base-100 flex items-center justify-center text-xl flex-shrink-0 ${getIconColor(att.fileType)} shadow-sm`}>
                                        <FontAwesomeIcon icon={getFileIcon(att.fileType)} />
                                    </div>

                                    {/* Name & Details (Single Line preference, but allow wrapping on tiny screens) */}
                                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                        <div className="font-semibold truncate text-sm text-base-content group-hover:text-primary transition-colors">
                                            {att.fileName}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs opacity-50 shrink-0">
                                            <span>{new Date(att.createdAt).toLocaleDateString('th-TH')}</span>
                                            {att.reportId && (
                                                <span className="hidden sm:inline-flex items-center gap-1 text-info/80">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-info"></span>
                                                    รายงาน #{att.reportId}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 pl-2 border-l border-base-200 ml-2">
                                    <a
                                        href={getAttachmentUrl(att)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-primary hover:bg-primary/10"
                                        title="ดาวน์โหลด"
                                    >
                                        <FontAwesomeIcon icon={faDownload} />
                                    </a>
                                    {canDelete && (
                                        <button
                                            onClick={() => handleDelete(att.id)}
                                            className="btn btn-ghost btn-sm btn-square text-error/40 hover:text-error hover:bg-error/10"
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

            {/* Lightbox Modal */}
            {selectedImageIndex !== null && images[selectedImageIndex] && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
                    {/* Close Button */}
                    <button
                        onClick={() => setSelectedImageIndex(null)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 z-50"
                    >
                        <FontAwesomeIcon icon={faTimes} className="h-8 w-8" />
                    </button>

                    {/* Navigation Buttons for Desktop */}
                    {selectedImageIndex > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigateGallery(-1); }}
                            className="absolute left-4 p-4 text-white/50 hover:text-white transition-colors z-50 hidden md:block"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} className="h-10 w-10" />
                        </button>
                    )}

                    {/* Navigation Buttons for Desktop */}
                    {selectedImageIndex < images.length - 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigateGallery(1); }}
                            className="absolute right-4 p-4 text-white/50 hover:text-white transition-colors z-50 hidden md:block"
                        >
                            <FontAwesomeIcon icon={faChevronRight} className="h-10 w-10" />
                        </button>
                    )}

                    {/* Image Container */}
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-4" onClick={() => setSelectedImageIndex(null)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={getAttachmentUrl(images[selectedImageIndex])}
                            alt={images[selectedImageIndex].fileName}
                            className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                        />

                        {/* Caption / Counter */}
                        <div className="absolute bottom-6 text-white text-center" onClick={(e) => e.stopPropagation()}>
                            <p className="font-medium text-lg">{images[selectedImageIndex].fileName}</p>
                            <p className="text-white/50 text-sm mt-1">
                                {selectedImageIndex + 1} / {images.length}
                            </p>
                        </div>

                        {/* Mobile Navigation (Bottom Overlay) */}
                        <div className="absolute inset-x-0 bottom-20 flex justify-between px-8 md:hidden pointer-events-none">
                            <div className="pointer-events-auto">
                                {selectedImageIndex > 0 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigateGallery(-1); }}
                                        className="p-3 bg-black/50 rounded-full text-white backdrop-blur-md"
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} className="h-6 w-6" />
                                    </button>
                                )}
                            </div>
                            <div className="pointer-events-auto">
                                {selectedImageIndex < images.length - 1 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigateGallery(1); }}
                                        className="p-3 bg-black/50 rounded-full text-white backdrop-blur-md"
                                    >
                                        <FontAwesomeIcon icon={faChevronRight} className="h-6 w-6" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
