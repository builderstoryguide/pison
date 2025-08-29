import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Retrieve timetables with optional filtering
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
    const classId = searchParams.get('classId');
    const subsystem = searchParams.get('subsystem');
    const branch = searchParams.get('branch');
    const academicYear = searchParams.get('academicYear') || '2024-2025';

    let query = supabase
      .from('v_class_timetables')
      .select('*');

    // Apply filters
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (subsystem) {
      query = query.eq('subsystem', subsystem);
    }
    if (branch) {
      query = query.eq('branch', branch);
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }

    const { data: timetables, error } = await query;

    if (error) {
      console.error('Error fetching timetables:', error);
      return NextResponse.json(
        { error: 'Failed to fetch timetables', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      timetables: timetables || [],
      success: true
    });

  } catch (error) {
    console.error('Error in GET /api/timetable:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Generate timetable for a class
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
    const { classId, academicYear, term, generatedBy } = body;

    if (!classId || !academicYear || !term) {
      return NextResponse.json(
        { error: 'Class ID, academic year, and term are required' },
        { status: 400 }
      );
    }

    // Check if class exists
    const { data: classData, error: classError } = await supabase
      .from('timetable_classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Class not found', details: classError?.message },
        { status: 404 }
      );
    }

    // Generate timetable using the database function
    const { data: scheduleId, error: generationError } = await supabase
      .rpc('generate_class_timetable', {
        p_class_id: classId,
        p_academic_year: academicYear,
        p_term: term,
        p_generated_by: generatedBy || 'system'
      });

    if (generationError) {
      console.error('Error generating timetable:', generationError);
      return NextResponse.json(
        { error: 'Failed to generate timetable', details: generationError.message },
        { status: 500 }
      );
    }

    // Fetch the generated timetable
    const { data: generatedTimetable, error: fetchError } = await supabase
      .from('v_class_timetables')
      .select('*')
      .eq('class_id', classId);

    if (fetchError) {
      console.error('Error fetching generated timetable:', fetchError);
    }

    return NextResponse.json({
      success: true,
      scheduleId,
      timetable: generatedTimetable || [],
      message: 'Timetable generated successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/timetable:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete timetable for a class
export async function DELETE(request: NextRequest) {
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
        .from('timetable_periods')
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
    const classId = searchParams.get('classId');
    const deletedBy = searchParams.get('deletedBy');

    if (!classId) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Delete all periods for the class
    const { error: deleteError } = await supabase
      .from('timetable_periods')
      .delete()
      .eq('class_id', classId);

    if (deleteError) {
      console.error('Error deleting timetable:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete timetable', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Timetable deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/timetable:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
