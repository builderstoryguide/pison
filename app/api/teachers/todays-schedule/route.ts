import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/database-utils'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          schedule: []
        },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase client not available',
          schedule: []
        },
        { status: 500 }
      )
    }

    // Get teacher ID from query parameters
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Teacher ID is required',
          schedule: []
        },
        { status: 400 }
      )
    }

    // Get today's day of the week
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

    // Fetch today's schedule for the teacher
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('timetable_periods')
      .select(`
        id,
        day_of_week,
        start_time,
        end_time,
        subject,
        room,
        period_number,
        class_id,
        classes:class_id(
          id,
          class_name,
          class_level,
          stream,
          subsystem
        )
      `)
      .eq('teacher_id', teacherId)
      .eq('day_of_week', today)
      .eq('is_active', true)
      .order('start_time', { ascending: true })

    if (scheduleError) {
      console.error('Error fetching today\'s schedule:', scheduleError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch today\'s schedule',
          schedule: []
        },
        { status: 500 }
      )
    }

      // Transform the data to match the expected format
      const schedule = scheduleData?.map(period => ({
        id: period.id,
        day: period.day_of_week,
        startTime: period.start_time,
        endTime: period.end_time,
        subject: period.subject,
        period: `Period ${period.period_number}`,
        room: period.room,
        classId: period.class_id,
        className: (period.classes as any)?.class_name || 'Unknown Class',
        classLevel: (period.classes as any)?.class_level || '',
        stream: (period.classes as any)?.stream || '',
        subsystem: (period.classes as any)?.subsystem || ''
      })) || []

    return NextResponse.json({
      success: true,
      schedule,
      total: schedule.length,
      day: today
    })

  } catch (error) {
    console.error('Error in teacher today\'s schedule API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        schedule: []
      },
      { status: 500 }
    )
  }
}
