import { NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME, sessionCookieBaseOptions } from '@/lib/auth/session-cookie'

export const runtime = 'nodejs'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    ...sessionCookieBaseOptions(0),
    maxAge: 0,
  })
  return res
}
