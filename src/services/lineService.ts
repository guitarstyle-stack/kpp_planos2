
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

export async function pushFlexMessage(lineUserId: string, title: string, message: string, link: string = "", type: "INFO" | "WARNING" | "SUCCESS" | "ERROR" = "INFO") {
    if (!LINE_CHANNEL_ACCESS_TOKEN) return;

    const colors = {
        INFO: "#3b82f6", // Blue
        WARNING: "#eab308", // Yellow
        SUCCESS: "#22c55e", // Green
        ERROR: "#ef4444", // Red
    };

    const headerColor = colors[type] || colors.INFO;

    const flexBubble = {
        type: "bubble",
        header: {
            type: "box",
            layout: "vertical",
            contents: [
                {
                    type: "text",
                    text: type,
                    weight: "bold",
                    color: "#ffffff",
                    size: "xs",
                    align: "center",
                    textClassName: "Badge"
                }
            ],
            backgroundColor: headerColor,
            paddingTop: "6px",
            paddingBottom: "6px",
            cornerRadius: "lg"
        },
        body: {
            type: "box",
            layout: "vertical",
            contents: [
                {
                    type: "text",
                    text: title,
                    weight: "bold",
                    size: "md",
                    wrap: true
                },
                {
                    type: "text",
                    text: message,
                    size: "sm",
                    color: "#555555",
                    wrap: true,
                    margin: "md"
                }
            ]
        },
        footer: link ? {
            type: "box",
            layout: "vertical",
            contents: [
                {
                    type: "button",
                    action: {
                        type: "uri",
                        label: "ดูรายละเอียด",
                        uri: `${process.env.NEXT_PUBLIC_APP_URL || ""}${link}`
                    },
                    style: "primary",
                    color: headerColor
                }
            ]
        } : undefined
    };

    try {
        await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                to: lineUserId,
                messages: [
                    {
                        type: "flex",
                        altText: `${title}: ${message}`,
                        contents: flexBubble
                    }
                ],
            }),
        });
    } catch (error) {
        console.error("Error sending LINE Flex message:", error);
    }
}
