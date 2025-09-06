import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// PUT - Update a period
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ periodId: string }> }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { periodId } = await params;
    const body = await request.json();

    // Validate period exists
    const { data: existingPeriod, error: periodError } = await supabase
      .from('timetable_periods')
      .select('*')
      .eq('id', periodId)
      .single();

    if (periodError || !existingPeriod) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Handle subject update
    if (body.subject) {
      let subjectId = null;
      const { data: existingSubject } = await supabase
        .from('timetable_subjects')
        .select('id')
        .eq('name', body.subject)
        .single();

      if (existingSubject) {
        subjectId = existingSubject.id;
      } else {
        const { data: newSubject, error: subjectError } = await supabase
          .from('timetable_subjects')
          .insert({
            name: body.subject,
            code: body.subject.substring(0, 3).toUpperCase(),
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
      updateData.subject_id = subjectId;
    }

    // Handle teacher update
    if (body.teacher) {
      let teacherId = null;
      const { data: existingTeacher } = await supabase
        .from('timetable_teachers')
        .select('id')
        .eq('name', body.teacher)
        .single();

      if (existingTeacher) {
        teacherId = existingTeacher.id;
      } else {
        const { data: newTeacher, error: teacherError } = await supabase
          .from('timetable_teachers')
          .insert({
            name: body.teacher,
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
      updateData.teacher_id = teacherId;
    }

    // Handle room update
    if (body.room) {
      let roomId = null;
      const { data: existingRoom } = await supabase
        .from('timetable_rooms')
        .select('id')
        .eq('name', body.room)
        .single();

      if (existingRoom) {
        roomId = existingRoom.id;
      } else {
        const { data: newRoom, error: roomError } = await supabase
          .from('timetable_rooms')
          .insert({
            name: body.room,
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
      updateData.room_id = roomId;
    }

    // Handle time updates
    if (body.startTime) updateData.start_time = body.startTime;
    if (body.endTime) updateData.end_time = body.endTime;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Check for time conflicts if time is being updated
    if (body.startTime) {
      const { data: conflicts } = await supabase
        .from('timetable_periods')
        .select('id')
        .eq('class_id', existingPeriod.class_id)
        .eq('day_of_week', existingPeriod.day_of_week)
        .eq('start_time', body.startTime)
        .neq('id', periodId);

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { error: 'Time conflict: Another period is already scheduled at this time' },
          { status: 409 }
        );
      }
    }

    // Update the period
    const { error: updateError } = await supabase
      .from('timetable_periods')
      .update(updateData)
      .eq('id', periodId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update period', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Period updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/timetable/periods/[periodId]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a period
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ periodId: string }> }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { periodId } = await params;

    // Validate period exists
    const { data: existingPeriod, error: periodError } = await supabase
      .from('timetable_periods')
      .select('id')
      .eq('id', periodId)
      .single();

    if (periodError || !existingPeriod) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      );
    }

    // Delete the period
    const { error: deleteError } = await supabase
      .from('timetable_periods')
      .delete()
      .eq('id', periodId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete period', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Period deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/timetable/periods/[periodId]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
