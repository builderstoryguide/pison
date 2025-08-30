import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
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

    // Apply filters
    if (assignmentId) {
      query = query.eq("assignment_id", assignmentId)
    }
    if (studentId) {
      query = query.eq("student_id", studentId)
    }
    if (teacherId) {
      query = query.eq("teacher_id", teacherId)
    }
    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching submissions:", error)
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
    }

    return NextResponse.json({ submissions: data })
  } catch (error) {
    console.error("Error in submissions GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const {
      assignment_id,
      student_id,
      teacher_id,
      submitted_text,
      submission_file_url,
      submission_file_name,
      submission_file_size,
      submission_file_type,
      status = "submitted"
    } = body

    // Generate submission ID
    const submission_id = `SUB${Date.now()}`

    // Check if submission already exists for this student and assignment
    const { data: existingSubmission } = await supabase
      .from("assignment_submissions")
      .select("id")
      .eq("assignment_id", assignment_id)
      .eq("student_id", student_id)
      .single()

    if (existingSubmission) {
      return NextResponse.json(
        { error: "Submission already exists for this assignment" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("assignment_submissions")
      .insert({
        submission_id,
        assignment_id,
        student_id,
        teacher_id,
        submitted_text,
        submission_file_url,
        submission_file_name,
        submission_file_size,
        submission_file_type,
        status
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating submission:", error)
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 })
    }

    return NextResponse.json({ submission: data }, { status: 201 })
  } catch (error) {
    console.error("Error in submissions POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 })
    }

    // If grading, update graded_at timestamp
    if (updateData.marks_obtained !== undefined) {
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
      console.error("Error updating submission:", error)
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
    }

    return NextResponse.json({ submission: data })
  } catch (error) {
    console.error("Error in submissions PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Submission ID is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("assignment_submissions")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting submission:", error)
      return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 })
    }

    return NextResponse.json({ message: "Submission deleted successfully" })
  } catch (error) {
    console.error("Error in submissions DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
