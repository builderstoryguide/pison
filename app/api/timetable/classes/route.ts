import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Retrieve classes for timetable management
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

    // Check if the timetable tables exist
    try {
      const { error: checkError } = await supabase
        .from('timetable_classes')
        .select('id')
        .limit(1);

      if (checkError) {
        return NextResponse.json({
          error: 'Database not set up. Please run the timetable database setup script first.',
          details: checkError.message
        }, { status: 500 });
      }
    } catch (dbError) {
      return NextResponse.json({
        error: 'Database not set up. Please run the timetable database setup script first.',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const subsystem = searchParams.get('subsystem');
    const branch = searchParams.get('branch');
    const academicYear = searchParams.get('academicYear') || '2024-2025';

    let query = supabase
      .from('timetable_classes')
      .select('*')
      .eq('is_active', true);

    // Apply filters
    if (subsystem) {
      query = query.eq('subsystem', subsystem);
    }
    if (branch) {
      query = query.eq('branch', branch);
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    const { data: classes, error } = await query;

    if (error) {
      console.error('Error fetching classes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch classes', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      classes: classes || [],
      success: true
    });

  } catch (error) {
    console.error('Error in GET /api/timetable/classes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create a new class for timetable management
export async function POST(request: NextRequest) {
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

    // Check if the timetable tables exist
    try {
      const { error: checkError } = await supabase
        .from('timetable_classes')
        .select('id')
        .limit(1);

      if (checkError) {
        return NextResponse.json({
          error: 'Database not set up. Please run the timetable database setup script first.',
          details: checkError.message
        }, { status: 500 });
      }
    } catch (dbError) {
      return NextResponse.json({
        error: 'Database not set up. Please run the timetable database setup script first.',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }

    const body = await request.json();
    const {
      classId,
      name,
      level,
      subsystem,
      branch,
      academicYear,
      createdBy
    } = body;

    if (!name || !level || !subsystem || !branch || !academicYear) {
      return NextResponse.json(
        { error: 'Name, level, subsystem, branch, and academic year are required' },
        { status: 400 }
      );
    }

    const { data: newClass, error } = await supabase
      .from('timetable_classes')
      .insert({
        class_id: classId,
        name,
        level,
        subsystem,
        branch,
        academic_year: academicYear,
        created_by: createdBy
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating class:', error);
      return NextResponse.json(
        { error: 'Failed to create class', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      class: newClass,
      message: 'Class created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/timetable/classes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
