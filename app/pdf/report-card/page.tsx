import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import { guardReportCardAccess } from '@/lib/auth/report-card-access'
import { loadReportCardData } from '@/lib/report-cards/load-report-card-data'
import ReportCardPdfClient from './report-card-pdf-client'

export const dynamic = 'force-dynamic'

function parseTerm(raw: string): string {
  if (raw === 'annual' || raw === '1' || raw === '2' || raw === '3') return raw
  return 'annual'
}

function buildRequestOrigin(h: Headers): string {
  const hostRaw = h.get('x-forwarded-host') || h.get('host') || '127.0.0.1:3000'
  const forwardedProto = h.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const fromUrlProto = 'http'
  let proto = forwardedProto || fromUrlProto

  let host = hostRaw
  if (process.env.NODE_ENV === 'development') {
    const lower = host.toLowerCase()
    if (
      lower.startsWith('localhost:') ||
      lower === 'localhost' ||
      lower.startsWith('127.0.0.1') ||
      lower.startsWith('[::1]')
    ) {
      proto = 'http'
    }
    if (/^localhost(:\d+)?$/i.test(host)) {
      host = host.replace(/^localhost/i, '127.0.0.1')
    } else if (/^\[::1\](:\d+)?$/i.test(host)) {
      host = host.replace(/^\[::1\]/i, '127.0.0.1')
    }
  }

  return `${proto}://${host}`
}

export default async function ReportCardPdfPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; term?: string; classId?: string }>
}) {
  const sp = await searchParams
  const studentId = (sp.studentId ?? '').trim()
  const term = parseTerm((sp.term ?? 'annual').trim())
  const classId = (sp.classId ?? '').trim()

  const h = await headers()
  const cookieHeader = h.get('cookie') || ''
  const origin = buildRequestOrigin(h)

  const req = new NextRequest(`${origin}/pdf/report-card`, {
    headers: { cookie: cookieHeader },
  })

  if (!studentId) {
    return (
      <ReportCardPdfClient studentId="" term={term} classId={classId} initialError="Missing studentId" />
    )
  }

  const denied = await guardReportCardAccess(req, studentId, 'json')
  if (denied) {
    const body = (await denied.json()) as { error?: string }
    const msg =
      typeof body?.error === 'string'
        ? body.error
        : denied.status === 401
          ? 'Unauthorized'
          : 'Access denied'
    return (
      <ReportCardPdfClient studentId={studentId} term={term} classId={classId} initialError={msg} />
    )
  }

  const result = await loadReportCardData({
    studentId,
    term,
    requestOrigin: origin,
    cookieHeader,
  })

  if (!result.ok) {
    return (
      <ReportCardPdfClient studentId={studentId} term={term} classId={classId} initialError={result.error} />
    )
  }

  return (
    <ReportCardPdfClient studentId={studentId} term={term} classId={classId} initialData={result.data} />
  )
}
