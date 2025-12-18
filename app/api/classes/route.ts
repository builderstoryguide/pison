import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export async function GET(request: NextRequest) {
  try {
    let supabase
    try {
      supabase = await createClient()
    } catch (clientError: any) {
      console.error('Failed to create Supabase client:', clientError?.message)
      return NextResponse.json(
        { ok: false, error: 'Database connection failed. Please try again.' },
        { status: 503 }
      )
    }
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const subsystem = searchParams.get('subsystem')
    const branch = searchParams.get('branch')
    const academicYear = searchParams.get('academicYear')
    const status = searchParams.get('status')

    let query = supabase
      .from('classes')
      .select('*')
      .order('class_name', { ascending: true })

    // Apply filters
    if (subsystem) {
      query = query.eq('subsystem', subsystem)
    }
    if (branch) {
      query = query.eq('stream', branch)
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }
    if (status) {
      query = query.eq('status', status)
    }

    let data, error
    try {
      const result = await query
      data = result.data
      error = result.error
    } catch (networkError: any) {
      // Handle network errors (fetch failed, timeout, etc.)
      console.error('Network error fetching classes:', networkError?.message)
      return NextResponse.json(
        { ok: false, error: 'Unable to connect to database. Please check your network connection and try again.' },
        { status: 503 }
      )
    }

    if (error) {
      // console.error('Error fetching classes:', serializeSupabaseError(error))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(error) },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json([])
    }

    // Calculate actual student counts for each class
    const classIds = data.map(cls => cls.id)
    const enrollmentCounts = new Map<string, number>()

    // Initialize all counts to 0
    classIds.forEach(id => enrollmentCounts.set(id, 0))

    // Method 1: Count from students table where class field matches
    // Fetch all active students with their class assignments
    let studentsData: any[] = []
    try {
      const { data, error } = await supabase
        .from('students')
        .select('class')
        .eq('status', 'active')
        .in('class', classIds)
      if (!error && data) {
        studentsData = data
      }
    } catch (err: any) {
      console.error('Error fetching students for enrollment count:', err)
      // Gracefully handle error - continue with empty array
    }
    // Count students per class
    if (studentsData) {
      studentsData.forEach((student: any) => {
        if (student.class && classIds.includes(student.class)) {
          const currentCount = enrollmentCounts.get(student.class) || 0
          enrollmentCounts.set(student.class, currentCount + 1)
        }
      })
    }

    // Method 2: Also check class_students junction table and use the higher count
    let junctionData: any[] = []
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select('class_id')
        .in('class_id', classIds)
      if (!error && data) {
        junctionData = data
      }
    } catch (err: any) {
      // Gracefully handle error - continue with empty array
    }

    // Count from junction table and use the maximum
    if (junctionData) {
      const junctionCounts = new Map<string, number>()
      junctionData.forEach((item: any) => {
        if (item.class_id && classIds.includes(item.class_id)) {
          const currentCount = junctionCounts.get(item.class_id) || 0
          junctionCounts.set(item.class_id, currentCount + 1)
        }
      })

      // Use the maximum count from either source
      junctionCounts.forEach((count, classId) => {
        const currentCount = enrollmentCounts.get(classId) || 0
        enrollmentCounts.set(classId, Math.max(currentCount, count))
      })
    }

    // Transform data to match the expected interface
    const transformedData = data.map(cls => ({
      id: cls.id,
      name: cls.class_name,
      level: cls.class_level,
      subsystem: cls.subsystem,
      branch: cls.stream || 'grammar',
      academicYear: cls.academic_year,
      status: cls.status,
      capacity: cls.capacity,
      currentEnrollment: enrollmentCounts.get(cls.id) || 0,
      createdAt: cls.created_at,
      updatedAt: cls.updated_at
    }))

    return NextResponse.json(transformedData)
  } catch (error: any) {
    // console.error('Error in classes GET:', serializeSupabaseError(error))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error) },
      { status: 500 }
    )
  }
}
