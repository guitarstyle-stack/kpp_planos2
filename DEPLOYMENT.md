# คู่มือการตั้งค่า Environment Variables

## สำหรับ Development (Localhost)

ไฟล์ `.env.local` ได้ถูกตั้งค่าให้พร้อมใช้งานบน localhost แล้ว ไม่ต้องทำอะไรเพิ่มเติม

### ทดสอบการทำงาน

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:3000` และทดสอบ LINE Login

---

## สำหรับ Production (Vercel)

### 1. ตั้งค่า Environment Variables บน Vercel Dashboard

เข้าไปที่ Vercel Dashboard → Project Settings → Environment Variables และเพิ่มตัวแปรต่อไปนี้:

#### Required Variables

```bash
# Environment
NODE_ENV=production

# Public App URL (ใช้ domain จริงของคุณ)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Database
DATABASE_URL=your-postgres-prisma-url
DIRECT_URL=your-postgres-url-non-pooling

# LINE Login
LINE_CHANNEL_ID=1656002115
LINE_CHANNEL_SECRET=6034068c307ec579efbb2302d258a5b6
LINE_CALLBACK_URL=https://your-app.vercel.app/api/auth/line

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app.vercel.app

# Supabase
SUPABASE_URL=https://oiwsbdmlqozjdnqdgqpz.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Postgres (from Supabase)
POSTGRES_URL=your-postgres-url
POSTGRES_PRISMA_URL=your-postgres-prisma-url
POSTGRES_URL_NON_POOLING=your-postgres-url-non-pooling
POSTGRES_USER=postgres
POSTGRES_HOST=your-postgres-host
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DATABASE=postgres
```

> **หมายเหตุ:** แทนที่ `your-app.vercel.app` ด้วย domain จริงของคุณ

### 2. อัพเดท LINE Developers Console

เข้าไปที่ [LINE Developers Console](https://developers.line.biz/console/) และอัพเดท Callback URL:

1. เลือก Channel ของคุณ
2. ไปที่ **LINE Login** → **Callback URL**
3. เพิ่ม URL ทั้งสองนี้:
   - `http://localhost:3000/api/auth/line` (สำหรับ development)
   - `https://your-app.vercel.app/api/auth/line` (สำหรับ production)

### 3. Deploy

```bash
git add .
git commit -m "Add environment configuration for Vercel"
git push
```

Vercel จะ deploy อัตโนมัติ

---

## การใช้งาน Environment Utilities

ในโค้ดของคุณ สามารถใช้ utility functions จาก `src/lib/env.ts`:

```typescript
import { getBaseUrl, getLineCallbackUrl, env } from '@/lib/env';

// ดึง base URL (จะเป็น localhost หรือ Vercel URL ตาม environment)
const baseUrl = getBaseUrl();

// ดึง LINE callback URL
const callbackUrl = getLineCallbackUrl();

// เข้าถึง environment variables แบบ type-safe
console.log(env.baseUrl);
console.log(env.isProduction);
console.log(env.isDevelopment);
```

### ตัวอย่างการใช้งาน

```typescript
// ใน API route
import { getLineCallbackUrl } from '@/lib/env';

export async function GET(request: Request) {
  const callbackUrl = getLineCallbackUrl();
  // callbackUrl จะเป็น http://localhost:3000/api/auth/line บน dev
  // และเป็น https://your-app.vercel.app/api/auth/line บน production
}
```

---

## วิธีการทำงาน

ระบบจะตรวจสอบ environment และเลือก URL ที่เหมาะสมโดยอัตโนมัติ:

1. **Client-side**: ใช้ `NEXT_PUBLIC_APP_URL` หรือ `window.location.origin`
2. **Server-side (Vercel)**: ใช้ `VERCEL_URL` (Vercel ตั้งค่าให้อัตโนมัติ)
3. **Server-side (Local)**: ใช้ `NEXT_PUBLIC_APP_URL` หรือ fallback เป็น `http://localhost:3000`

ด้วยวิธีนี้ คุณไม่ต้องกังวลเรื่อง hardcoded URLs อีกต่อไป!
