import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateUser, isAdmin } from '@/lib/auth/server'
import {
  calculateGradeFromMarks,
  getGradeRemarks,
} from '@/lib/grading-utils'

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
    
    // Prepare assessment cache to avoid repetitive DB calls
    const assessmentCache: Record<string, { id: string, total_marks: number }> = {}

    // Process each mark
    for (const markData of marksData) {
      try {
        const { 
          studentId, 
          assessmentId: providedAssessmentId, 
          marksObtained, 
          remarks,
          // New fields for implicit creation
          classId,
          subjectName,
          sequenceName
          // sequenceType removed as it was unused
        } = markData

        if (!studentId || marksObtained === undefined) {
          errors.push(`Missing required fields (studentId, marksObtained) for mark: ${JSON.stringify(markData)}`)
          continue
        }

        if (typeof marksObtained !== 'number' || marksObtained < 0 || marksObtained > 20) {
          errors.push(`Invalid mark value for student ${studentId}: ${marksObtained}`)
          continue
        }

        let assessmentId = providedAssessmentId
        let totalMarks = 20 // Default

        // If no assessmentId provided, try to find or create one from context
        if (!assessmentId) {
          if (!classId || !subjectName || !sequenceName) {
            errors.push(`Missing assessment context (classId, subjectName, sequenceName) for student ${studentId} when assessmentId is not provided`)
            continue
          }

          // Generate a cache key
          const cacheKey = `${classId}-${subjectName}-${sequenceName}`
          
          if (assessmentCache[cacheKey]) {
             assessmentId = assessmentCache[cacheKey].id
             totalMarks = assessmentCache[cacheKey].total_marks
          } else {
             // Find or create assessment
             // 1. Try to find existing
             let { data: existingAssessment } = await supabase
               .from('assessments')
               .select('id, total_marks')
               .eq('class_id', classId)
               .eq('subject', subjectName)
               .eq('title', sequenceName)
               .maybeSingle()

             // Case-insensitive fallback
             if (!existingAssessment) {
                const { data: allMatches } = await supabase
                  .from('assessments')
                  .select('id, subject, total_marks')
                  .eq('class_id', classId)
                  .eq('title', sequenceName)
                
                if (allMatches && allMatches.length > 0) {
                  const normalizedNew = subjectName.toLowerCase().trim();
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const match = allMatches.find((a: any) => 
                    a.subject && a.subject.trim().toLowerCase() === normalizedNew
                  );
                  if (match) {
                    existingAssessment = match;
                  }
                }
             }

             if (existingAssessment) {
               assessmentId = existingAssessment.id
               totalMarks = existingAssessment.total_marks || 20
             } else {
               // 2. Create new assessment
               const { data: newAssessment, error: createError } = await supabase
                .from('assessments')
                .insert({
                  title: sequenceName,
                  type: 'exam', // Default type for bulk uploads
                  subject: subjectName,
                  class_id: classId,
                  teacher_id: user.id, // Use admin ID as teacher
                  total_marks: 20,
                  status: 'published',
                  assessment_date: new Date().toISOString().split('T')[0],
                })
                .select()
                .single()
               
               if (createError) {
                 errors.push(`Failed to create assessment for ${subjectName}: ${createError.message}`)
                 continue
               }
               
               assessmentId = newAssessment.id
               totalMarks = newAssessment.total_marks || 20
             }
             
             // Update cache
             assessmentCache[cacheKey] = { id: assessmentId, total_marks: totalMarks }
          }
        } else {
          const { data: assessmentData } = await supabase
             .from('assessments')
             .select('total_marks')
             .eq('id', assessmentId)
             .single()
          
          totalMarks = assessmentData?.total_marks || 20
        }

        const percentage = Math.round((marksObtained / totalMarks) * 100 * 100) / 100
        const gradeLetter = calculateGradeFromMarks(marksObtained, totalMarks)
        const gradeRemarks = remarks || getGradeRemarks(gradeLetter)

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
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        errors.push(`Error processing mark: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gradeIds = marksData.map((m: any) => m.gradeId).filter(Boolean)
    const { data: existingGrades } = await supabase
      .from('grades')
      .select('id, assessment_id, assessments!inner(total_marks)')
      .in('id', gradeIds)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gradeMap: Record<string, any> = {}
    if (existingGrades) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        if (typeof marksObtained !== 'number' || marksObtained < 0) {
          errors.push(`Invalid mark value for grade ${gradeId}: ${marksObtained}`)
          continue
        }

        const gradeInfo = gradeMap[gradeId]
        if (!gradeInfo) {
          errors.push(`Grade not found: ${gradeId}`)
          continue
        }

        const totalMarks = gradeInfo.totalMarks
        if (marksObtained > totalMarks) {
          errors.push(`Mark ${marksObtained} exceeds total marks ${totalMarks} for grade ${gradeId}`)
          continue
        }
        const percentage = Math.round((marksObtained / totalMarks) * 100 * 100) / 100

        const gradeLetter = calculateGradeFromMarks(marksObtained, totalMarks)
        const gradeRemarks = remarks !== undefined ? remarks : getGradeRemarks(gradeLetter)

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
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        errors.push(`Error processing mark update: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
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
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line no-console
    console.error('Error in DELETE /api/admin/marks/bulk:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
