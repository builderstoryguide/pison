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
  const startTime = Date.now()
  
  try {
    console.log('[Lightweight API] Starting request...')
    const supabase = await createClient()
    const { id: teacherId } = await params
    
    if (!teacherId) {
      return NextResponse.json(
        { ok: false, error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    // Verify user exists and is a teacher
    console.log('[Lightweight API] Verifying user...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, name')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .single()

    if (userError || !user) {
      console.error('[Lightweight API] User verification failed:', serializeSupabaseError(userError))
      return NextResponse.json(
        { ok: false, error: 'Teacher not found or not authorized' },
        { status: 404 }
      )
    }

    // Find teacher record - simplified query
    console.log('[Lightweight API] Finding teacher record...')
    const { data: teacherRecord, error: teacherError } = await supabase
      .from('teachers')
      .select('id, user_id, teacher_id, subjects, classes')
      .eq('user_id', teacherId)
      .maybeSingle()

    if (teacherError) {
      console.error('[Lightweight API] Teacher lookup error:', serializeSupabaseError(teacherError))
    }

    // If teacher record not found, return empty array
    if (!teacherRecord) {
      console.log('[Lightweight API] No teacher record found, returning empty data')
      return NextResponse.json({
        ok: true,
        teacher: {
          id: user.id,
          name: user.name,
        },
        subjects: [],
        classes: [],
        timing: {
          totalMs: Date.now() - startTime
        }
      })
    }

    console.log('[Lightweight API] Fetching assignments...')
    // Get classes from teacher_branch_assignments - fastest query
    // Use simple query without joins first
    const { data: assignmentIds, error: assignmentError } = await supabase
      .from('teacher_branch_assignments')
      .select('class_id')
      .eq('teacher_id', teacherRecord.id)
      .eq('status', 'active')
      .limit(100)

    if (assignmentError) {
      console.error('[Lightweight API] Assignment query error:', serializeSupabaseError(assignmentError))
    }

    // Get unique class IDs
    const classIds = assignmentIds 
      ? Array.from(new Set(assignmentIds.map((a: any) => a.class_id).filter(Boolean)))
      : []
    
    console.log(`[Lightweight API] Found ${classIds.length} unique class IDs`)
    
    // Fetch class details separately (faster than joins for many databases)
    let classesData: any[] = []
    if (classIds.length > 0) {
      console.log('[Lightweight API] Fetching class details...')
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id, class_name, class_level, subsystem, stream, academic_year, status')
        .in('id', classIds)
        .eq('status', 'active')
      
      if (classError) {
        console.error('[Lightweight API] Class query error:', serializeSupabaseError(classError))
      }
      
      classesData = classes || []
      console.log(`[Lightweight API] Retrieved ${classesData.length} class details`)
    }

    // Get unique classes
    const classMap = new Map<string, any>()
    
    classesData.forEach((cls: any) => {
      if (!classMap.has(cls.id)) {
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

    // Also check if teacher is a class teacher (separate query for performance)
    const { data: classTeacherIds } = await supabase
      .from('classes')
      .select('id')
      .eq('class_teacher_id', teacherRecord.id)
      .eq('status', 'active')
      .limit(50)
    
    const additionalClassIds = classTeacherIds 
      ? classTeacherIds.map((c: any) => c.id).filter((id: string) => !classIds.includes(id))
      : []

    if (additionalClassIds.length > 0) {
      const { data: additionalClasses } = await supabase
        .from('classes')
        .select('id, class_name, class_level, subsystem, stream, academic_year, status')
        .in('id', additionalClassIds)
        .eq('status', 'active')
      
      if (additionalClasses) {
        additionalClasses.forEach((cls: any) => {
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
    }

    const classes = Array.from(classMap.values())
    console.log(`[Lightweight API] Prepared ${classes.length} classes for response`)

    // Get basic subjects info - minimal query
    console.log('[Lightweight API] Fetching subjects...')
    const { data: teacherSubjects, error: subjectError } = await supabase
      .from('teacher_subjects')
      .select('id, subject_id, subject_name, is_active')
      .eq('teacher_id', teacherRecord.id)
      .eq('is_active', true)
      .limit(50)

    if (subjectError) {
      console.error('[Lightweight API] Subject query error:', serializeSupabaseError(subjectError))
    }

    const subjects = (teacherSubjects || []).map((ts: any) => ({
      id: ts.id,
      subjectId: ts.subject_id,
      subjectName: ts.subject_name || 'Unknown',
      isActive: ts.is_active,
    }))

    const totalTime = Date.now() - startTime
    console.log(`[Lightweight API] Request completed in ${totalTime}ms`)

    return NextResponse.json({
      ok: true,
      teacher: {
        id: user.id,
        name: user.name,
      },
      subjects,
      classes,
      timing: {
        totalMs: totalTime
      }
    })
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[Lightweight API] Error after ${totalTime}ms:`, serializeSupabaseError(error as any))
    return NextResponse.json(
      { 
        ok: false, 
        error: serializeSupabaseError(error as any),
        timing: {
          totalMs: totalTime
        }
      },
      { status: 500 }
    )
  }
}

