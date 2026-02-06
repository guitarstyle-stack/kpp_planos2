"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { NewConversationModal } from "./NewConversationModal";

interface ConversationsPageHeaderProps {
    adminUsers: Array<{ id: number; name: string; department: { name: string } }>;
}

export function ConversationsPageHeader({ adminUsers }: ConversationsPageHeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
            <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
                    <FontAwesomeIcon icon={faEnvelope} className="h-6 w-6 shrink-0" />
                    <span className="truncate">กล่องข้อความ</span>
                </h1>
                <p className="text-sm opacity-70">
                    สนทนาและสอบถามข้อมูลกับผู้ดูแลระบบ
                </p>
            </div>
            <div className="flex shrink-0">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary w-full sm:w-auto gap-2 shadow-lg shadow-primary/20"
                >
                    <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                    สร้างการสนทนาใหม่
                </button>
            </div>

            <NewConversationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                availableUsers={adminUsers}
            />
        </div>
    );
}
