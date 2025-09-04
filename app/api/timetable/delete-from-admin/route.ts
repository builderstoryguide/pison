import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// DELETE - Delete timetable for a class from the admin classes table
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
    const adminClassId = searchParams.get('classId');
    const deletedBy = searchParams.get('deletedBy');

    if (!adminClassId) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Find the corresponding timetable class
    const { data: timetableClass, error: findError } = await supabase
      .from('timetable_classes')
      .select('id')
      .eq('class_id', adminClassId)
      .maybeSingle();

    if (findError) {
      console.error('Error finding timetable class:', findError);
      return NextResponse.json(
        { error: 'Failed to find timetable class', details: findError.message },
        { status: 500 }
      );
    }

    if (!timetableClass) {
      return NextResponse.json(
        { error: 'No timetable found for this class' },
        { status: 404 }
      );
    }

    // Delete all periods for the class
    const { error: deleteError } = await supabase
      .from('timetable_periods')
      .delete()
      .eq('class_id', timetableClass.id);

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
    console.error('Error in DELETE /api/timetable/delete-from-admin:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
