import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export default async function proxy(request: NextRequest) {
    // 1. Check if path requires auth
    const protectedPaths = ['/projects', '/indicators', '/reports', '/settings']
    const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

    if (!isProtected) {
        return NextResponse.next()
    }

    // 2. Verify Session
    const sessionCookie = request.cookies.get('session')?.value
    const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret-at-least-32-chars-long')

    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    try {
        // Verify JWT integrity only (fast edge check)
        // Full DB verification happens in server components/actions
        await jwtVerify(sessionCookie, SECRET)
        return NextResponse.next()
    } catch {
        // Invalid token
        return NextResponse.redirect(new URL('/', request.url))
    }
}

export const config = {
    matcher: [
        '/projects/:path*',
        '/indicators/:path*',
        '/reports/:path*',
        '/settings/:path*',
    ],
}
