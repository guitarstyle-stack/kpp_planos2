"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
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

    async function handleDelete() {
        if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบ "${itemName}"?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = planId !== undefined
                ? await deleteAction(id, planId)
                : await deleteAction(id);

            console.log("Delete action result:", result);

            if (result?.message) {
                // Determine if it's a warning (dependency) or error (system)
                if (result.message.includes("ไม่สามารถลบได้")) {
                    toast.warning(result.message, { duration: 5000 });
                } else {
                    toast.error(result.message);
                }
            } else {
                toast.success("ลบข้อมูลสำเร็จ");
                router.refresh();
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                handleDelete();
            }}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 disabled:opacity-50"
            title="ลบ"
        >
            <FontAwesomeIcon icon={faTrash} />
        </button>
    );
}
