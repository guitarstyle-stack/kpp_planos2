// Grant ADMIN role to LINE user: U65ce19fa48ab9789507d3ad5b35a64b6
// Run this with: npx tsx scripts/grant-admin.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const lineUserId = 'U65ce19fa48ab9789507d3ad5b35a64b6';

    console.log('🔍 Looking for user with LINE ID:', lineUserId);

    // Find user
    const user = await prisma.user.findUnique({
        where: { lineUserId },
        include: {
            roles: {
                include: {
                    role: true,
                },
            },
        },
    });

    if (!user) {
        console.error('❌ User not found with LINE ID:', lineUserId);
        process.exit(1);
    }

    console.log('✅ Found user:', user.name, `(ID: ${user.id})`);

    // Check if already has ADMIN role
    const hasAdmin = user.roles.some(ur => ur.role.name === 'ADMIN');
    if (hasAdmin) {
        console.log('ℹ️  User already has ADMIN role');
        process.exit(0);
    }

    // Ensure ADMIN role exists
    let adminRole = await prisma.role.findUnique({
        where: { name: 'ADMIN' },
    });

    if (!adminRole) {
        console.log('📝 Creating ADMIN role...');
        adminRole = await prisma.role.create({
            data: {
                name: 'ADMIN',
                label: 'ผู้ดูแลระบบ',
            },
        });
    }

    // Grant ADMIN role
    console.log('🎯 Granting ADMIN role...');
    await prisma.userRole.create({
        data: {
            userId: user.id,
            roleId: adminRole.id,
        },
    });

    console.log('✅ ADMIN role granted successfully!');
    console.log('');
    console.log('User details:');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email || 'N/A');
    console.log('  LINE ID:', user.lineUserId);
    console.log('  Role: ADMIN ✨');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
