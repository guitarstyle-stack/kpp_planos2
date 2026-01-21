
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
    } catch (error) {
        console.error("Error sending LINE message:", error);
    }
}

export async function pushFlexMessage(userId: string, title: string, message: string, link: string | undefined | null, type: string | undefined | null = "INFO") {
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
        console.error("LINE_CHANNEL_ACCESS_TOKEN is missing");
        return;
    }

    const colorMap: Record<string, string> = {
        "INFO": "#3b82f6", // Blue
        "WARNING": "#eab308", // Yellow
        "SUCCESS": "#22c55e", // Green
        "ERROR": "#ef4444", // Red
    };

    const headerColor = colorMap[type || "INFO"] || "#3b82f6";

    // Safe truncation for Flex Message limits
    // Title: Max 100 chars (approx)
    // Body: Max 1000 chars (approx)
    const safeTitle = title.substring(0, 100);
    const safeMessage = message.substring(0, 200); // Truncate content for list view legibility

    const payload = {
        to: userId,
        messages: [{
            type: "flex",
            altText: `${safeTitle}: ${safeMessage}`,
            contents: {
                type: "bubble",
                header: {
                    type: "box",
                    layout: "vertical",
                    contents: [{
                        type: "text",
                        text: type || "INFO",
                        color: "#ffffff",
                        weight: "bold",
                        size: "xs",
                        align: "center"
                    }],
                    backgroundColor: headerColor,
                    paddingAll: "4px"
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "text",
                            text: safeTitle,
                            weight: "bold",
                            size: "sm",
                            wrap: true,
                            margin: "none"
                        },
                        {
                            type: "text",
                            text: safeMessage,
                            size: "xs",
                            color: "#666666",
                            wrap: true,
                            margin: "md"
                        }
                    ]
                },
                footer: link ? {
                    type: "box",
                    layout: "vertical",
                    contents: [{
                        type: "button",
                        style: "primary",
                        height: "sm",
                        action: {
                            type: "uri",
                            label: "ดูรายละเอียด",
                            uri: `${process.env.NEXT_PUBLIC_APP_URL || ""}${link}`
                        },
                        color: headerColor
                    }]
                } : undefined
            }
        }]
    };

    try {
        const response = await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("LINE Flex Push Error:", error);
        }
    } catch (error) {
        console.error("LINE Flex Push Exception:", error);
    }
}

// --- Quota APIs ---

export async function getLineQuota() {
    if (!LINE_CHANNEL_ACCESS_TOKEN) return null;
    try {
        const response = await fetch("https://api.line.me/v2/bot/message/quota", {
            method: "GET",
            headers: { "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
            next: { revalidate: 60 } // Cache for 60s
        });
        if (!response.ok) return null;
        return await response.json(); // { type: "limited" | "none", value?: number }
    } catch (error) {
        console.error("Failed to fetch LINE quota", error);
        return null;
    }
}

export async function getLineConsumption() {
    if (!LINE_CHANNEL_ACCESS_TOKEN) return null;
    try {
        const response = await fetch("https://api.line.me/v2/bot/message/quota/consumption", {
            method: "GET",
            headers: { "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
            next: { revalidate: 60 } // Cache for 60s
        });
        if (!response.ok) return null;
        return await response.json(); // { totalUsage: number }
    } catch (error) {
        console.error("Failed to fetch LINE consumption", error);
        return null;
    }
}
