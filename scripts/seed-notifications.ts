// Script to create test notifications
import db from "../src/lib/db";

async function createTestNotifications() {
    // Get first user
    const user = await db.user.findFirst();
    if (!user) {
        console.log("No user found in database");
        return;
    }

    console.log(`Creating notifications for user: ${user.name} (ID: ${user.id})`);

    const notifications = [
        {
            userId: user.id,
            title: "ยินดีต้อนรับ!",
            message: "คุณได้เข้าสู่ระบบ PlanOS เรียบร้อยแล้ว",
            type: "SUCCESS",
        },
        {
            userId: user.id,
            title: "โครงการใหม่",
            message: "มีโครงการใหม่รอการอนุมัติ กรุณาตรวจสอบ",
            type: "INFO",
            link: "/projects",
        },
        {
            userId: user.id,
            title: "แจ้งเตือนงบประมาณ",
            message: "โครงการ A ใช้งบประมาณเกิน 80% แล้ว",
            type: "WARNING",
            link: "/projects",
        },
        {
            userId: user.id,
            title: "ต้องอัปเดตรายงาน",
            message: "มี 3 โครงการที่ต้องอัปเดตความคืบหน้า",
            type: "ERROR",
        },
    ];

    for (const notif of notifications) {
        await db.notification.create({ data: notif });
        console.log(`Created: ${notif.title}`);
    }

    console.log("\nDone! Created " + notifications.length + " notifications");
}

createTestNotifications()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
