import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export const runtime = 'nodejs'

/**
 * Lightweight endpoint that returns only essential class information
 * Much faster than the full assignments endpoint
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: teacherId } = await params
    
    if (!teacherId) {
      return NextResponse.json(
        { ok: false, error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    // Verify user exists and is a teacher
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, name')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Teacher not found or not authorized' },
        { status: 404 }
      )
    }

    // Find teacher record - simplified query
    const { data: teacherRecord } = await supabase
      .from('teachers')
      .select('id, user_id, teacher_id, subjects, classes')
      .eq('user_id', teacherId)
      .maybeSingle()

    // If teacher record not found, return empty array
    if (!teacherRecord) {
      return NextResponse.json({
        ok: true,
        teacher: {
          id: user.id,
          name: user.name,
        },
        subjects: [],
        classes: [],
      })
    }

    // Get classes from teacher_branch_assignments - fastest query
    const { data: assignments } = await supabase
      .from('teacher_branch_assignments')
      .select(`
        class_id,
        classes:class_id (
          id,
          class_name,
          class_level,
          subsystem,
          stream,
          academic_year,
          status
        )
      `)
      .eq('teacher_id', teacherRecord.id)
      .eq('status', 'active')
      .limit(100)

    // Get unique classes
    const classMap = new Map<string, any>()
    
    if (assignments) {
      assignments.forEach((assignment: any) => {
        const cls = assignment.classes
        if (cls && !classMap.has(cls.id)) {
          classMap.set(cls.id, {
            id: cls.id,
            name: cls.class_name || 'Unknown',
            level: cls.class_level || '',
            subsystem: cls.subsystem || '',
            branch: cls.stream || '',
            academicYear: cls.academic_year || '',
            status: cls.status || 'active',
            students: [], // Empty - will be loaded on demand
            subjects: [], // Empty - will be loaded on demand
          })
        }
      })
    }

    // Also check if teacher is a class teacher
    const { data: classTeacherClasses } = await supabase
      .from('classes')
      .select('id, class_name, class_level, subsystem, stream, academic_year, status')
      .eq('class_teacher_id', teacherRecord.id)
      .eq('status', 'active')
      .limit(50)

    if (classTeacherClasses) {
      classTeacherClasses.forEach((cls: any) => {
        if (!classMap.has(cls.id)) {
          classMap.set(cls.id, {
            id: cls.id,
            name: cls.class_name || 'Unknown',
            level: cls.class_level || '',
            subsystem: cls.subsystem || '',
            branch: cls.stream || '',
            academicYear: cls.academic_year || '',
            status: cls.status || 'active',
            students: [],
            subjects: [],
          })
        }
      })
    }

    const classes = Array.from(classMap.values())

    // Get basic subjects info - minimal query
    const { data: teacherSubjects } = await supabase
      .from('teacher_subjects')
      .select('id, subject_id, subject_name, is_active')
      .eq('teacher_id', teacherRecord.id)
      .eq('is_active', true)
      .limit(50)

    const subjects = (teacherSubjects || []).map((ts: any) => ({
      id: ts.id,
      subjectId: ts.subject_id,
      subjectName: ts.subject_name || 'Unknown',
      isActive: ts.is_active,
    }))

    return NextResponse.json({
      ok: true,
      teacher: {
        id: user.id,
        name: user.name,
      },
      subjects,
      classes,
    })
  } catch (error) {
    console.error('Error in lightweight GET /api/teachers/[id]/assignments/lightweight:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

