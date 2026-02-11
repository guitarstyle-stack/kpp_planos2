
import { getConversations } from "../src/services/conversationService";
import db from "../src/lib/db";

async function main() {
    try {
        console.log("Fetching a user...");
        const user = await db.user.findFirst();

        if (!user) {
            console.error("No user found in database");
            return;
        }

        console.log(`Testing with User ID: ${user.id} (${user.name})`);

        console.log("Fetching conversations...");
        const result = await getConversations(user.id);

        console.log("Success!");
        console.log("Total:", result.total);
        console.log("Conversations:", result.conversations.length);
        console.log("Unread:", result.unreadCount);

    } catch (error) {
        console.error("Error executing getConversations:", error);
    } finally {
        await db.$disconnect();
    }
}

main();
