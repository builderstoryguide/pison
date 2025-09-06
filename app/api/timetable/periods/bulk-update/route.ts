import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// PUT - Bulk update periods
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    
    const { classId, updates } = body;

    if (!classId || !updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Missing required fields: classId, updates (array)' },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    const errors: string[] = [];

    // Process each update
    for (const update of updates) {
      try {
        const { periodId, updates: periodUpdates } = update;

        if (!periodId || !periodUpdates) {
          errors.push(`Invalid update data for period ${periodId}`);
          continue;
        }

        // Validate period exists
        const { data: existingPeriod, error: periodError } = await supabase
          .from('timetable_periods')
          .select('*')
          .eq('id', periodId)
          .single();

        if (periodError || !existingPeriod) {
          errors.push(`Period ${periodId} not found`);
          continue;
        }

        const updateData: any = {};

        // Handle subject update
        if (periodUpdates.subject) {
          let subjectId = null;
          const { data: existingSubject } = await supabase
            .from('timetable_subjects')
            .select('id')
            .eq('name', periodUpdates.subject)
            .single();

          if (existingSubject) {
            subjectId = existingSubject.id;
          } else {
            const { data: newSubject, error: subjectError } = await supabase
              .from('timetable_subjects')
              .insert({
                name: periodUpdates.subject,
                code: periodUpdates.subject.substring(0, 3).toUpperCase(),
                is_active: true
              })
              .select('id')
              .single();

            if (subjectError) {
              errors.push(`Failed to create subject for period ${periodId}: ${subjectError.message}`);
              continue;
            }
            subjectId = newSubject.id;
          }
          updateData.subject_id = subjectId;
        }

        // Handle teacher update
        if (periodUpdates.teacher) {
          let teacherId = null;
          const { data: existingTeacher } = await supabase
            .from('timetable_teachers')
            .select('id')
            .eq('name', periodUpdates.teacher)
            .single();

          if (existingTeacher) {
            teacherId = existingTeacher.id;
          } else {
            const { data: newTeacher, error: teacherError } = await supabase
              .from('timetable_teachers')
              .insert({
                name: periodUpdates.teacher,
                is_active: true
              })
              .select('id')
              .single();

            if (teacherError) {
              errors.push(`Failed to create teacher for period ${periodId}: ${teacherError.message}`);
              continue;
            }
            teacherId = newTeacher.id;
          }
          updateData.teacher_id = teacherId;
        }

        // Handle room update
        if (periodUpdates.room) {
          let roomId = null;
          const { data: existingRoom } = await supabase
            .from('timetable_rooms')
            .select('id')
            .eq('name', periodUpdates.room)
            .single();

          if (existingRoom) {
            roomId = existingRoom.id;
          } else {
            const { data: newRoom, error: roomError } = await supabase
              .from('timetable_rooms')
              .insert({
                name: periodUpdates.room,
                capacity: 30,
                room_type: 'Classroom',
                is_available: true
              })
              .select('id')
              .single();

            if (roomError) {
              errors.push(`Failed to create room for period ${periodId}: ${roomError.message}`);
              continue;
            }
            roomId = newRoom.id;
          }
          updateData.room_id = roomId;
        }

        // Handle time updates
        if (periodUpdates.startTime) updateData.start_time = periodUpdates.startTime;
        if (periodUpdates.endTime) updateData.end_time = periodUpdates.endTime;
        if (periodUpdates.notes !== undefined) updateData.notes = periodUpdates.notes;

        // Check for time conflicts if time is being updated
        if (periodUpdates.startTime) {
          const { data: conflicts } = await supabase
            .from('timetable_periods')
            .select('id')
            .eq('class_id', existingPeriod.class_id)
            .eq('day_of_week', existingPeriod.day_of_week)
            .eq('start_time', periodUpdates.startTime)
            .neq('id', periodId);

          if (conflicts && conflicts.length > 0) {
            errors.push(`Time conflict for period ${periodId}: Another period is already scheduled at this time`);
            continue;
          }
        }

        // Update the period
        const { error: updateError } = await supabase
          .from('timetable_periods')
          .update(updateData)
          .eq('id', periodId);

        if (updateError) {
          errors.push(`Failed to update period ${periodId}: ${updateError.message}`);
        } else {
          updatedCount++;
        }

      } catch (error) {
        errors.push(`Error processing period ${update.periodId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: updatedCount > 0,
      updatedCount,
      errors,
      message: `Successfully updated ${updatedCount} period(s)${errors.length > 0 ? ` with ${errors.length} error(s)` : ''}`
    });

  } catch (error) {
    console.error('Error in PUT /api/timetable/periods/bulk-update:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
