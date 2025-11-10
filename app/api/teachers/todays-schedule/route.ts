import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/database-utils'
import { resolveTeacherId } from '@/lib/teacher-lookup'

export interface ClassInfo {
  class_name: string
}

export interface TodayScheduleItem {
  id: string
  day: string
  startTime: string
  endTime: string
  subject: string
  period: string
  room: string
  classId: string
  className: string
}

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

    console.log('🔍 Teacher today\'s schedule API called with teacherId:', teacherId)

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

    // Use the centralized teacher lookup utility
    const teacher = await resolveTeacherId(supabase, teacherId)

    if (!teacher) {
      console.error('Teacher not found for ID:', teacherId)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Teacher not found',
          schedule: []
        },
        { status: 404 }
      )
    }

    const actualTeacherId = teacher.id
    console.log('🎯 Found actual teacher ID:', actualTeacherId, 'for user:', teacherId)

    // Get today's day of the week using timezone-consistent date
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD format
    const todayDayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    console.log('📅 Today is:', todayDayOfWeek, '(', today, ')')

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
          class_name
        )
      `)
      .eq('teacher_id', actualTeacherId)
      .eq('day_of_week', todayDayOfWeek)
      .eq('is_active', true)
      .order('start_time')

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

    console.log('📊 Found schedule items for today:', scheduleData?.length || 0)

    // Transform the data
    const todaySchedule: TodayScheduleItem[] = scheduleData?.map(item => ({
      id: item.id,
      day: item.day_of_week,
      startTime: item.start_time,
      endTime: item.end_time,
      subject: item.subject,
      period: `Period ${item.period_number}`,
      room: item.room,
      classId: item.class_id,
      className: Array.isArray(item.classes) 
        ? (item.classes as ClassInfo[])[0]?.class_name ?? 'Unknown Class'
        : (item.classes as ClassInfo)?.class_name ?? 'Unknown Class'
    })) || []

    console.log('✅ Returning today\'s schedule:', todaySchedule.length, 'items')

    return NextResponse.json({
      success: true,
      schedule: todaySchedule,
      total: todaySchedule.length
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