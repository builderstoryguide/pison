import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { classId } = await params

    // For now, return a mock schedule since we don't have a schedule table yet
    // In a real implementation, you would fetch from a schedule/timetable table
    const mockSchedule = [
      {
        id: '1',
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
        subject: 'Mathematics',
        period: '1st Period',
        room: 'Room 101'
      },
      {
        id: '2',
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        subject: 'English',
        period: '2nd Period',
        room: 'Room 102'
      },
      {
        id: '3',
        day: 'Tuesday',
        startTime: '08:00',
        endTime: '09:00',
        subject: 'Mathematics',
        period: '1st Period',
        room: 'Room 101'
      },
      {
        id: '4',
        day: 'Wednesday',
        startTime: '10:00',
        endTime: '11:00',
        subject: 'Physics',
        period: '3rd Period',
        room: 'Lab 1'
      }
    ]

    return NextResponse.json({
      success: true,
      schedule: mockSchedule
    })

  } catch (error) {
    console.error('Error in class schedule API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
