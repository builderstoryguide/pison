import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST - Create a new period
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    
    const {
      classId,
      day,
      startTime,
      endTime,
      subject,
      teacher,
      room,
      periodNumber,
      periodType = 'regular',
      notes
    } = body;

    // Validate required fields
    if (!classId || !day || !startTime || !endTime || !subject || !teacher || !room) {
      return NextResponse.json(
        { error: 'Missing required fields: classId, day, startTime, endTime, subject, teacher, room' },
        { status: 400 }
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

    // Get or create schedule
    let scheduleId = null;
    const { data: existingSchedule } = await supabase
      .from('timetable_schedules')
      .select('id')
      .eq('academic_year', '2024-2025')
      .eq('term', 'first')
      .single();

    if (existingSchedule) {
      scheduleId = existingSchedule.id;
    } else {
      const { data: newSchedule, error: scheduleError } = await supabase
        .from('timetable_schedules')
        .insert({
          name: 'Schedule for 2024-2025 - First Term',
          academic_year: '2024-2025',
          term: 'first',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_active: true
        })
        .select('id')
        .single();

      if (scheduleError) {
        return NextResponse.json(
          { error: 'Failed to create schedule', details: scheduleError.message },
          { status: 500 }
        );
      }
      scheduleId = newSchedule.id;
    }

    // Check for time conflicts
    const { data: conflicts } = await supabase
      .from('timetable_periods')
      .select('id')
      .eq('class_id', timetableClass.id)
      .eq('day_of_week', day)
      .eq('start_time', startTime);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Time conflict: Another period is already scheduled at this time' },
        { status: 409 }
      );
    }

    // Get teacher and subject IDs (create if not exist)
    let teacherId = null;
    const { data: existingTeacher } = await supabase
      .from('timetable_teachers')
      .select('id')
      .eq('name', teacher)
      .single();

    if (existingTeacher) {
      teacherId = existingTeacher.id;
    } else {
      const { data: newTeacher, error: teacherError } = await supabase
        .from('timetable_teachers')
        .insert({
          name: teacher,
          is_active: true
        })
        .select('id')
        .single();

      if (teacherError) {
        return NextResponse.json(
          { error: 'Failed to create teacher', details: teacherError.message },
          { status: 500 }
        );
      }
      teacherId = newTeacher.id;
    }

    let subjectId = null;
    const { data: existingSubject } = await supabase
      .from('timetable_subjects')
      .select('id')
      .eq('name', subject)
      .single();

    if (existingSubject) {
      subjectId = existingSubject.id;
    } else {
      const { data: newSubject, error: subjectError } = await supabase
        .from('timetable_subjects')
        .insert({
          name: subject,
          code: subject.substring(0, 3).toUpperCase(),
          is_active: true
        })
        .select('id')
        .single();

      if (subjectError) {
        return NextResponse.json(
          { error: 'Failed to create subject', details: subjectError.message },
          { status: 500 }
        );
      }
      subjectId = newSubject.id;
    }

    let roomId = null;
    const { data: existingRoom } = await supabase
      .from('timetable_rooms')
      .select('id')
      .eq('name', room)
      .single();

    if (existingRoom) {
      roomId = existingRoom.id;
    } else {
      const { data: newRoom, error: roomError } = await supabase
        .from('timetable_rooms')
        .insert({
          name: room,
          capacity: 30,
          room_type: 'Classroom',
          is_available: true
        })
        .select('id')
        .single();

      if (roomError) {
        return NextResponse.json(
          { error: 'Failed to create room', details: roomError.message },
          { status: 500 }
        );
      }
      roomId = newRoom.id;
    }

    // Create the period
    const { data: newPeriod, error: periodError } = await supabase
      .from('timetable_periods')
      .insert({
        schedule_id: scheduleId,
        class_id: timetableClass.id,
        subject_id: subjectId,
        teacher_id: teacherId,
        room_id: roomId,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        period_number: periodNumber || 1,
        period_type: periodType,
        is_break: periodType !== 'regular',
        notes: notes
      })
      .select('id')
      .single();

    if (periodError) {
      return NextResponse.json(
        { error: 'Failed to create period', details: periodError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      periodId: newPeriod.id,
      message: 'Period created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/timetable/periods:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
