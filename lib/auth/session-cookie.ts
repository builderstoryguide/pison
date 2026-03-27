import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

export const SESSION_COOKIE_NAME = 'pison_session'

const DEFAULT_MAX_AGE_SEC = 60 * 60 * 24 * 7

type SessionPayload = {
  sub: string
  exp: number
}

export type SessionSecretSource = 'explicit' | 'derived_fallback' | 'dev_fallback'

type SessionSecretDiagnostics = {
  hasUsableSecret: boolean
  source: SessionSecretSource | 'missing'
  missingInputs: string[]
}

type SessionSecretResolution = {
  secret: string
  source: SessionSecretSource
}

let cachedSessionSecret: SessionSecretResolution | null = null
let warnedAboutFallback = false

function resolveConfiguredSessionSecret(): string | null {
  const configured = process.env.AUTH_SESSION_SECRET?.trim()
  if (configured && configured.length >= 32) return configured
  return null
}

function resolveDerivedFallbackSecret(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceRoleKey) return null

  // Deterministic server-only fallback secret when AUTH_SESSION_SECRET is not configured.
  return createHmac('sha256', 'pison-session-secret-fallback-v1')
    .update(url)
    .update('\n')
    .update(serviceRoleKey)
    .digest('hex')
}

export function getSessionSecretDiagnostics(): SessionSecretDiagnostics {
  const explicitSecret = resolveConfiguredSessionSecret()
  if (explicitSecret) {
    return { hasUsableSecret: true, source: 'explicit', missingInputs: [] }
  }

  const fallbackSecret = resolveDerivedFallbackSecret()
  if (fallbackSecret) {
    return { hasUsableSecret: true, source: 'derived_fallback', missingInputs: [] }
  }

  const missingInputs: string[] = []
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) missingInputs.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) missingInputs.push('SUPABASE_SERVICE_ROLE_KEY')

  // In non-production environments, a built-in development fallback secret is available.
  if (process.env.NODE_ENV !== 'production') {
    return { hasUsableSecret: true, source: 'dev_fallback', missingInputs: [] }
  }

  return { hasUsableSecret: false, source: 'missing', missingInputs }
}

function getSessionSecret(): string {
  if (cachedSessionSecret) return cachedSessionSecret.secret

  const explicitSecret = resolveConfiguredSessionSecret()
  if (explicitSecret) {
    cachedSessionSecret = { secret: explicitSecret, source: 'explicit' }
    return explicitSecret
  }

  const fallbackSecret = resolveDerivedFallbackSecret()
  if (fallbackSecret) {
    cachedSessionSecret = { secret: fallbackSecret, source: 'derived_fallback' }
    if (!warnedAboutFallback && process.env.NODE_ENV === 'production') {
      warnedAboutFallback = true
      // eslint-disable-next-line no-console
      console.warn(
        '[auth] AUTH_SESSION_SECRET missing or too short; using derived fallback secret from server env.'
      )
    }
    return fallbackSecret
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Session signing secret is unavailable. Set AUTH_SESSION_SECRET (min 32 chars) or provide NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  const devSecret = 'dev-insecure-session-secret-min-32-chars!!'
  cachedSessionSecret = { secret: devSecret, source: 'dev_fallback' }
  if (!warnedAboutFallback) {
    warnedAboutFallback = true
    // eslint-disable-next-line no-console
    console.warn('[auth] Using development fallback session secret.')
  }
  return devSecret
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
