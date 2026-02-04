"use client";

import { useState } from "react";
import { NewConversationModal } from "@/components/messaging/NewConversationModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

export function ConversationsPageClient() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary gap-2 shadow-lg shadow-primary/20"
            >
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                สร้างการสนทนาใหม่
            </button>
            <NewConversationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
