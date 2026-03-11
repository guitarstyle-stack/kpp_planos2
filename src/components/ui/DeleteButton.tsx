"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faExclamationTriangle, faTimes, faCheck } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";

interface DeleteButtonProps {
    id: number;
    itemName: string;
    deleteAction: (id: number, ...args: any[]) => Promise<any>;
    planId?: number; // For Strategic Goals
}

export function DeleteButton({ id, itemName, deleteAction, planId }: DeleteButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const modalRef = useRef<HTMLDialogElement>(null);

    const openModal = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        modalRef.current?.showModal();
    };

    const closeModal = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();
        modalRef.current?.close();
    };

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        
        setIsDeleting(true);
        try {
            const result = planId !== undefined
                ? await deleteAction(id, planId)
                : await deleteAction(id);

            console.log("Delete action result:", result);

            if (result?.message) {
                if (result.message.includes("ไม่สามารถลบได้")) {
                    toast.warning(result.message, { duration: 5000 });
                } else {
                    toast.error(result.message);
                }
            } else {
                toast.success("ลบข้อมูลสำเร็จ");
                closeModal();
                router.refresh();
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                disabled={isDeleting}
                className="btn btn-ghost btn-xs text-error disabled:opacity-50"
                title="ลบ"
            >
                <FontAwesomeIcon icon={faTrash} />
            </button>

            <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle" onClick={(e) => e.stopPropagation()}>
                <div className="modal-box border border-error/20 shadow-2xl">
                    <div className="flex items-center gap-4 mb-4 text-error">
                        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-xl" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">ยืนยันการลบข้อมูล</h3>
                            <p className="text-sm opacity-70 mt-1">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                        </div>
                    </div>
                    
                    <div className="bg-base-200/50 p-4 rounded-xl mb-6 border border-base-300">
                        <p className="text-sm font-medium">คุณแน่ใจหรือไม่ที่จะลบรายการ:</p>
                        <p className="font-bold text-primary mt-1 break-words">"{itemName}"</p>
                    </div>

                    <div className="modal-action flex gap-2">
                        <button 
                            type="button" 
                            className="btn btn-ghost flex-1" 
                            onClick={closeModal}
                            disabled={isDeleting}
                        >
                            <FontAwesomeIcon icon={faTimes} /> ยกเลิก
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-error flex-1 text-white shadow-lg shadow-error/20" 
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                <FontAwesomeIcon icon={faCheck} />
                            )}
                            ยืนยันการลบ
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop" onClick={closeModal}>
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
}
