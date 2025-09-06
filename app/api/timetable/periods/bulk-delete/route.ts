import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// DELETE - Bulk delete periods
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    
    const { classId, periodIds } = body;

    if (!classId || !periodIds || !Array.isArray(periodIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: classId, periodIds (array)' },
        { status: 400 }
      );
    }

    if (periodIds.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'No periods to delete'
      });
    }

    // Validate all periods exist and belong to the class
    const { data: existingPeriods, error: periodsError } = await supabase
      .from('timetable_periods')
      .select('id, class_id')
      .in('id', periodIds);

    if (periodsError) {
      return NextResponse.json(
        { error: 'Failed to validate periods', details: periodsError.message },
        { status: 500 }
      );
    }

    // Get the timetable class ID
    const { data: timetableClass, error: classError } = await supabase
      .from('timetable_classes')
      .select('id')
      .eq('class_id', classId)
      .single();

    if (classError || !timetableClass) {
      return NextResponse.json(
        { error: 'Timetable class not found', details: classError?.message },
        { status: 404 }
      );
    }

    // Filter periods that actually exist and belong to the class
    const validPeriodIds = existingPeriods
      .filter(period => period.class_id === timetableClass.id)
      .map(period => period.id);

    if (validPeriodIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid periods found to delete' },
        { status: 404 }
      );
    }

    // Delete the periods
    const { error: deleteError } = await supabase
      .from('timetable_periods')
      .delete()
      .in('id', validPeriodIds);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete periods', details: deleteError.message },
        { status: 500 }
      );
    }

    const invalidCount = periodIds.length - validPeriodIds.length;

    return NextResponse.json({
      success: true,
      deletedCount: validPeriodIds.length,
      invalidCount,
      message: `Successfully deleted ${validPeriodIds.length} period(s)${invalidCount > 0 ? ` (${invalidCount} invalid period(s) skipped)` : ''}`
    });

  } catch (error) {
    console.error('Error in DELETE /api/timetable/periods/bulk-delete:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
