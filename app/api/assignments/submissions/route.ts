import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { authenticateUser, requireAnyRole } from "@/lib/auth/server"

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateUser(request)
    if (authResult.error) return authResult.error
    const user = authResult.user!

    // Only allow teachers, students, and admins
    if (user.role !== 'teacher' && user.role !== 'student' && user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized. Only teachers, students, and admins can view submissions." },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const assignmentId = searchParams.get("assignmentId")
    const studentId = searchParams.get("studentId")
    const teacherId = searchParams.get("teacherId")
    const status = searchParams.get("status")

    let query = supabase
      .from("assignment_submissions")
      .select(`
        *,
        assignments (
          id,
          assignment_id,
          title,
          subject,
          class_id,
          total_marks,
          due_date
        )
      `)
      .order("submitted_at", { ascending: false })

    // Authorization: Filter based on user role
    if (user.role === 'student') {
      // Students can only see their own submissions
      query = query.eq("student_id", user.id)
    } else if (user.role === 'teacher') {
      // Teachers can only see submissions for their assignments
      // We need to filter by assignments where teacher_id matches
      const { data: teacherAssignments } = await supabase
        .from("assignments")
        .select("id")
        .eq("teacher_id", user.id)

      if (teacherAssignments && teacherAssignments.length > 0) {
        const assignmentIds = teacherAssignments.map(a => a.id)
        query = query.in("assignment_id", assignmentIds)
      } else {
        // Teacher has no assignments, return empty
        return NextResponse.json({ submissions: [] })
      }
    }
    // Admins can see all submissions (no additional filter)

    // Apply additional filters
    if (assignmentId) {
      query = query.eq("assignment_id", assignmentId)
    }
    if (studentId && (user.role === 'admin' || user.role === 'teacher')) {
      // Only admins and teachers can filter by student_id
      query = query.eq("student_id", studentId)
    }
    if (teacherId && user.role === 'admin') {
      // Only admins can filter by teacher_id
      query = query.eq("teacher_id", teacherId)
    }
    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      // console.error("Error fetching submissions:", error)
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
    }

    return NextResponse.json({ submissions: data || [] })
  } catch (_error) {
    // console.error("Error in submissions GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require student role
    const user = await requireAnyRole(request, ['student', 'admin'])

    const supabase = await createClient()
    const body = await request.json()

    const {
      assignment_id,
      student_id, // May be provided but will be overridden for non-admins
      teacher_id,
      submitted_text,
      submission_file_url,
      submission_file_name,
      submission_file_size,
      submission_file_type,
      status = "submitted"
    } = body

    if (!assignment_id) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      )
    }

    // Verify assignment exists and get teacher_id
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select("id, teacher_id, class_id, due_date, allow_late_submission, status")
      .eq("id", assignment_id)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    // Check if assignment is published
    if (assignment.status !== 'published') {
      return NextResponse.json(
        { error: "Cannot submit to unpublished assignment" },
        { status: 400 }
      )
    }

    // For students, verify they are in the correct class
    if (user.role === 'student') {
      const { data: studentProfile } = await supabase
        .from("user_profiles")
        .select("class_name")
        .eq("user_id", user.id)
        .single()

      const { data: studentRecord } = await supabase
        .from("students")
        .select("class_id")
        .eq("user_id", user.id)
        .single()

      const studentClass = studentRecord?.class_id || studentProfile?.class_name

      if (!studentClass || studentClass !== assignment.class_id) {
        return NextResponse.json(
          { error: "Unauthorized. You can only submit assignments for your class." },
          { status: 403 }
        )
      }
    }

    // Use authenticated user's ID as student_id (unless admin creating for another student)
    const finalStudentId = (user.role === 'admin' && student_id) ? student_id : user.id
    const finalTeacherId = teacher_id || assignment.teacher_id

    // Check if submission already exists for this student and assignment
    const { data: existingSubmission } = await supabase
      .from("assignment_submissions")
      .select("id")
      .eq("assignment_id", assignment_id)
      .eq("student_id", finalStudentId)
      .single()

    if (existingSubmission) {
      return NextResponse.json(
        { error: "Submission already exists for this assignment" },
        { status: 400 }
      )
    }

    // Check if submission is late
    const isLate = new Date() > new Date(assignment.due_date)
    if (isLate && !assignment.allow_late_submission) {
      return NextResponse.json(
        { error: "Late submissions are not allowed for this assignment" },
        { status: 400 }
      )
    }

    // Generate submission ID
    const submission_id = `SUB${Date.now()}`

    const { data, error } = await supabase
      .from("assignment_submissions")
      .insert({
        submission_id,
        assignment_id,
        student_id: finalStudentId,
        teacher_id: finalTeacherId,
        submitted_text,
        submission_file_url,
        submission_file_name,
        submission_file_size,
        submission_file_type,
        is_late: isLate,
        status: isLate ? "late" : status
      })
      .select()
      .single()

    if (error) {
      // console.error("Error creating submission:", error)
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 })
    }

    return NextResponse.json({ submission: data }, { status: 201 })
  } catch (error: unknown) {
    // Handle authentication errors
    if (error instanceof NextResponse) {
      return error
    }
    // console.error("Error in submissions POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateUser(request)
    if (authResult.error) return authResult.error
    const user = authResult.user!

    // Only allow teachers, students, and admins
    if (user.role !== 'teacher' && user.role !== 'student' && user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized. Only teachers, students, and admins can update submissions." },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 })
    }

    // Get existing submission to check permissions
    const { data: existingSubmission, error: fetchError } = await supabase
      .from("assignment_submissions")
      .select("student_id, assignment_id, status, assignments!inner(teacher_id)")
      .eq("id", id)
      .single()

    if (fetchError || !existingSubmission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignment = existingSubmission.assignments as any

    // Authorization checks
    if (user.role === 'student') {
      // Students can only update their own ungraded submissions
      if (existingSubmission.student_id !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized. You can only update your own submissions." },
          { status: 403 }
        )
      }
      if (existingSubmission.status === 'graded') {
        return NextResponse.json(
          { error: "Cannot update graded submission" },
          { status: 400 }
        )
      }
      // Students cannot grade their own submissions
      if (updateData.marks_obtained !== undefined) {
        return NextResponse.json(
          { error: "Unauthorized. Students cannot grade submissions." },
          { status: 403 }
        )
      }
    } else if (user.role === 'teacher') {
      // Teachers can only grade submissions for their assignments
      if (assignment.teacher_id !== user.id) {
        return NextResponse.json(
          { error: "Unauthorized. You can only grade submissions for your assignments." },
          { status: 403 }
        )
      }
    }
    // Admins can update any submission

    // If grading, calculate percentage and grade letter, update graded_at timestamp
    if (updateData.marks_obtained !== undefined && (user.role === 'teacher' || user.role === 'admin')) {
      // Get assignment total marks
      const { data: assignmentData } = await supabase
        .from("assignments")
        .select("total_marks")
        .eq("id", existingSubmission.assignment_id)
        .single()

      if (assignmentData) {
        const percentage = (updateData.marks_obtained / assignmentData.total_marks) * 100
        updateData.percentage = Math.round(percentage * 100) / 100

        // Calculate grade letter
        let gradeLetter = 'F'
        if (percentage >= 90) gradeLetter = 'A+'
        else if (percentage >= 85) gradeLetter = 'A'
        else if (percentage >= 80) gradeLetter = 'B+'
        else if (percentage >= 75) gradeLetter = 'B'
        else if (percentage >= 70) gradeLetter = 'C+'
        else if (percentage >= 65) gradeLetter = 'C'
        else if (percentage >= 60) gradeLetter = 'D'
        else if (percentage >= 50) gradeLetter = 'D-'

        updateData.grade_letter = gradeLetter
      }

      updateData.graded_at = new Date().toISOString()
      updateData.status = "graded"
    }

    const { data, error } = await supabase
      .from("assignment_submissions")
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      // console.error("Error updating submission:", error)
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
    }

    return NextResponse.json({ submission: data })
  } catch (error: unknown) {
    // Handle authentication errors
    if (error instanceof NextResponse) {
      return error
    }
    // console.error("Error in submissions PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require teacher or admin role
    const user = await requireAnyRole(request, ['teacher', 'admin'])

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 })
    }

    // Get existing submission to check permissions
    const { data: existingSubmission, error: fetchError } = await supabase
      .from("assignment_submissions")
      .select("assignment_id, assignments!inner(teacher_id)")
      .eq("id", id)
      .single()

    if (fetchError || !existingSubmission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignment = existingSubmission.assignments as any

    // Authorization: Teachers can only delete submissions for their assignments (unless admin)
    if (user.role !== 'admin' && assignment.teacher_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized. You can only delete submissions for your assignments." },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from("assignment_submissions")
      .delete()
      .eq("id", id)

    if (error) {
      // console.error("Error deleting submission:", error)
      return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 })
    }

    return NextResponse.json({ message: "Submission deleted successfully" })
  } catch (error: unknown) {
    // Handle authentication errors
    if (error instanceof NextResponse) {
      return error
    }
    // console.error("Error in submissions DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
