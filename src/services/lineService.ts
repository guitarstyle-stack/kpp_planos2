
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

export async function pushMessage(lineUserId: string, message: string) {
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
        console.error("LINE_CHANNEL_ACCESS_TOKEN is not configured.");
        return;
    }

    try {
        const response = await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                to: lineUserId,
                messages: [
                    {
                        type: "text",
                        text: message,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Failed to send LINE message:", errorData);
            throw new Error(`LINE API responded with ${response.status}: ${JSON.stringify(errorData)}`);
        }

        // console.log("LINE message sent successfully");
    } catch (error) {
        console.error("Error sending LINE message:", error);
    }
}
