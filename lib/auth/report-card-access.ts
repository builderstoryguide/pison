import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { readSessionTokenFromRequest, verifySessionToken } from '@/lib/auth/session-cookie'

export type ReportCardErrorFormat = 'json' | 'pdf'

type DenyReason =
  | 'missing_session_cookie'
  | 'invalid_or_expired_session_token'
  | 'missing_or_inactive_user'
  | 'missing_parent_profile_code'
  | 'unknown_role'

function logAccessDenied(
  reason: DenyReason,
  context: { studentUuid: string; format: ReportCardErrorFormat; userId?: string; role?: string }
) {
  // Log lightweight auth diagnostics only; never include cookie/token values.
  // eslint-disable-next-line no-console
  console.warn('[report-card-access] denied', {
    reason,
    studentUuid: context.studentUuid,
    format: context.format,
    userId: context.userId ?? null,
    role: context.role ?? null,
  })
}

function unauthorized(format: ReportCardErrorFormat) {
  return format === 'pdf'
    ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}

function forbidden(format: ReportCardErrorFormat) {
  return format === 'pdf'
    ? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    : NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
}

function notFoundStudent(format: ReportCardErrorFormat) {
  return format === 'pdf'
    ? NextResponse.json({ error: 'Student not found' }, { status: 404 })
    : NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 })
}

function misconfigured(format: ReportCardErrorFormat) {
  return format === 'pdf'
    ? NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    : NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 })
}

/**
 * Ensures the caller has a valid app session and may view this student's report card.
 * Staff roles (admin, bursar, teacher) may view any student. Students and parents are
 * restricted using user_profiles + students.parents data.
 */
export async function guardReportCardAccess(
  request: NextRequest,
  studentUuid: string,
  format: ReportCardErrorFormat = 'json'
): Promise<NextResponse | null> {
  const token = readSessionTokenFromRequest(request)
  if (!token) {
    logAccessDenied('missing_session_cookie', { studentUuid, format })
    return unauthorized(format)
  }

  const payload = verifySessionToken(token)
  if (!payload) {
    logAccessDenied('invalid_or_expired_session_token', { studentUuid, format })
    return unauthorized(format)
  }

  let supabase
  try {
    supabase = createServiceClient()
  } catch {
    return misconfigured(format)
  }

  const { data: dbUser, error: userErr } = await supabase
    .from('users')
    .select('id, role, status')
    .eq('id', payload.sub)
    .maybeSingle()

  if (userErr || !dbUser || dbUser.status !== 'active') {
    logAccessDenied('missing_or_inactive_user', { studentUuid, format, userId: payload.sub })
    return unauthorized(format)
  }

  const role = dbUser.role as string

  const { data: student, error: studentErr } = await supabase
    .from('students')
    .select('id, student_id')
    .eq('id', studentUuid)
    .maybeSingle()

  if (studentErr) {
    // eslint-disable-next-line no-console
    console.error('[guardReportCardAccess] student lookup', studentErr)
    return format === 'pdf'
      ? NextResponse.json({ error: 'Failed to load student' }, { status: 500 })
      : NextResponse.json({ success: false, error: 'Failed to load student' }, { status: 500 })
  }
  if (!student) {
    return notFoundStudent(format)
  }

  const matricule = (student.student_id ?? '').trim()

  if (role === 'admin' || role === 'bursar' || role === 'teacher') {
    return null
  }

  if (role === 'student') {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role_specific_id')
      .eq('user_id', dbUser.id)
      .maybeSingle()
    const mine = (profile?.role_specific_id ?? '').trim()
    if (mine && mine === matricule) return null
    return forbidden(format)
  }

  if (role === 'parent') {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role_specific_id')
      .eq('user_id', dbUser.id)
      .maybeSingle()
    const parentCode = (profile?.role_specific_id ?? '').trim()
    if (!parentCode) {
      logAccessDenied('missing_parent_profile_code', {
        studentUuid,
        format,
        userId: dbUser.id,
        role,
      })
      return forbidden(format)
    }

    const { data: link } = await supabase
      .from('parents')
      .select('id')
      .eq('parent_code', parentCode)
      .eq('student_id', matricule)
      .maybeSingle()

    if (link) return null
    return forbidden(format)
  }

  logAccessDenied('unknown_role', { studentUuid, format, userId: dbUser.id, role })
  return forbidden(format)
}
