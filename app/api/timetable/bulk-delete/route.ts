import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Check if environment variables are set
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()

    const { classIds } = body

    // Validate input
    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input: classIds array is required' },
        { status: 400 }
      )
    }

    // Check if the timetable tables exist
    try {
      const { error: checkError } = await supabase
        .from('timetable_periods')
        .select('id')
        .limit(1)

      if (checkError) {
        return NextResponse.json({
          error: 'Database not set up. Please run the timetable database setup script first.',
          details: checkError.message
        }, { status: 500 })
      }
    } catch (dbError) {
      return NextResponse.json({
        error: 'Database not set up. Please run the timetable database setup script first.',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 })
    }

    // Get class details for validation and logging
    const { error: fetchError } = await supabase
      .from('timetable_classes')
      .select('id, name, level, subsystem, branch')
      .in('id', classIds)

    if (fetchError) {
      console.error('Error fetching classes for deletion:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch class details' },
        { status: 500 }
      )
    }

    // Start transaction for bulk deletion
    const errors: string[] = []
    let deletedCount = 0

    for (const classId of classIds) {
      try {
        // Delete all periods for the class
        const { error: deleteError } = await supabase
          .from('timetable_periods')
          .delete()
          .eq('class_id', classId)

        if (deleteError) {
          console.error(`Error deleting timetable for class ${classId}:`, deleteError)
          errors.push(`Failed to delete timetable for class ${classId}: ${deleteError.message}`)
        } else {
          deletedCount++
        }
      } catch (error) {
        console.error(`Error processing class ${classId}:`, error)
        errors.push(`Failed to delete timetable for class ${classId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Return results
    if (deletedCount === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No timetables were deleted',
          deletedCount: 0,
          errors
        },
        { status: 500 }
      )
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          success: true,
          deletedCount,
          errors,
          message: `Successfully deleted ${deletedCount} timetables with ${errors.length} errors`
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        deletedCount,
        errors: [],
        message: `Successfully deleted ${deletedCount} timetables`
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in bulk delete timetables:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
