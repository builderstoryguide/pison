import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const classId = searchParams.get("classId")
    const subject = searchParams.get("subject")
    const status = searchParams.get("status")
    const teacherId = searchParams.get("teacherId")
    const studentId = searchParams.get("studentId")

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

    // Apply filters
    if (classId) {
      query = query.eq("class_id", classId)
    }
    if (subject) {
      query = query.eq("subject", subject)
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (teacherId) {
      query = query.eq("teacher_id", teacherId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching assignments:", error)
      return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
    }

    // If studentId is provided, filter assignments to show only those relevant to the student
    if (studentId) {
      // This would typically involve checking if the student is in the class
      // For now, we'll return all assignments
      return NextResponse.json({ assignments: data })
    }

    return NextResponse.json({ assignments: data })
  } catch (error) {
    console.error("Error in assignments GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const {
      title,
      description,
      subject,
      class_id,
      teacher_id,
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

    // Generate assignment ID
    const assignment_id = `ASS${Date.now()}`

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        assignment_id,
        title,
        description,
        subject,
        class_id,
        teacher_id,
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
  } catch (error) {
    console.error("Error in assignments POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("assignments")
      .update({
        ...updateData,
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
  } catch (error) {
    console.error("Error in assignments PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
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
  } catch (error) {
    console.error("Error in assignments DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
