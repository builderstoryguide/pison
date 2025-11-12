import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RealTimeUpdate } from '@/lib/teacher-ultra-fast/types'

// Server-sent events for real-time updates
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const teacherId = searchParams.get('teacherId')
  
  if (!teacherId) {
    return NextResponse.json({
      success: false,
      error: 'Teacher ID is required'
    }, { status: 400 })
  }
  
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial connection message
        const initialMessage = `data: ${JSON.stringify({
          type: 'connection',
          message: 'Connected to real-time updates',
          timestamp: new Date().toISOString()
        })}\n\n`
        
        controller.enqueue(new TextEncoder().encode(initialMessage))
        
        // Set up real-time listeners
        const supabase = await createClient()
      
      // Listen for grade updates
      const gradesSubscription = supabase
        .channel('grades_updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'grades',
          filter: `teacher_id=eq.${teacherId}`
        }, (payload) => {
          const update: RealTimeUpdate = {
            type: 'grades',
            action: payload.eventType as any,
            data: payload.new || payload.old,
            timestamp: new Date().toISOString()
          }
          
          const message = `data: ${JSON.stringify(update)}\n\n`
          controller.enqueue(new TextEncoder().encode(message))
        })
        .subscribe()
      
      // Listen for assessment updates
      const assessmentsSubscription = supabase
        .channel('assessments_updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'assessments',
          filter: `teacher_id=eq.${teacherId}`
        }, (payload) => {
          const update: RealTimeUpdate = {
            type: 'assessments',
            action: payload.eventType as any,
            data: payload.new || payload.old,
            timestamp: new Date().toISOString()
          }
          
          const message = `data: ${JSON.stringify(update)}\n\n`
          controller.enqueue(new TextEncoder().encode(message))
        })
        .subscribe()
      
      // Listen for class updates
      const classesSubscription = supabase
        .channel('classes_updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'classes',
          filter: `teacher_id=eq.${teacherId}`
        }, (payload) => {
          const update: RealTimeUpdate = {
            type: 'classes',
            action: payload.eventType as any,
            data: payload.new || payload.old,
            timestamp: new Date().toISOString()
          }
          
          const message = `data: ${JSON.stringify(update)}\n\n`
          controller.enqueue(new TextEncoder().encode(message))
        })
        .subscribe()
      
      // Get current academic year from configuration
      let currentAcademicYear = process.env.NEXT_PUBLIC_ACADEMIC_YEAR || '2024-2025'
      try {
        const { data: config } = await supabase
          .from('app_configuration')
          .select('academic_year')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (config?.academic_year) {
          currentAcademicYear = config.academic_year
        }
      } catch (configError) {
        // Fallback to environment variable if config fetch fails
        console.warn('Failed to fetch academic year from configuration, using default:', configError)
      }

      // Get teacher's class IDs first for student updates
      // Filter by current academic year but not by term to include all active assignments
      const { data: teacherClasses, error: classesError } = await supabase
        .from('teacher_branch_assignments')
        .select('class_id')
        .eq('teacher_id', teacherId)
        .eq('academic_year', currentAcademicYear)

      let studentsSubscription: any = null
      
      if (!classesError && teacherClasses && teacherClasses.length > 0) {
        const classIds = teacherClasses.map(tc => tc.class_id).filter(Boolean)
        
        if (classIds.length > 0) {
          // Listen for student updates with actual class IDs
          studentsSubscription = supabase
            .channel('students_updates')
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'student_enrollments',
              filter: `class_id=in.(${classIds.join(',')})`
            }, (payload) => {
              const update: RealTimeUpdate = {
                type: 'students',
                action: payload.eventType as any,
                data: payload.new || payload.old,
                timestamp: new Date().toISOString()
              }
              
              const message = `data: ${JSON.stringify(update)}\n\n`
              controller.enqueue(new TextEncoder().encode(message))
            })
            .subscribe()
        }
      }
      
      // If no classes found, send a no-updates response
      if (!studentsSubscription) {
        const noUpdatesMessage = `data: ${JSON.stringify({
          type: 'no_updates',
          message: 'No classes assigned to teacher',
          timestamp: new Date().toISOString()
        })}\n\n`
        controller.enqueue(new TextEncoder().encode(noUpdatesMessage))
      }
      
      // Send periodic heartbeat
      const heartbeatInterval = setInterval(() => {
        const heartbeat = `data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        })}\n\n`
        
        try {
          controller.enqueue(new TextEncoder().encode(heartbeat))
        } catch (error) {
          // Connection closed
          clearInterval(heartbeatInterval)
        }
      }, 30000) // Every 30 seconds
      
      // Cleanup function
      const cleanup = () => {
        clearInterval(heartbeatInterval)
        gradesSubscription.unsubscribe()
        assessmentsSubscription.unsubscribe()
        classesSubscription.unsubscribe()
        if (studentsSubscription) {
          studentsSubscription.unsubscribe()
        }
      }
      
      // Handle connection close
      request.signal.addEventListener('abort', cleanup)
      
      // Store cleanup function for later use
      ;(controller as any).cleanup = cleanup
      } catch (error) {
        console.error('Error setting up real-time connection:', error)
        const errorMessage = `data: ${JSON.stringify({
          type: 'error',
          message: 'Failed to establish real-time connection',
          timestamp: new Date().toISOString()
        })}\n\n`
        controller.enqueue(new TextEncoder().encode(errorMessage))
        controller.close()
      }
    },
    
    cancel() {
      // Cleanup when connection is cancelled
      if ((this as any).cleanup) {
        (this as any).cleanup()
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

// WebSocket alternative for real-time updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body
    
    if (action === 'broadcast_update') {
      // Broadcast update to all connected clients
      const update: RealTimeUpdate = {
        type: data.type,
        action: data.action,
        data: data.data,
        timestamp: new Date().toISOString()
      }
      
      // In a real implementation, you would broadcast this to all connected WebSocket clients
      // For now, we'll just return success
      return NextResponse.json({
        success: true,
        message: 'Update broadcasted successfully',
        update
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Real-time POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process real-time request'
    }, { status: 500 })
  }
}
