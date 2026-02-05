"use client";

import { useState } from "react";
import { NewConversationModal } from "./NewConversationModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMessage } from "@fortawesome/free-solid-svg-icons";

interface AdminConversationListActionsProps {
    availableUsers: Array<{ id: number; name: string; department: { name: string } }>;
}

export function AdminConversationListActions({ availableUsers }: AdminConversationListActionsProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary btn-sm gap-2"
            >
                <FontAwesomeIcon icon={faPlus} />
                สร้างการสนทนาใหม่
            </button>

            <NewConversationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                availableUsers={availableUsers}
            />
        </>
    );
}
