import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

export const SESSION_COOKIE_NAME = 'pison_session'

const DEFAULT_MAX_AGE_SEC = 60 * 60 * 24 * 7

type SessionPayload = {
  sub: string
  exp: number
}

function getSessionSecret(): string {
  const s = process.env.AUTH_SESSION_SECRET?.trim()
  if (s && s.length >= 32) return s
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SESSION_SECRET must be set (min 32 characters) in production')
  }
  return 'dev-insecure-session-secret-min-32-chars!!'
}

export function createSessionToken(userId: string, maxAgeSec: number = DEFAULT_MAX_AGE_SEC): string {
  const secret = getSessionSecret()
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec
  const body: SessionPayload = { sub: userId, exp }
  const payload = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url')
  const sig = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const secret = getSessionSecret()
    const parts = token.split('.')
    if (parts.length !== 2) return null
    const [payload, sig] = parts
    const expected = createHmac('sha256', secret).update(payload).digest('base64url')
    const sigBuf = Buffer.from(sig, 'utf8')
    const expBuf = Buffer.from(expected, 'utf8')
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null

    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionPayload
    if (
      !parsed ||
      typeof parsed.sub !== 'string' ||
      typeof parsed.exp !== 'number' ||
      !parsed.sub
    ) {
      return null
    }
    if (parsed.exp <= Math.floor(Date.now() / 1000)) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Reads `pison_session` from Next.js parsed cookies, or from the raw Cookie header.
 * Synthetic `NextRequest` instances (e.g. `new NextRequest(url, { headers: { cookie } })`)
 * do not populate `request.cookies`; the header fallback keeps server components and
 * internal callers consistent with real requests.
 */
function readCookieValueFromHeader(cookieHeader: string, name: string): string | null {
  for (const segment of cookieHeader.split(';')) {
    const part = segment.trim()
    if (!part) continue
    const eq = part.indexOf('=')
    if (eq === -1) continue
    const key = part.slice(0, eq).trim()
    if (key !== name) continue
    const value = part.slice(eq + 1).trim()
    return value || null
  }
  return null
}

export function readSessionTokenFromRequest(request: NextRequest): string | null {
  const fromParsed = request.cookies.get(SESSION_COOKIE_NAME)?.value?.trim()
  if (fromParsed) return fromParsed

  const header = request.headers.get('cookie')
  if (!header) return null
  const fromHeader = readCookieValueFromHeader(header, SESSION_COOKIE_NAME)?.trim()
  return fromHeader || null
}

export function sessionCookieBaseOptions(maxAgeSec: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec,
  }
}
