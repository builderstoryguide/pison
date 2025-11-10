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

    console.log('🔄 Processing teacher assignments:', assignments)
    console.log('📊 Assignment details:', assignments.map(a => ({
      teacherId: a.teacherId,
      branchId: a.branchId,
      classId: a.classId,
      hasBranchId: !!a.branchId && a.branchId.trim() !== ''
    })))

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
        console.warn('⚠️ Assignment with null/empty branchId will be skipped:', assignment)
      }
    }

    // Get teacher ID from the first assignment
    const teacherId = assignments[0].teacherId

    const supabase = await createClient()
    
    // Use the centralized teacher lookup utility
    const teacher = await resolveTeacherId(supabase, teacherId)
    
    if (!teacher) {
      console.error('❌ Teacher not found for assignments:', teacherId)
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      )
    }
    
    const actualTeacherId = teacher.id
    console.log(`✅ Found teacher for assignments: ${teacher.first_name} ${teacher.last_name}, ID: ${actualTeacherId}`)

    // First, remove existing assignments for this teacher
    const { error: deleteError } = await supabase
      .from('teacher_branch_assignments')
      .delete()
      .eq('teacher_id', actualTeacherId)

    if (deleteError) {
      console.error('❌ Error deleting existing assignments:', deleteError)
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
      console.log('⚠️ No valid assignments to insert (all have null branchId)')
      return NextResponse.json({
        success: true,
        assignments: [],
        message: 'No valid assignments to create (all assignments have null branch IDs)'
      })
    }
    
    const assignmentData = validAssignments.map(assignment => ({
      teacher_id: actualTeacherId,
      branch_id: assignment.branchId,
      class_id: assignment.classId,
      academic_year: assignment.academicYear || '2024-2025',
      term: assignment.term || 'Term 1',
      is_primary_teacher: assignment.isPrimary || false,
      assigned_at: new Date().toISOString()
    }))

    const { data: insertedAssignments, error: insertError } = await supabase
      .from('teacher_branch_assignments')
      .insert(assignmentData)
      .select()

    if (insertError) {
      console.error('❌ Error inserting assignments:', insertError)
      console.error('❌ Assignment data that failed:', assignmentData)
      console.error('❌ Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return NextResponse.json(
        { success: false, error: `Failed to create assignments: ${insertError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Assignments created successfully:', insertedAssignments)

    // Invalidate ultra-fast cache for this teacher
    try {
      const cacheInvalidationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/teachers/assignments/ultra-fast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clear_cache',
          teacherId: actualTeacherId
        })
      })
      
      if (cacheInvalidationResponse.ok) {
        console.log('✅ Ultra-fast cache invalidated for teacher:', actualTeacherId)
      } else {
        console.warn('⚠️ Failed to invalidate ultra-fast cache for teacher:', actualTeacherId)
      }
    } catch (cacheError) {
      console.warn('⚠️ Error invalidating ultra-fast cache:', cacheError)
      // Don't fail the main operation if cache invalidation fails
    }

    return NextResponse.json({
      success: true,
      assignments: insertedAssignments,
      message: 'Teacher assignments updated successfully'
    })

  } catch (error) {
    console.error('❌ Error in assignments API:', error)
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

    console.log('🔍 Fetching assignments for teacher:', teacherId)

    const supabase = await createClient()

    // Convert teacher ID to UUID if it's not already a UUID
    let actualTeacherId = teacherId
    if (!teacherId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log(`🔄 Converting teacher ID ${teacherId} to UUID for GET`)
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('teacher_id', teacherId)
        .single()
      
      if (teacherError || !teacherData) {
        console.error('❌ Teacher not found for GET:', teacherError)
        return NextResponse.json(
          { success: false, error: 'Teacher not found' },
          { status: 404 }
        )
      }
      
      actualTeacherId = teacherData.id
      console.log(`✅ Found teacher UUID for GET: ${actualTeacherId}`)
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
      console.error('❌ Error fetching assignments:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    console.log('✅ Assignments fetched successfully:', assignments)

    return NextResponse.json({
      success: true,
      assignments: assignments || []
    })

  } catch (error) {
    console.error('❌ Error in assignments GET API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}