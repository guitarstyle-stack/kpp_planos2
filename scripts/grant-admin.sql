-- Grant ADMIN role to LINE user: U65ce19fa48ab9789507d3ad5b35a64b6

-- Step 1: Ensure ADMIN role exists
INSERT INTO "Role" (name, label, "createdAt", "updatedAt")
VALUES ('ADMIN', 'ผู้ดูแลระบบ', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Step 2: Grant ADMIN role to the specific LINE user
INSERT INTO "UserRole" ("userId", "roleId", "assignedAt")
SELECT 
  u.id as "userId",
  r.id as "roleId",
  NOW() as "assignedAt"
FROM "User" u
CROSS JOIN "Role" r
WHERE u."lineUserId" = 'U65ce19fa48ab9789507d3ad5b35a64b6'
  AND r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Step 3: Verify the grant
SELECT 
  u.id,
  u.name,
  u.email,
  u."lineUserId",
  r.name as role_name,
  r.label as role_label,
  ur."assignedAt"
FROM "User" u
JOIN "UserRole" ur ON u.id = ur."userId"
JOIN "Role" r ON ur."roleId" = r.id
WHERE u."lineUserId" = 'U65ce19fa48ab9789507d3ad5b35a64b6';
