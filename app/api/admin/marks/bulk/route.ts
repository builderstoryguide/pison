import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateUser, isAdmin } from '@/lib/auth/server'

function calculateGrade(mark: number, totalMarks: number = 20): string {
  const percentage = (mark / totalMarks) * 100
  if (percentage >= 85) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  if (percentage >= 40) return 'E'
  return 'F'
}

function calculateRemarks(grade: string): string {
  switch (grade) {
    case 'A': return 'Excellent'
    case 'B': return 'Very Good'
    case 'C': return 'Good'
    case 'D': return 'Pass'
    case 'E': return 'Weak'
    case 'F': return 'Fail'
    default: return ''
  }
}

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
    const { marks: marksData } = body

    if (!Array.isArray(marksData) || marksData.length === 0) {
      return NextResponse.json(
        { error: 'Marks must be a non-empty array' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    let successCount = 0
    const errors: string[] = []

    // Get all assessments to calculate grades
    const assessmentIds = [...new Set(marksData.map((m: any) => m.assessmentId))]
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, total_marks')
      .in('id', assessmentIds)

    const assessmentMap: Record<string, number> = {}
    if (assessments) {
      assessments.forEach((a: any) => {
        assessmentMap[a.id] = a.total_marks || 20
      })
    }

    // Process each mark
    for (const markData of marksData) {
      try {
        const { studentId, assessmentId, marksObtained, remarks } = markData

        if (!studentId || !assessmentId || marksObtained === undefined) {
          errors.push(`Missing required fields for mark: ${JSON.stringify(markData)}`)
          continue
        }

        if (typeof marksObtained !== 'number' || marksObtained < 0 || marksObtained > 20) {
          errors.push(`Invalid mark value for student ${studentId}: ${marksObtained}`)
          continue
        }

        const totalMarks = assessmentMap[assessmentId] || 20
        const percentage = Math.round((marksObtained / totalMarks) * 100 * 100) / 100
        const gradeLetter = calculateGrade(marksObtained, totalMarks)
        const gradeRemarks = remarks || calculateRemarks(gradeLetter)

        // Check if grade already exists
        const { data: existing } = await supabase
          .from('grades')
          .select('id')
          .eq('assessment_id', assessmentId)
          .eq('student_id', studentId)
          .maybeSingle()

        if (existing) {
          // Update existing
          const { error: updateError } = await supabase
            .from('grades')
            .update({
              marks_obtained: marksObtained,
              percentage,
              grade_letter: gradeLetter,
              remarks: gradeRemarks,
            })
            .eq('id', existing.id)

          if (updateError) {
            errors.push(`Failed to update grade for student ${studentId}: ${updateError.message}`)
          } else {
            successCount++
          }
        } else {
          // Create new
          const { error: insertError } = await supabase
            .from('grades')
            .insert({
              assessment_id: assessmentId,
              student_id: studentId,
              marks_obtained: marksObtained,
              percentage,
              grade_letter: gradeLetter,
              remarks: gradeRemarks,
              submitted_at: new Date().toISOString(),
            })

          if (insertError) {
            errors.push(`Failed to create grade for student ${studentId}: ${insertError.message}`)
          } else {
            successCount++
          }
        }
      } catch (err: any) {
        errors.push(`Error processing mark: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/marks/bulk:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const { marks: marksData } = body

    if (!Array.isArray(marksData) || marksData.length === 0) {
      return NextResponse.json(
        { error: 'Marks must be a non-empty array' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    let successCount = 0
    const errors: string[] = []

    // Get all grades to get assessment info
    const gradeIds = marksData.map((m: any) => m.gradeId).filter(Boolean)
    const { data: existingGrades } = await supabase
      .from('grades')
      .select('id, assessment_id, assessments!inner(total_marks)')
      .in('id', gradeIds)

    const gradeMap: Record<string, any> = {}
    if (existingGrades) {
      existingGrades.forEach((g: any) => {
        gradeMap[g.id] = {
          assessmentId: g.assessment_id,
          totalMarks: g.assessments?.total_marks || 20,
        }
      })
    }

    // Process each mark update
    for (const markData of marksData) {
      try {
        const { gradeId, marksObtained, remarks } = markData

        if (!gradeId || marksObtained === undefined) {
          errors.push(`Missing required fields: ${JSON.stringify(markData)}`)
          continue
        }

        if (typeof marksObtained !== 'number' || marksObtained < 0 || marksObtained > 20) {
          errors.push(`Invalid mark value for grade ${gradeId}: ${marksObtained}`)
          continue
        }

        const gradeInfo = gradeMap[gradeId]
        if (!gradeInfo) {
          errors.push(`Grade not found: ${gradeId}`)
          continue
        }

        const totalMarks = gradeInfo.totalMarks
        const percentage = Math.round((marksObtained / totalMarks) * 100 * 100) / 100
        const gradeLetter = calculateGrade(marksObtained, totalMarks)
        const gradeRemarks = remarks !== undefined ? remarks : calculateRemarks(gradeLetter)

        const { error: updateError } = await supabase
          .from('grades')
          .update({
            marks_obtained: marksObtained,
            percentage,
            grade_letter: gradeLetter,
            remarks: gradeRemarks,
          })
          .eq('id', gradeId)

        if (updateError) {
          errors.push(`Failed to update grade ${gradeId}: ${updateError.message}`)
        } else {
          successCount++
        }
      } catch (err: any) {
        errors.push(`Error processing mark update: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/marks/bulk:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const { gradeIds } = body

    if (!Array.isArray(gradeIds) || gradeIds.length === 0) {
      return NextResponse.json(
        { error: 'gradeIds must be a non-empty array' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Delete grades
    const { error: deleteError, count } = await supabase
      .from('grades')
      .delete()
      .in('id', gradeIds)

    if (deleteError) {
      console.error('Error deleting grades:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete grades' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deletedCount: count || 0,
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/marks/bulk:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
