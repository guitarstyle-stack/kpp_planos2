
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function verifySystem() {
    console.log("Verifying system readiness...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not Set");
    console.log("DIRECT_URL:", process.env.DIRECT_URL ? "Set" : "Not Set");

    try {
        await prisma.$connect();
        console.log("✅ Database connection successful.");

        const roleCount = await prisma.role.count();
        console.log(`✅ Roles found: ${roleCount}`);
        if (roleCount === 0) console.warn("⚠️ No roles found. SEEDING MIGHT BE REQUIRED.");

        const deptTypeCount = await prisma.departmentType.count();
        console.log(`✅ Department Types found: ${deptTypeCount}`);

        const departmentCount = await prisma.department.count();
        console.log(`✅ Departments found: ${departmentCount}`);

        const userCount = await prisma.user.count();
        console.log(`✅ Users found: ${userCount}`);

        const annualPlans = await prisma.annualPlan.findMany({ where: { isActive: true } });
        console.log(`✅ Active Annual Plans found: ${annualPlans.length}`);
        if (annualPlans.length === 0) console.warn("⚠️ No active annual plans found. Dashboard might be empty.");

    } catch (error) {
        console.error("❌ System verification failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifySystem();
