import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateUser, isAdmin } from '@/lib/auth/server'
import { getSequenceName } from '@/lib/report-card-utils'

/**
 * POST /api/admin/marks/find-or-create-assessment
 * Finds or creates an assessment based on class, subject, and sequence type
 * Returns the assessment ID
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateUser(request)
    if (authError || !user) {
      return authError || NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { classId, subjectName, sequenceName, sequenceType, sequenceNumber } = body

    // Validate required fields
    if (!classId || !subjectName || !sequenceName) {
      return NextResponse.json(
        { error: 'Missing required fields: classId, subjectName, sequenceName' },
        { status: 400 }
      )
    }

    // Normalize sequence name - use getSequenceName if sequenceNumber is provided
    let normalizedSequenceName = sequenceName
    if (sequenceNumber && typeof sequenceNumber === 'number') {
      normalizedSequenceName = getSequenceName(sequenceNumber)
    } else {
      // Capitalize first letter of each word if not already formatted
      normalizedSequenceName = sequenceName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Try to find existing assessment
    let { data: assessment } = await supabase
      .from('assessments')
      .select('id, total_marks')
      .eq('class_id', classId)
      .eq('subject', subjectName)
      .eq('title', normalizedSequenceName)
      .maybeSingle()

    // Case-insensitive fallback
    if (!assessment) {
      const { data: allMatches } = await supabase
        .from('assessments')
        .select('id, subject, total_marks')
        .eq('class_id', classId)
        .eq('title', normalizedSequenceName)

      if (allMatches && allMatches.length > 0) {
        const normalizedSubject = subjectName.toLowerCase().trim()
        const match = allMatches.find((a: any) =>
          a.subject && a.subject.trim().toLowerCase() === normalizedSubject
        )
        if (match) {
          assessment = match
        }
      }
    }

    const { data: subjectRow } = await supabase
      .from('subjects')
      .select('id')
      .ilike('name', subjectName)
      .maybeSingle()

    // Create assessment if it doesn't exist
    if (!assessment) {
      const { data: newAssessment, error: createError } = await supabase
        .from('assessments')
        .insert({
          title: normalizedSequenceName,
          type: 'test',
          subject: subjectName,
          subject_id: subjectRow?.id ?? null,
          class_id: classId,
          teacher_id: user.id,
          total_marks: 20,
          status: 'published',
          assessment_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating assessment:', createError)
        return NextResponse.json(
          { error: `Failed to create assessment: ${createError.message || 'Database error'}` },
          { status: 500 }
        )
      }
      assessment = newAssessment
    }

    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
      totalMarks: assessment.total_marks || 20,
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/marks/find-or-create-assessment:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
