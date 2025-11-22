import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch the assessment to get subject info
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('subject, class_id')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Fetch subject to get coefficient
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('coefficient')
      .eq('name', assessment.subject)
      .single()

    const coefficient = subjectData?.coefficient ? parseFloat(subjectData.coefficient) : 1

    // Fetch all grades for this assessment with student info
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select(`
        id,
        student_id,
        marks_obtained,
        percentage,
        grade_letter,
        remarks,
        students!inner(
          first_name,
          last_name
        )
      `)
      .eq('assessment_id', assessmentId)
      .order('students(last_name)', { ascending: true })

    if (gradesError) {
      console.error('Error fetching grades:', gradesError)
      throw gradesError
    }

    // Transform and calculate ranks
    const gradesWithNames = grades?.map((g: any) => ({
      id: g.id,
      student_id: g.student_id,
      student_name: `${g.students.first_name} ${g.students.last_name}`,
      marks_obtained: g.marks_obtained,
      percentage: g.percentage,
      grade_letter: g.grade_letter,
      remarks: g.remarks
    })) || []

    // Calculate ranks
    const sortedForRanking = [...gradesWithNames].sort((a, b) => b.marks_obtained - a.marks_obtained)
    let currentRank = 1
    const gradesWithRanks = gradesWithNames.map(grade => {
      const rankIndex = sortedForRanking.findIndex(g => g.id === grade.id)
      if (rankIndex > 0 && sortedForRanking[rankIndex].marks_obtained < sortedForRanking[rankIndex - 1].marks_obtained) {
        currentRank = rankIndex + 1
      }
      return {
        ...grade,
        rank: currentRank
      }
    })

    return NextResponse.json({
      success: true,
      coefficient,
      grades: gradesWithRanks
    })

  } catch (error: any) {
    console.error('Error in GET /api/grades/[assessmentId]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params
    const body = await request.json()
    const { grades } = body

    if (!assessmentId || !grades || !Array.isArray(grades)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = await createClient()

    // Update each grade
    const updatePromises = grades.map(async (grade: any) => {
      const { error } = await supabase
        .from('grades')
        .update({
          marks_obtained: grade.marks,
          percentage: (grade.marks / 20) * 100,
          grade_letter: grade.grade,
          remarks: grade.remarks
        })
        .eq('id', grade.id)
        .eq('assessment_id', assessmentId)

      if (error) throw error
    })

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error in PUT /api/grades/[assessmentId]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Delete all grades for this assessment (cascade will handle this, but being explicit)
    const { error: gradesError } = await supabase
      .from('grades')
      .delete()
      .eq('assessment_id', assessmentId)

    if (gradesError) throw gradesError

    // Delete the assessment
    const { error: assessmentError } = await supabase
      .from('assessments')
      .delete()
      .eq('id', assessmentId)

    if (assessmentError) throw assessmentError

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error in DELETE /api/grades/[assessmentId]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

