import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Retrieve app configuration (simplified format for client-side use)
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the configuration (only one record should exist)
    const { data: configuration, error } = await supabase
      .from('app_configuration')
      .select('academic_year')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // If the table doesn't exist or no config found, return default configuration
      if (error.code === 'PGRST116' || error.code === 'PGRST301' || error.message.includes('relation "app_configuration" does not exist')) {
        const defaultConfig = {
          config: {
            academicYear: process.env.NEXT_PUBLIC_ACADEMIC_YEAR || '2024-2025'
          }
        }
        return NextResponse.json(defaultConfig)
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      )
    }

    // Return in the expected format
    return NextResponse.json({
      config: {
        academicYear: configuration?.academic_year || process.env.NEXT_PUBLIC_ACADEMIC_YEAR || '2024-2025'
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/app-config:', error)
    // Return default on any error to prevent breaking the app
    return NextResponse.json({
      config: {
        academicYear: process.env.NEXT_PUBLIC_ACADEMIC_YEAR || '2024-2025'
      }
    })
  }
}
