import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveTeacherId } from '@/lib/teacher-lookup'

export async function POST(request: NextRequest) {
  try {
    const { assignments } = await request.json()

    if (!assignments || !Array.isArray(assignments)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assignments data' },
        { status: 400 }
      )
    }

    // Validate assignments
    for (const assignment of assignments) {
      if (!assignment.teacherId || !assignment.classId) {
        return NextResponse.json(
          { success: false, error: 'Missing required assignment fields (teacherId and classId are required)' },
          { status: 400 }
        )
      }
      // Note: branchId is required for database insertion (NOT NULL constraint)
      if (!assignment.branchId || assignment.branchId.trim() === '') {
        // Assignment with null/empty branchId will be skipped
      }
    }

    // Get teacher ID from the first assignment
    const teacherId = assignments[0].teacherId

    const supabase = await createClient()
    
    // Use the centralized teacher lookup utility
    const teacher = await resolveTeacherId(supabase, teacherId)
    
    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      )
    }
    
    const actualTeacherId = teacher.id

    // First, remove existing assignments for this teacher
    const { error: deleteError } = await supabase
      .from('teacher_branch_assignments')
      .delete()
      .eq('teacher_id', actualTeacherId)

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to clear existing assignments' },
        { status: 500 }
      )
    }

    // Insert new assignments - filter out assignments with null branchId
    const validAssignments = assignments.filter(assignment => 
      assignment.branchId && assignment.branchId.trim() !== ''
    )
    
    if (validAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        assignments: [],
        message: 'No valid assignments to create (all assignments have null branch IDs)'
      })
    }
    
    // Get academic year from app configuration
    const { getAcademicYearFromConfig } = await import('@/lib/app-config-server')
    const defaultAcademicYear = await getAcademicYearFromConfig()
    
    const assignmentData = validAssignments.map(assignment => ({
      teacher_id: actualTeacherId,
      branch_id: assignment.branchId,
      class_id: assignment.classId,
      academic_year: assignment.academicYear || defaultAcademicYear,
      term: assignment.term || 'Term 1',
      is_primary_teacher: assignment.isPrimary || false,
      assigned_at: new Date().toISOString()
    }))

    const { data: insertedAssignments, error: insertError } = await supabase
      .from('teacher_branch_assignments')
      .insert(assignmentData)
      .select()

    if (insertError) {
      return NextResponse.json(
        { success: false, error: `Failed to create assignments: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Invalidate ultra-fast cache for this teacher
    try {
      // Use request.nextUrl.origin for server-side calls instead of hardcoded localhost
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
      const cacheUrl = `${baseUrl}/api/teachers/assignments/ultra-fast`
      
      const cacheInvalidationResponse = await fetch(cacheUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clear_cache',
          teacherId: actualTeacherId
        })
      })
      
      if (!cacheInvalidationResponse.ok) {
        // Failed to invalidate ultra-fast cache
      }
    } catch (_cacheError) {
      // Don't fail the main operation if cache invalidation fails
    }

    return NextResponse.json({
      success: true,
      assignments: insertedAssignments,
      message: 'Teacher assignments updated successfully'
    })

  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Convert teacher ID to UUID if it's not already a UUID
    let actualTeacherId = teacherId
    if (!teacherId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('teacher_id', teacherId)
        .single()
      
      if (teacherError || !teacherData) {
        return NextResponse.json(
          { success: false, error: 'Teacher not found' },
          { status: 404 }
        )
      }
      
      actualTeacherId = teacherData.id
    }

    // Fetch assignments with related data
    const { data: assignments, error } = await supabase
      .from('teacher_branch_assignments')
      .select(`
        *,
        branch:subject_branches(
          *,
          subject:subjects(*)
        ),
        class:classes(*)
      `)
      .eq('teacher_id', actualTeacherId)
      .order('assigned_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      assignments: assignments || []
    })

  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}