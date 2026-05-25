import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateUser } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateUser(request)
    if (authError || !user) {
      return authError || NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const subject = searchParams.get('subject')
    const teacherId = searchParams.get('teacherId')

    const supabase = await createClient()
    let query = supabase
      .from('assessments')
      .select('id, title, type, subject, class_id, total_marks, assessment_date, teacher_id, created_at')
      .order('assessment_date', { ascending: false })

    if (classId) query = query.eq('class_id', classId)
    if (subject) query = query.ilike('subject', subject)
    if (teacherId) query = query.eq('teacher_id', teacherId)

    const { data, error } = await query.limit(500)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const classIds = [...new Set((data || []).map((a) => a.class_id).filter(Boolean))]
    const classMap: Record<string, string> = {}
    if (classIds.length > 0) {
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name, class_name')
        .in('id', classIds)
      for (const c of classes || []) {
        classMap[c.id] = c.class_name || c.name || c.id
      }
    }

    const assessments = (data || []).map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      subject: a.subject,
      classId: a.class_id,
      className: classMap[a.class_id] || a.class_id,
      totalMarks: a.total_marks ?? 20,
      date: a.assessment_date,
      createdAt: a.created_at,
    }))

    return NextResponse.json({ ok: true, assessments })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
