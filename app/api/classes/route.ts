import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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

    const { data, error } = await query

    if (error) {
      // console.error('Error fetching classes:', serializeSupabaseError(error))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(error) },
        { status: 500 }
      )
    }

    // Transform data to match the expected interface
    const transformedData = data?.map(cls => ({
      id: cls.id,
      name: cls.class_name,
      level: cls.class_level,
      subsystem: cls.subsystem,
      branch: cls.stream || 'grammar',
      academicYear: cls.academic_year,
      status: cls.status,
      capacity: cls.capacity,
      currentEnrollment: cls.current_enrollment,
      createdAt: cls.created_at,
      updatedAt: cls.updated_at
    })) || []

    return NextResponse.json(transformedData)
  } catch (error) {
    // console.error('Error in classes GET:', serializeSupabaseError(error))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error) },
      { status: 500 }
    )
  }
}
