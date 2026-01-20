# Vercel Environment Variables Configuration

## Required Environment Variables

ตั้งค่าใน Vercel Dashboard → Settings → Environment Variables:

### Production Environment

```bash
# Production Domain (สำคัญมาก!)
NEXT_PUBLIC_APP_URL=https://kpp-planos2.vercel.app

# Database
DATABASE_URL=postgres://postgres.oiwsbdmlqozjdnqdgqpz:Kf2MhTqFeKJoKQRE@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DIRECT_URL=postgres://postgres.oiwsbdmlqozjdnqdgqpz:Kf2MhTqFeKJoKQRE@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require

# LINE Login
LINE_CHANNEL_ID=1656002115
LINE_CHANNEL_SECRET=6034068c307ec579efbb2302d258a5b6

# Supabase
SUPABASE_URL=https://oiwsbdmlqozjdnqdgqpz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pd3NiZG1scW96amRucWRncXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODI2MTAsImV4cCI6MjA4NDM1ODYxMH0.IuPvyeBI-kzott00_eixSeTLpMsx3bxrZzVnF0RLaFg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pd3NiZG1scW96amRucWRncXB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc4MjYxMCwiZXhwIjoyMDg0MzU4NjEwfQ._XmRfRP8MDaHYu7dA2HtiiRYbLu37yxKv2AK1eTUh38
SUPABASE_JWT_SECRET=IlD0L+mMk2b3e/wkGqqqhv7nSPyDwtfEy+DOJRdwc2+sRBjgpwANYVxCumtyvZVlMWzgkRnvEF0SPABOmt9vhA==

# Postgres (from Supabase)
POSTGRES_URL=postgres://postgres.oiwsbdmlqozjdnqdgqpz:Kf2MhTqFeKJoKQRE@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_PRISMA_URL=postgres://postgres.oiwsbdmlqozjdnqdgqpz:Kf2MhTqFeKJoKQRE@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
POSTGRES_URL_NON_POOLING=postgres://postgres.oiwsbdmlqozjdnqdgqpz:Kf2MhTqFeKJoKQRE@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
POSTGRES_USER=postgres
POSTGRES_HOST=db.oiwsbdmlqozjdnqdgqpz.supabase.co
POSTGRES_PASSWORD=Kf2MhTqFeKJoKQRE
POSTGRES_DATABASE=postgres
```

## สำคัญ!

> **NEXT_PUBLIC_APP_URL** ต้องตั้งค่าเป็น production domain (`https://kpp-planos2.vercel.app`) เพื่อให้ LINE callback ทำงานถูกต้อง

## วิธีตั้งค่าบน Vercel

1. เข้า https://vercel.com/dashboard
2. เลือกโปรเจกต์ `kpp-planos2`
3. ไปที่ **Settings** → **Environment Variables**
4. เพิ่มตัวแปรทั้งหมดข้างบน
5. เลือก Environment: **Production**, **Preview**, **Development** (ทั้งหมด)
6. คลิก **Save**
7. **Redeploy** โปรเจกต์

## หลังจากตั้งค่าเสร็จ

Vercel จะใช้ `NEXT_PUBLIC_APP_URL` แทน deployment-specific URL ทำให้ LINE callback ทำงานถูกต้อง
