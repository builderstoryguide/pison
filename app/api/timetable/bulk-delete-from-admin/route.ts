import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST - Bulk delete timetables for classes from the admin classes table
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

    const body = await request.json();
    const { classIds } = body;

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return NextResponse.json(
        { error: 'Class IDs array is required' },
        { status: 400 }
      );
    }

    // Find the corresponding timetable classes
    const { data: timetableClasses, error: findError } = await supabase
      .from('timetable_classes')
      .select('id, class_id')
      .in('class_id', classIds);

    if (findError) {
      console.error('Error finding timetable classes:', findError);
      return NextResponse.json(
        { error: 'Failed to find timetable classes', details: findError.message },
        { status: 500 }
      );
    }

    if (!timetableClasses || timetableClasses.length === 0) {
      return NextResponse.json(
        { error: 'No timetables found for these classes' },
        { status: 404 }
      );
    }

    const timetableClassIds = timetableClasses.map(tc => tc.id);
    const errors: string[] = [];
    let deletedCount = 0;

    // Delete periods for each timetable class
    for (const timetableClassId of timetableClassIds) {
      try {
        const { error: deleteError } = await supabase
          .from('timetable_periods')
          .delete()
          .eq('class_id', timetableClassId);

        if (deleteError) {
          errors.push(`Failed to delete periods for class ID ${timetableClassId}: ${deleteError.message}`);
        } else {
          deletedCount++;
        }
      } catch (err) {
        errors.push(`Error deleting periods for class ID ${timetableClassId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      errors,
      message: deletedCount > 0 ? `Successfully deleted ${deletedCount} timetables` : 'No timetables were deleted'
    });

  } catch (error) {
    console.error('Error in POST /api/timetable/bulk-delete-from-admin:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
