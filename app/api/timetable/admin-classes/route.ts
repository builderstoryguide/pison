import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Retrieve classes from the admin-created classes table
export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are set
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if the classes table exists
    try {
      const { error: checkError } = await supabase
        .from('classes')
        .select('id')
        .limit(1);

      if (checkError) {
        return NextResponse.json({
          error: 'Classes table not found. Please ensure the classes table is properly set up.',
          details: checkError.message
        }, { status: 500 });
      }
    } catch (dbError) {
      return NextResponse.json({
        error: 'Classes table not found. Please ensure the classes table is properly set up.',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const subsystem = searchParams.get('subsystem');
    const branch = searchParams.get('branch');
    const academicYear = searchParams.get('academicYear');

    let query = supabase
      .from('classes')
      .select(`
        id,
        class_name,
        class_level,
        subsystem,
        stream,
        academic_year,
        capacity,
        current_enrollment,
        status,
        class_teacher_id,
        teachers:class_teacher_id(
          id,
          first_name,
          last_name
        )
      `);

    // Apply filters
    if (subsystem) {
      query = query.eq('subsystem', subsystem);
    }
    if (branch) {
      query = query.eq('stream', branch);
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    // Only get active classes by default
    query = query.eq('status', 'active');

    const { data: classes, error } = await query;

    if (error) {
      console.error('Error fetching classes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch classes', details: error.message },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format for timetable management
    const transformedClasses = classes?.map(cls => ({
      id: cls.id,
      name: cls.class_name,
      level: cls.class_level,
      subsystem: cls.subsystem,
      branch: cls.stream || 'grammar',
      academicYear: cls.academic_year,
      capacity: cls.capacity,
      currentEnrollment: cls.current_enrollment,
      status: cls.status,
      classTeacher: cls.teachers && typeof cls.teachers === 'object' && 'first_name' in cls.teachers && 'last_name' in cls.teachers
        ? `${cls.teachers.first_name} ${cls.teachers.last_name}`
        : 'Not Assigned'
    })) || [];

    return NextResponse.json({
      classes: transformedClasses,
      success: true
    });

  } catch (error) {
    console.error('Error in GET /api/timetable/admin-classes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
