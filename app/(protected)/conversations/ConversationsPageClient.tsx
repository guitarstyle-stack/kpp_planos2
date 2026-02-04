"use client";

import { useState } from "react";
import { NewConversationModal } from "@/components/messaging/NewConversationModal";

export function ConversationsPageClient() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
                + สร้างการสนทนาใหม่
            </button>
            <NewConversationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
