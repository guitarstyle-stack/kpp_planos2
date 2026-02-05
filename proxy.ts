import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export default async function proxy(request: NextRequest) {
    // Content Security Policy
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' data: https: blob:;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' https://api.line.me https://*.supabase.co wss://*.supabase.co;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim();

    // 1. Check if path requires auth
    const protectedPaths = ['/projects', '/indicators', '/reports', '/settings']
    const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

    if (!isProtected) {
        const response = NextResponse.next();
        response.headers.set('Content-Security-Policy', cspHeader);
        return response;
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
        const response = NextResponse.next();
        response.headers.set('Content-Security-Policy', cspHeader);
        return response;
    } catch {
        // Invalid token
        return NextResponse.redirect(new URL('/', request.url))
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
