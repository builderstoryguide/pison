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
        { error: "Unauthorized. Only teachers, students, and admins can view assignments." },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const classId = searchParams.get("classId")
    const subject = searchParams.get("subject")
    const status = searchParams.get("status")
    const teacherId = searchParams.get("teacherId")

    let query = supabase
      .from("assignments")
      .select(`
        *,
        assignment_submissions (
          id,
          submission_id,
          student_id,
          submitted_at,
          status,
          marks_obtained,
          percentage,
          grade_letter
        )
      `)
      .order("created_at", { ascending: false })

    // Authorization: Teachers see their own assignments, students see published assignments for their class, admins see all
    if (user.role === 'teacher') {
      // Teachers can only see their own assignments
      query = query.eq("teacher_id", user.id)
    } else if (user.role === 'student') {
      // Students can only see published assignments for their class
      query = query.eq("status", "published")
      
      // Get student's class
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

      if (studentClass) {
        query = query.eq("class_id", studentClass)
      } else {
        // If student has no class, return empty array
        return NextResponse.json({ assignments: [] })
      }
    }

    // Apply additional filters
    if (classId) {
      query = query.eq("class_id", classId)
    }
    if (subject) {
      query = query.eq("subject", subject)
    }
    if (status && user.role === 'teacher') {
      // Only teachers can filter by status (students only see published)
      query = query.eq("status", status)
    }
    if (teacherId && user.role === 'admin') {
      // Only admins can filter by teacher_id
      query = query.eq("teacher_id", teacherId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching assignments:", error)
      return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
    }

    return NextResponse.json({ assignments: data || [] })
  } catch (error) {
    console.error("Error in assignments GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require teacher role
    const user = await requireAnyRole(request, ['teacher', 'admin'])

    const supabase = await createClient()
    const body = await request.json()

    const {
      title,
      description,
      subject,
      class_id,
      teacher_id, // May be provided but will be overridden
      total_marks,
      passing_marks,
      weight_percentage,
      assignment_file_url,
      assignment_file_name,
      assignment_file_size,
      assignment_file_type,
      assigned_date,
      due_date,
      instructions,
      submission_type,
      allow_late_submission,
      late_penalty_percentage,
      status = "draft"
    } = body

    // Validate required fields
    if (!title || !subject || !class_id || !total_marks || !due_date) {
      return NextResponse.json(
        { error: "Missing required fields: title, subject, class_id, total_marks, due_date" },
        { status: 400 }
      )
    }

    // Generate assignment ID
    const assignment_id = `ASS${Date.now()}`

    // Use authenticated user's ID as teacher_id (unless admin creating for another teacher)
    const finalTeacherId = (user.role === 'admin' && teacher_id) ? teacher_id : user.id

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        assignment_id,
        title,
        description,
        subject,
        class_id,
        teacher_id: finalTeacherId,
        total_marks,
        passing_marks,
        weight_percentage,
        assignment_file_url,
        assignment_file_name,
        assignment_file_size,
        assignment_file_type,
        assigned_date,
        due_date,
        instructions,
        submission_type,
        allow_late_submission,
        late_penalty_percentage,
        status
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating assignment:", error)
      return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
    }

    return NextResponse.json({ assignment: data }, { status: 201 })
  } catch (error: any) {
    // Handle authentication errors
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error in assignments POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require teacher role
    const user = await requireAnyRole(request, ['teacher', 'admin'])

    const supabase = await createClient()
    const body = await request.json()
    const { id, teacher_id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
    }

    // Check if assignment exists and user has permission to update it
    const { data: existingAssignment, error: fetchError } = await supabase
      .from("assignments")
      .select("teacher_id")
      .eq("id", id)
      .single()

    if (fetchError || !existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Authorization: Teachers can only update their own assignments (unless admin)
    if (user.role !== 'admin' && existingAssignment.teacher_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized. You can only update your own assignments." },
        { status: 403 }
      )
    }

    // Prevent changing teacher_id unless admin
    if (teacher_id && user.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can change assignment ownership." },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from("assignments")
      .update({
        ...updateData,
        ...(user.role === 'admin' && teacher_id ? { teacher_id } : {}),
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating assignment:", error)
      return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 })
    }

    return NextResponse.json({ assignment: data })
  } catch (error: any) {
    // Handle authentication errors
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error in assignments PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Require teacher role
    const user = await requireAnyRole(request, ['teacher', 'admin'])

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
    }

    // Check if assignment exists and user has permission to delete it
    const { data: existingAssignment, error: fetchError } = await supabase
      .from("assignments")
      .select("teacher_id")
      .eq("id", id)
      .single()

    if (fetchError || !existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Authorization: Teachers can only delete their own assignments (unless admin)
    if (user.role !== 'admin' && existingAssignment.teacher_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized. You can only delete your own assignments." },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting assignment:", error)
      return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 })
    }

    return NextResponse.json({ message: "Assignment deleted successfully" })
  } catch (error: any) {
    // Handle authentication errors
    if (error instanceof NextResponse) {
      return error
    }
    console.error("Error in assignments DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
