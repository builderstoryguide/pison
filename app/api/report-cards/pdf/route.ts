import { NextRequest, NextResponse } from 'next/server'
import { generateReportCardPdfFromUrl } from '@/lib/report-card-pdf'
import { guardReportCardAccess } from '@/lib/auth/report-card-access'

export const runtime = 'nodejs'
export const maxDuration = 120

function sanitizeFilenamePart(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || 'student'
}

function isLoopbackHost(host: string): boolean {
  const h = host.toLowerCase()
  return (
    h.startsWith('localhost:') ||
    h === 'localhost' ||
    h.startsWith('127.0.0.1:') ||
    h === '127.0.0.1' ||
    h.startsWith('[::1]:') ||
    h === '[::1]'
  )
}

function normalizeLoopbackHostForHeadless(host: string): string {
  const mLocal = /^localhost(:\d+)?$/i.exec(host)
  if (mLocal) return `127.0.0.1${mLocal[1] ?? ''}`
  const mV6 = /^\[::1\](:\d+)?$/i.exec(host)
  if (mV6) return `127.0.0.1${mV6[1] ?? ''}`
  return host
}

function buildOrigin(request: NextRequest): string {
  // Prefer the incoming request host so Puppeteer hits the same server (critical in dev when
  // NEXT_PUBLIC_APP_URL points at production/staging).
  const hostRaw = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const fromUrl = request.nextUrl.protocol.replace(':', '')
  let proto = forwardedProto || fromUrl || 'http'

  let host = hostRaw
  if (host) {
    if (process.env.NODE_ENV === 'development' && isLoopbackHost(host)) {
      // Dev servers are almost always plain HTTP; a wrong x-forwarded-proto breaks Puppeteer's goto.
      proto = 'http'
      host = normalizeLoopbackHostForHeadless(host)
    }
    return `${proto}://${host}`
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (envUrl) return envUrl
  return request.nextUrl.origin
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')?.trim()
    const termRaw = searchParams.get('term')?.trim() || 'annual'
    const classId = searchParams.get('classId')?.trim() || ''

    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })
    }

    const accessDenied = await guardReportCardAccess(request, studentId, 'pdf')
    if (accessDenied) return accessDenied

    const term =
      termRaw === 'annual' || termRaw === '1' || termRaw === '2' || termRaw === '3'
        ? termRaw
        : 'annual'

    const cookieHeader = request.headers.get('cookie') || ''

    const origin = buildOrigin(request)
    const pdfPage = new URL('/pdf/report-card', origin)
    pdfPage.searchParams.set('studentId', studentId)
    pdfPage.searchParams.set('term', term)
    if (classId) pdfPage.searchParams.set('classId', classId)

    const pdfBuffer = await generateReportCardPdfFromUrl({
      targetUrl: pdfPage.toString(),
      cookieHeader,
    })

    const filename = `ReportCard_${sanitizeFilenamePart(studentId)}_${term}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'PDF generation failed'
    // eslint-disable-next-line no-console
    console.error('[report-cards/pdf]', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
