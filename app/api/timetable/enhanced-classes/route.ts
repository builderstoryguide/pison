import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Retrieve classes with timetable data for enhanced components
export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { searchParams } = new URL(request.url);
    const subsystem = searchParams.get('subsystem');
    const branch = searchParams.get('branch');
    const academicYear = searchParams.get('academicYear') || '2024-2025';

    // First, get all admin classes
    let classQuery = supabase
      .from('classes')
      .select(`
        id,
        class_name,
        class_level,
        subsystem,
        stream,
        academic_year,
        status
      `)
      .eq('status', 'active');

    // Apply filters
    if (subsystem && subsystem !== 'all') {
      classQuery = classQuery.eq('subsystem', subsystem);
    }
    if (branch && branch !== 'all') {
      classQuery = classQuery.eq('stream', branch);
    }
    if (academicYear) {
      classQuery = classQuery.eq('academic_year', academicYear);
    }

    const { data: adminClasses, error: classError } = await classQuery;

    if (classError) {
      console.error('Error fetching classes:', classError);
      return NextResponse.json(
        { error: 'Failed to fetch classes', details: classError.message },
        { status: 500 }
      );
    }

    if (!adminClasses || adminClasses.length === 0) {
      return NextResponse.json({
        success: true,
        classes: []
      });
    }

    // For each class, get the timetable data
    const enhancedClasses = await Promise.all(
      adminClasses.map(async (adminClass) => {
        // Get timetable data from v_class_timetables view
        const { data: timetableData, error: timetableError } = await supabase
          .from('v_class_timetables')
          .select('*')
          .eq('class_id', adminClass.id);

        if (timetableError) {
          console.error(`Error fetching timetable for class ${adminClass.id}:`, timetableError);
        }

        // Transform timetable data to periods format
        const periods = (timetableData || []).map((period: any) => ({
          id: period.period_id || `${period.class_id}-${period.day_of_week}-${period.start_time}`,
          day: period.day_of_week,
          startTime: period.start_time,
          endTime: period.end_time,
          subject: period.subject_name || 'Unknown Subject',
          teacher: period.teacher_name || 'Unknown Teacher',
          room: period.room_name || 'Unknown Room',
          periodNumber: period.period_number || 1,
          periodType: period.period_type || 'regular',
          notes: period.notes || ''
        }));

        // Get status from the status table
        let status: 'not_generated' | 'generating' | 'generated' | 'modified' | 'error' = 'not_generated';
        let lastGenerated: string | undefined;
        let lastModified: string | undefined;
        let generatedBy: string | undefined;

        const { data: statusData } = await supabase
          .from('timetable_status')
          .select('status, last_modified, generated_by, last_generation_time')
          .eq('class_id', adminClass.id)
          .single();

        if (statusData) {
          status = statusData.status as any;
          lastGenerated = statusData.last_generation_time;
          lastModified = statusData.last_modified;
          generatedBy = statusData.generated_by;
        } else if (periods.length > 0) {
          // Fallback: if no status record but has periods, assume generated
          status = 'generated';
          
          // Try to get generation timestamp from timetable_generation_logs
          const { data: logData } = await supabase
            .from('timetable_generation_logs')
            .select('generated_at, completed_at, generated_by')
            .eq('class_id', adminClass.id)
            .eq('status', 'completed')
            .order('generated_at', { ascending: false })
            .limit(1)
            .single();

          if (logData) {
            lastGenerated = logData.completed_at || logData.generated_at;
            lastModified = logData.completed_at || logData.generated_at;
            generatedBy = logData.generated_by;
          }

          // Create status record for future tracking
          await supabase
            .from('timetable_status')
            .insert({
              class_id: adminClass.id,
              status: 'generated',
              total_periods: periods.length,
              last_generation_time: lastGenerated,
              generated_by: generatedBy
            })
            .single();
        }

        return {
          id: adminClass.id,
          name: adminClass.class_name,
          level: adminClass.class_level,
          subsystem: adminClass.subsystem,
          branch: adminClass.stream || 'grammar',
          academicYear: adminClass.academic_year,
          periods,
          status,
          lastGenerated,
          lastModified,
          generatedBy,
          totalPeriods: periods.length,
          term: 'first' // Default for now
        };
      })
    );

    return NextResponse.json({
      success: true,
      classes: enhancedClasses
    });

  } catch (error) {
    console.error('Error in GET /api/timetable/enhanced-classes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
