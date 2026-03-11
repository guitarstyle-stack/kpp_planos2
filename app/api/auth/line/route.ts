import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { createSession } from '@/lib/auth'
import { getBaseUrl } from '@/lib/env'

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')

    const error = searchParams.get('error')

    if (error || !code) {
        return NextResponse.redirect(new URL('/?error=line_login_failed', req.url))
    }

    try {
        const CHANNEL_ID = process.env.LINE_CHANNEL_ID!
        const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!
        const REDIRECT_URI = `${req.nextUrl.origin}/api/auth/line`

        // 1. Exchange code for access token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                client_id: CHANNEL_ID,
                client_secret: CHANNEL_SECRET,
            }),
        })

        if (!tokenResponse.ok) {
            const err = await tokenResponse.json()
            console.error('LINE Token Error:', err)
            throw new Error('Failed to exchange token')
        }

        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token

        // 2. Get User Profile
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!profileResponse.ok) {
            throw new Error('Failed to get user profile')
        }

        const profile = await profileResponse.json()
        const { userId: lineUserId, displayName, pictureUrl } = profile

        // 3. Find or Create User
        // Note: Database schema requires 'departmentId'. 
        // For new users, we might need a default department or handling logic.
        // For now, we will try to find the user first. 
        // If not found, we cannot create one efficiently without a department.
        // OPTION: Create a default "Unassigned" department (id: 1) if it doesn't exist?
        // OR: Fail if user not pre-registered? 
        // SYSTEM DECISION: We will attempt to create with default department ID 1.
        // The user (boss) should ensure DB has department 1.

        // Check if TEMP department exists, if not create it
        let defaultDept = await db.department.findUnique({
            where: { code: 'TEMP' }
        })
        if (!defaultDept) {
            defaultDept = await db.department.create({
                data: {
                    code: 'TEMP',
                    name: 'Unassigned (Temp)',
                    isActive: true
                }
            })
        }

        // Upsert User
        const user = await db.user.upsert({
            where: { lineUserId },
            update: {
                // Don't update name - preserve user's custom display name
                // Only sync profile picture and last login time
                image: pictureUrl,
                lastLoginAt: new Date(),
            },
            create: {
                lineUserId,
                name: displayName, // Use LINE display name only for new users
                image: pictureUrl,
                departmentId: defaultDept!.id,
                isActive: true, // Default active
            },
        })

        if (!user.isActive) {
            return NextResponse.redirect(new URL('/?error=account_inactive', req.url))
        }

        // 4. Create Session
        await createSession(user.id)

        // 5. Audit Login
        await db.loginAudit.create({
            data: {
                userId: user.id,
                provider: 'LINE',
                success: true,
                ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown',
            }
        })

        return NextResponse.redirect(new URL('/projects', req.url))

    } catch (error: any) {
        console.error('Login Error:', error)
        return NextResponse.redirect(new URL(`/?error=server_error&details=${encodeURIComponent(error?.message || 'unknown')}`, req.url))
    }
}
