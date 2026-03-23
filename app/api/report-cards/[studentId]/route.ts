import { NextRequest, NextResponse } from 'next/server'
import { guardReportCardAccess } from '@/lib/auth/report-card-access'
import { loadReportCardData } from '@/lib/report-cards/load-report-card-data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
    const { searchParams } = new URL(request.url)
    const term = searchParams.get('term') || 'annual'

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Missing studentId' }, { status: 400 })
    }

    const accessDenied = await guardReportCardAccess(request, studentId, 'json')
    if (accessDenied) return accessDenied

    const origin = request.nextUrl.origin
    const cookieHeader = request.headers.get('cookie') || ''

    const result = await loadReportCardData({
      studentId,
      term,
      requestOrigin: origin,
      cookieHeader,
    })

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status })
    }

    return NextResponse.json(
      { success: true, data: result.data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Report card generation error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate report card data'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
