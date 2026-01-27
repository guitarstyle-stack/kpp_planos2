import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { getBaseUrl } from '@/lib/env'

export async function GET(req: NextRequest) {
    const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize'
    const CHANNEL_ID = process.env.LINE_CHANNEL_ID
    const REDIRECT_URI = `${req.nextUrl.origin}/api/auth/line`
    const STATE = crypto.randomUUID() // Should ideally be stored and verified
    const SCOPE = 'profile openid email'

    if (!CHANNEL_ID) {
        return Response.json({ error: 'LINE_CHANNEL_ID not configured' }, { status: 500 })
    }

    const url = `${LINE_AUTH_URL}?response_type=code&client_id=${CHANNEL_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${STATE}&scope=${SCOPE}`

    redirect(url)
}
