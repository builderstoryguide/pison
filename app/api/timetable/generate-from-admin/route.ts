import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST - Generate timetable for a class from the admin classes table
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
      academicYear, 
      term, 
      generatedBy,
      // Custom timetable generation parameters
      schoolStartTime,
      schoolEndTime,
      periodDuration,
      breakDuration,
      includeLunchBreak,
      lunchBreakStartTime,
      lunchBreakDuration,
      daysPerWeek,
      periodsPerDay,
      customPeriodsPerDay,
      mondayPeriods,
      tuesdayPeriods,
      wednesdayPeriods,
      thursdayPeriods,
      fridayPeriods,
      saturdayPeriods
    } = body;

    if (!classId || !academicYear || !term) {
      return NextResponse.json(
        { error: 'Class ID, academic year, and term are required' },
        { status: 400 }
      );
    }

    // Get the class info from the admin classes table
    const { data: adminClass, error: adminClassError } = await supabase
      .from('classes')
      .select('id, class_name, class_level, subsystem, stream, academic_year')
      .eq('id', classId)
      .single();

    if (adminClassError || !adminClass) {
      return NextResponse.json(
        { error: 'Admin class not found', details: adminClassError?.message },
        { status: 404 }
      );
    }

    // Check if a timetable class already exists for this admin class
    const { data: existingTimetableClass, error: existingClassError } = await supabase
      .from('timetable_classes')
      .select('id')
      .eq('class_id', adminClass.id)
      .maybeSingle();

    let timetableClassId;

    if (existingTimetableClass) {
      // Use the existing timetable class
      timetableClassId = existingTimetableClass.id;
    } else {
      // Create a new timetable class based on the admin class
      const { data: newTimetableClass, error: createClassError } = await supabase
        .from('timetable_classes')
        .insert({
          class_id: adminClass.id,
          name: adminClass.class_name,
          level: adminClass.class_level,
          subsystem: adminClass.subsystem,
          branch: adminClass.stream || 'grammar',
          academic_year: adminClass.academic_year,
          is_active: true
        })
        .select('id')
        .single();

      if (createClassError || !newTimetableClass) {
        return NextResponse.json(
          { error: 'Failed to create timetable class', details: createClassError?.message },
          { status: 500 }
        );
      }

      timetableClassId = newTimetableClass.id;
    }

    // Get a valid user ID for the generated_by parameter
    let generatedByUserId = null;
    if (generatedBy && generatedBy !== 'system' && generatedBy !== 'admin') {
      // If generatedBy is a UUID, use it directly
      generatedByUserId = generatedBy;
    } else {
      // Get the first admin user as a fallback
      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();
      
      if (adminUser) {
        generatedByUserId = adminUser.id;
      }
    }

    // Generate timetable using the database function with custom parameters
    const generationParams: Record<string, any> = {
      p_class_id: timetableClassId,
      p_academic_year: academicYear,
      p_term: term,
      p_generated_by: generatedByUserId
    };
    
    // Add custom parameters if provided
    if (schoolStartTime) generationParams.p_school_start_time = schoolStartTime;
    if (schoolEndTime) generationParams.p_school_end_time = schoolEndTime;
    if (periodDuration) generationParams.p_period_duration = periodDuration;
    if (breakDuration) generationParams.p_break_duration = breakDuration;
    if (includeLunchBreak !== undefined) generationParams.p_include_lunch_break = includeLunchBreak;
    if (lunchBreakStartTime) generationParams.p_lunch_break_start_time = lunchBreakStartTime;
    if (lunchBreakDuration) generationParams.p_lunch_break_duration = lunchBreakDuration;
    if (daysPerWeek) generationParams.p_days_per_week = daysPerWeek;
    if (periodsPerDay) generationParams.p_periods_per_day = periodsPerDay;
    if (customPeriodsPerDay !== undefined) generationParams.p_custom_periods_per_day = customPeriodsPerDay;
    if (mondayPeriods) generationParams.p_monday_periods = mondayPeriods;
    if (tuesdayPeriods) generationParams.p_tuesday_periods = tuesdayPeriods;
    if (wednesdayPeriods) generationParams.p_wednesday_periods = wednesdayPeriods;
    if (thursdayPeriods) generationParams.p_thursday_periods = thursdayPeriods;
    if (fridayPeriods) generationParams.p_friday_periods = fridayPeriods;
    if (saturdayPeriods) generationParams.p_saturday_periods = saturdayPeriods;
    
    const { data: scheduleId, error: generationError } = await supabase
      .rpc('generate_class_timetable', generationParams);

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
      .eq('class_id', timetableClassId);

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
    console.error('Error in POST /api/timetable/generate-from-admin:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
