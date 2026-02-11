"use client";

import { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudUpload, faSpinner, faCheckCircle, faTimesCircle, faFileZipper } from "@fortawesome/free-solid-svg-icons";
import { compressImage } from "@/lib/imageUtils";

interface FileUploadProps {
    projectId?: number;
    reportId?: number;
    onUploadSuccess?: (attachment: any) => void;
    onUploadError?: (error: string) => void;
}

export function FileUpload({ projectId, reportId, onUploadSuccess, onUploadError }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = async (files: FileList) => {
        const file = files[0]; // Only handle first file for now

        if (!file) return;

        setUploading(true);
        setUploadStatus(null);

        let finalFile = file;

        // Image compression if image > 1MB
        if (file.type.startsWith("image/") && file.size > 1024 * 1024) {
            setCompressing(true);
            try {
                finalFile = await compressImage(file, 1);
                console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)}MB, Compressed: ${(finalFile.size / 1024 / 1024).toFixed(2)}MB`);
            } catch (err) {
                console.error("Compression failed, using original file", err);
            } finally {
                setCompressing(false);
            }
        }

        try {
            const formData = new FormData();
            formData.append("file", finalFile);

            if (projectId) {
                formData.append("projectId", projectId.toString());
            }
            if (reportId) {
                formData.append("reportId", reportId.toString());
            }

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                setUploadStatus({
                    type: "success",
                    message: `อัปโหลด "${file.name}" สำเร็จ`,
                });
                onUploadSuccess?.(result.data.attachment);

                // Clear file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setUploadStatus(null);
                }, 3000);
            } else {
                setUploadStatus({
                    type: "error",
                    message: result.error || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์",
                });
                onUploadError?.(result.error);
            }
        } catch (error) {
            console.error("Upload error:", error);
            const errorMessage = "เกิดข้อผิดพลาดในการอัปโหลดไฟล์";
            setUploadStatus({
                type: "error",
                message: errorMessage,
            });
            onUploadError?.(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full">
            <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                    ? "border-primary bg-primary/5"
                    : uploading
                        ? "border-info bg-info/5"
                        : "border-base-300 hover:border-primary/50"
                    } ${uploading ? "cursor-wait" : "cursor-pointer"}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={uploading ? undefined : onButtonClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleChange}
                    disabled={uploading}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />

                <div className="flex flex-col items-center gap-4">
                    {uploading ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} className="h-12 w-12 text-info animate-spin" />
                            <div>
                                <p className="text-lg font-medium">{compressing ? "กำลังย่อขนาดภาพ..." : "กำลังอัปโหลด..."}</p>
                                <p className="text-sm opacity-70">กรุณารอสักครู่</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon
                                icon={faCloudUpload}
                                className={`h-12 w-12 ${dragActive ? "text-primary" : "opacity-50"}`}
                            />
                            <div>
                                <p className="text-lg font-medium">
                                    {dragActive ? "วางไฟล์ที่นี่" : "ลากไฟล์มาวางที่นี่"}
                                </p>
                                <p className="text-sm opacity-70">หรือคลิกเพื่อเลือกไฟล์</p>
                                <p className="text-xs opacity-50 mt-2">
                                    รองรับ: Images, PDF, Word, Excel (สูงสุด 10MB)
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {uploadStatus && (
                <div
                    className={`alert mt-4 ${uploadStatus.type === "success" ? "alert-success" : "alert-error"
                        }`}
                >
                    <FontAwesomeIcon
                        icon={uploadStatus.type === "success" ? faCheckCircle : faTimesCircle}
                        className="h-5 w-5"
                    />
                    <span>{uploadStatus.message}</span>
                </div>
            )}
        </div>
    );
}
