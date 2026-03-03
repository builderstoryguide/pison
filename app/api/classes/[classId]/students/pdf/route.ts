import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { classListPdfGenerator, type ClassListInfo, type ClassListStudent } from "@/lib/class-list-pdf-generator"
import { fetchParentsForStudents, getParentInfoForStudent } from "@/lib/utils/parent-data-fetcher"

type StudentRecord = {
  id: string
  student_id: string | null
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  place_of_birth: string | null
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function stripCameroonPrefix(phone: string | undefined): string | undefined {
  if (!phone) return undefined
  return phone.replace(/^\+237\s*/, "")
}

function normalizeStudent(student: StudentRecord): ClassListStudent {
  return {
    id: student.id,
    studentId: student.student_id || "N/A",
    firstName: student.first_name || "",
    lastName: student.last_name || "",
    dateOfBirth: student.date_of_birth,
    placeOfBirth: student.place_of_birth,
    parentGuardianContact: null,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> },
) {
  try {
    const { classId } = await params
    if (!classId || !classId.trim()) {
      return NextResponse.json({ error: "Invalid class ID" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const requestOrigin = new URL(request.url).origin

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, class_name, class_level, academic_year, subsystem, stream, name, level, section")
      .eq("id", classId)
      .maybeSingle()

    if (classError) {
      console.error("Error loading class for PDF export:", classError)
      return NextResponse.json({ error: "Failed to load class information" }, { status: 500 })
    }

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const { data: appConfig } = await supabase
      .from("app_configuration")
      .select("school_name, school_logo_url")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const [studentsByClassIdResult, studentsByClassColumnResult, classStudentsJunctionResult] = await Promise.all([
      supabase
        .from("students")
        .select("id, student_id, first_name, last_name, date_of_birth, place_of_birth")
        .eq("class_id", classId)
        .eq("status", "active"),
      supabase
        .from("students")
        .select("id, student_id, first_name, last_name, date_of_birth, place_of_birth")
        .eq("class", classId)
        .eq("status", "active"),
      supabase
        .from("class_students")
        .select(
          `
            class_id,
            students (
              id,
              student_id,
              first_name,
              last_name,
              date_of_birth,
              place_of_birth
            )
          `,
        )
        .eq("class_id", classId),
    ])

    const studentMap = new Map<string, ClassListStudent>()
    const appendStudent = (student: StudentRecord | null | undefined) => {
      if (!student?.id || studentMap.has(student.id)) {
        return
      }
      studentMap.set(student.id, normalizeStudent(student))
    }

    ;(studentsByClassIdResult.data || []).forEach((student: any) => appendStudent(student))
    ;(studentsByClassColumnResult.data || []).forEach((student: any) => appendStudent(student))
    ;(classStudentsJunctionResult.data || []).forEach((junction: any) =>
      appendStudent(junction?.students || null),
    )

    const students = Array.from(studentMap.values())
    const parentLookup = await fetchParentsForStudents(
      supabase,
      students.map((student) => student.studentId).filter((studentId) => studentId && studentId !== "N/A"),
    )

    const enrichedStudents = students.map((student) => {
      const parentInfo = getParentInfoForStudent(student.studentId, parentLookup)
      const formattedPhone = stripCameroonPrefix(parentInfo.parentPhone)
      const contactParts = [parentInfo.parentName, formattedPhone || parentInfo.parentEmail].filter(Boolean)
      return {
        ...student,
        parentGuardianContact: contactParts.length > 0 ? contactParts.join(" - ") : "N/A",
      }
    })

    const sortedStudents = enrichedStudents.sort((a, b) => {
      const lastNameCompare = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" })
      if (lastNameCompare !== 0) return lastNameCompare
      return a.firstName.localeCompare(b.firstName, undefined, { sensitivity: "base" })
    })

    const resolvedLogoUrl = (() => {
      const logoUrl = appConfig?.school_logo_url || process.env.NEXT_PUBLIC_SCHOOL_LOGO || null
      if (!logoUrl) return null
      if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) return logoUrl
      if (logoUrl.startsWith("/")) return `${requestOrigin}${logoUrl}`
      return logoUrl
    })()

    const classInfo: ClassListInfo = {
      id: classData.id,
      name: classData.class_name || classData.name || `Class ${classId}`,
      schoolName: appConfig?.school_name || process.env.NEXT_PUBLIC_SCHOOL_NAME || "Pison Academy",
      schoolLogoUrl: resolvedLogoUrl,
      level: classData.class_level || classData.level || null,
      academicYear: classData.academic_year || null,
      subsystem: classData.subsystem || null,
      branch: classData.stream || classData.section || null,
    }

    const documentResult = await classListPdfGenerator.generateClassListDocument(classInfo, sortedStudents)
    const dateStamp = new Date().toISOString().split("T")[0]
    const fileName = `class-list-${toSlug(classInfo.name) || classId}-${dateStamp}.${documentResult.extension}`

    return new NextResponse(new Uint8Array(documentResult.buffer), {
      headers: {
        "Content-Type": documentResult.contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": documentResult.buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error generating class list export:", error)
    return NextResponse.json(
      {
        error: "Failed to generate class list export",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
