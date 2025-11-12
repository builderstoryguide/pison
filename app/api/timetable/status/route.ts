import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// PUT - Update timetable status
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    
    const { classId, status, lastModified, generatedBy } = body;

    if (!classId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: classId, status' },
        { status: 400 }
      );
    }

    // Get or create timetable class record
    const { data: existingClass } = await supabase
      .from('timetable_classes')
      .select('id')
      .eq('class_id', classId)
      .single();

    let timetableClassId;

    if (existingClass) {
      timetableClassId = existingClass.id;
    } else {
      // Get class info from admin classes
      const { data: adminClass, error: adminClassError } = await supabase
        .from('classes')
        .select('id, class_name, class_level, subsystem, stream, academic_year')
        .eq('id', classId)
        .single();

      if (adminClassError || !adminClass) {
        return NextResponse.json(
          { error: 'Class not found', details: adminClassError?.message },
          { status: 404 }
        );
      }

      // Create timetable class
      const { data: newTimetableClass, error: createError } = await supabase
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

      if (createError || !newTimetableClass) {
        return NextResponse.json(
          { error: 'Failed to create timetable class', details: createError?.message },
          { status: 500 }
        );
      }

      timetableClassId = newTimetableClass.id;
    }

    // Update the generation log if status is related to generation
    if (['generating', 'generated', 'error'].includes(status)) {
      const logStatus = status === 'generating' ? 'started' : 
                      status === 'generated' ? 'completed' : 'failed';
      
      // Check if there's an ongoing generation log
      const { data: existingLog } = await supabase
        .from('timetable_generation_logs')
        .select('id')
        .eq('class_id', timetableClassId)
        .eq('status', 'started')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (existingLog && logStatus !== 'started') {
        // Update existing log
        await supabase
          .from('timetable_generation_logs')
          .update({
            status: logStatus,
            completed_at: new Date().toISOString(),
            ...(status === 'error' && { error_message: 'Generation failed' })
          })
          .eq('id', existingLog.id);
      } else if (logStatus === 'started') {
        // Create new generation log
        await supabase
          .from('timetable_generation_logs')
          .insert({
            class_id: timetableClassId,
            generation_type: 'manual',
            generated_by: generatedBy,
            status: 'started',
            generated_at: new Date().toISOString(),
            total_periods_generated: 0,
            conflicts_resolved: 0
          });
      }
    }

    // Store status in a custom table for better tracking
    const { error: statusError } = await supabase
      .from('timetable_status')
      .upsert({
        class_id: classId,
        timetable_class_id: timetableClassId,
        status,
        last_modified: lastModified || new Date().toISOString(),
        generated_by: generatedBy,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'class_id'
      });

    if (statusError) {
      console.error('Error updating status:', statusError);
      // Continue even if status table update fails - it's not critical
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/timetable/status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET - Get timetable status
export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json(
        { error: 'Missing required parameter: classId' },
        { status: 400 }
      );
    }

    // Get status from custom status table
    const { data: statusData, error: statusError } = await supabase
      .from('timetable_status')
      .select('*')
      .eq('class_id', classId)
      .single();

    if (statusError && statusError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to get status', details: statusError.message },
        { status: 500 }
      );
    }

    // If no status found, determine from timetable data
    if (!statusData) {
      const { data: timetableData } = await supabase
        .from('v_class_timetables')
        .select('*')
        .eq('class_id', classId)
        .limit(1);

      const status = timetableData && timetableData.length > 0 ? 'generated' : 'not_generated';

      return NextResponse.json({
        success: true,
        status: {
          class_id: classId,
          status,
          last_modified: null,
          generated_by: null,
          updated_at: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: true,
      status: statusData
    });

  } catch (error) {
    console.error('Error in GET /api/timetable/status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
