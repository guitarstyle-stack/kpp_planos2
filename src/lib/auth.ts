import { cache } from 'react'
import { cookies } from 'next/headers'
import db from '@/lib/db'
import crypto from 'crypto'
import { SignJWT, jwtVerify } from 'jose'

const SESSION_SECRET = process.env.NEXTAUTH_SECRET;

if (!SESSION_SECRET) {
    throw new Error('NEXTAUTH_SECRET environment variable must be defined for security');
}

const encodedSecret = new TextEncoder().encode(SESSION_SECRET);

// 1. Create a session for a user
export async function createSession(userId: number) {
    const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

    // Generate a random session token
    const sessionToken = crypto.randomBytes(32).toString('hex')

    // Hash it before storing in DB (standard security practice)
    const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex')

    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

    await db.userSession.create({
        data: {
            userId,
            accessTokenHash: sessionHash,
            expiresAt,
        },
    })

    // Sign the session token (Payload: { sessionToken, userId })
    // This allows us to verify integrity before hitting DB if needed, 
    // but primarily we use the JWE/JWT as the cookie value containing the token
    const jwt = await new SignJWT({ token: sessionToken, userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedSecret)

    const cookieStore = await cookies()
    cookieStore.set('session', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt,
        path: '/',
    })

    return jwt
}

// 2. Get current session
export const getSession = cache(async function getSession() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value

    if (!sessionCookie) return null

    try {
        const { payload } = await jwtVerify(sessionCookie, encodedSecret)
        const sessionToken = payload.token as string
        // const userId = payload.userId as number

        // Re-hash to find in DB
        const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex')

        const session = await db.userSession.findFirst({
            where: {
                accessTokenHash: sessionHash,
                expiresAt: { gt: new Date() },
            },
            include: {
                user: {
                    include: {
                        department: true,
                        roles: {
                            include: {
                                role: true
                            }
                        }
                    }
                },
            },
        })

        if (!session) return null

        return session
    } catch (error) {
        console.error('Session verification failed:', error)
        return null
    }
})

// 3. Logout
export async function logout() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value

    if (sessionCookie) {
        try {
            const { payload } = await jwtVerify(sessionCookie, encodedSecret)
            const sessionToken = payload.token as string
            const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex')

            // Remove from DB
            await db.userSession.deleteMany({
                where: { accessTokenHash: sessionHash }
            })
        } catch {
            // Ignore error
        }
    }

    cookieStore.delete('session')
}

// Helper to get current user directly
export const getCurrentUser = cache(async function getCurrentUser() {
    const session = await getSession()
    return session?.user || null
})
