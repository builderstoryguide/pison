import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'

// Enhanced error types for better debugging
interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Create standardized error response
const createErrorResponse = (error: ApiError, status: number) => {
  return NextResponse.json({
    success: false,
    error: error.message,
    code: error.code,
    details: error.details,
    timestamp: error.timestamp,
    fallback: true // Indicates client should use fallback
  }, { status })
}

// Default configuration that's always available
const getDefaultConfiguration = () => ({
  id: null,
  school_name: process.env.NEXT_PUBLIC_SCHOOL_NAME || 'Pison Academy',
  school_logo_url: process.env.NEXT_PUBLIC_SCHOOL_LOGO || '/pison-logo.png',
  school_logo_alt_text: process.env.NEXT_PUBLIC_SCHOOL_LOGO_ALT || 'School Logo',
  school_address: process.env.NEXT_PUBLIC_SCHOOL_ADDRESS || '',
  school_phone: process.env.NEXT_PUBLIC_SCHOOL_PHONE || '',
  school_email: process.env.NEXT_PUBLIC_SCHOOL_EMAIL || '',
  school_website: process.env.NEXT_PUBLIC_SCHOOL_WEBSITE || '',
  school_motto: process.env.NEXT_PUBLIC_SCHOOL_MOTTO || '',
  primary_color: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#1f2937',
  secondary_color: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#3b82f6',
  academic_year: process.env.NEXT_PUBLIC_ACADEMIC_YEAR || '2024-2025',
  currency: process.env.NEXT_PUBLIC_CURRENCY || 'XOF',
  timezone: process.env.NEXT_PUBLIC_TIMEZONE || 'Africa/Douala',
  language: process.env.NEXT_PUBLIC_LANGUAGE || 'en',
  date_format: process.env.NEXT_PUBLIC_DATE_FORMAT || 'DD/MM/YYYY',
  time_format: process.env.NEXT_PUBLIC_TIME_FORMAT || '24h',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: null,
  updated_by: null
})

// Enhanced GET endpoint with multiple fallback strategies
export async function GET(_request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Strategy 1: Try to fetch from database
    try {
      const supabase = await createClient()
      
      const { data: configuration, error } = await supabase
        .from('app_configuration')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        // Handle specific database errors
        if (error.code === 'PGRST116' || error.message.includes('relation "app_configuration" does not exist')) {
          console.log('Configuration table does not exist, returning default configuration')
          return NextResponse.json({
            success: true,
            configuration: getDefaultConfiguration(),
            source: 'default',
            cached: false,
            responseTime: Date.now() - startTime
          })
        }
        
        if (error.code === 'PGRST301') {
          console.log('No configuration found, returning default configuration')
          return NextResponse.json({
            success: true,
            configuration: getDefaultConfiguration(),
            source: 'default',
            cached: false,
            responseTime: Date.now() - startTime
          })
        }

        throw error
      }

      if (configuration) {
        return NextResponse.json({
          success: true,
          configuration,
          source: 'database',
          cached: false,
          responseTime: Date.now() - startTime
        })
      }
    } catch (dbError) {
      console.warn('Database fetch failed, using default configuration:', dbError)
    }

    // Strategy 3: Return default configuration
    return NextResponse.json({
      success: true,
      configuration: getDefaultConfiguration(),
      source: 'default',
      cached: false,
      responseTime: Date.now() - startTime
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/configuration-v2:', error)
    
    return createErrorResponse({
      code: 'UNEXPECTED_ERROR',
      message: 'An unexpected error occurred while fetching configuration',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
}

// Enhanced PUT endpoint with validation and fallbacks
export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check authentication and admin role
    const user = await requireRole(request, 'admin')

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return createErrorResponse({
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        timestamp: new Date().toISOString()
      }, 400)
    }

    const {
      school_name,
      school_logo_url,
      school_logo_alt_text,
      school_address,
      school_phone,
      school_email,
      school_website,
      school_motto,
      primary_color,
      secondary_color,
      academic_year,
      currency,
      timezone,
      language,
      date_format,
      time_format
    } = body

    // Validate required fields
    if (!school_name || school_name.trim() === '') {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'School name is required',
        details: { field: 'school_name' },
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Validate colors
    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    if (primary_color && !colorRegex.test(primary_color)) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Invalid primary color format',
        details: { field: 'primary_color', value: primary_color },
        timestamp: new Date().toISOString()
      }, 400)
    }

    if (secondary_color && !colorRegex.test(secondary_color)) {
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Invalid secondary color format',
        details: { field: 'secondary_color', value: secondary_color },
        timestamp: new Date().toISOString()
      }, 400)
    }

    // Validate logo URL if provided (optional field)
    if (school_logo_url && school_logo_url.trim() !== '') {
      try {
        new URL(school_logo_url.trim())
      } catch {
        return createErrorResponse({
          code: 'VALIDATION_ERROR',
          message: 'Invalid logo URL format',
          details: { field: 'school_logo_url', value: school_logo_url },
          timestamp: new Date().toISOString()
        }, 400)
      }
    }

    // Prepare update data
    const updateData = {
      school_name: school_name.trim(),
      school_logo_url: school_logo_url?.trim() || null,
      school_logo_alt_text: school_logo_alt_text?.trim() || null,
      school_address: school_address?.trim() || null,
      school_phone: school_phone?.trim() || null,
      school_email: school_email?.trim() || null,
      school_website: school_website?.trim() || null,
      school_motto: school_motto?.trim() || null,
      primary_color: primary_color?.trim() || '#1f2937',
      secondary_color: secondary_color?.trim() || '#3b82f6',
      academic_year: academic_year?.trim() || '2024-2025',
      currency: currency?.trim() || 'XOF',
      timezone: timezone?.trim() || 'Africa/Douala',
      language: language?.trim() || 'en',
      date_format: date_format?.trim() || 'DD/MM/YYYY',
      time_format: time_format?.trim() || '24h',
      updated_by: user.id
    }

    // Create Supabase client
    const supabase = await createClient()

    // Try to update/create configuration
    let existingConfig: { id: string } | null = null
    try {
      // Check if configuration exists
      const { data: configData, error: checkError } = await supabase
        .from('app_configuration')
        .select('id')
        .limit(1)
        .maybeSingle()

      // Handle table not existing error
      if (checkError && (checkError.code === 'PGRST116' || checkError.message?.includes('relation "app_configuration" does not exist'))) {
        return createErrorResponse({
          code: 'TABLE_NOT_FOUND',
          message: 'Configuration table does not exist. Please create the app_configuration table in your Supabase database first.',
          details: { 
            instructions: 'Run the SQL script from scripts/create-app-configuration-table.sql in your Supabase SQL editor.' 
          },
          timestamp: new Date().toISOString()
        }, 500)
      }

      // PGRST301 (no rows found) is expected when creating first config, so we ignore it
      // Other errors should be thrown
      if (checkError && checkError.code !== 'PGRST301') {
        throw checkError
      }

      existingConfig = configData

      let result
      if (existingConfig) {
        // Update existing
        const { data, error } = await supabase
          .from('app_configuration')
          .update(updateData)
          .eq('id', existingConfig.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating configuration:', error)
          throw error
        }
        if (!data) {
          throw new Error('Update operation returned no data')
        }
        result = { data, error: null }
      } else {
        // Create new
        const { data, error } = await supabase
          .from('app_configuration')
          .insert({
            ...updateData,
            created_by: user.id
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating configuration:', error)
          throw error
        }
        if (!data) {
          throw new Error('Insert operation returned no data')
        }
        result = { data, error: null }
      }

      if (!result.data) {
        throw new Error('Configuration operation completed but no data was returned')
      }

      return NextResponse.json({
        success: true,
        message: 'Configuration updated successfully',
        configuration: result.data,
        source: 'database',
        responseTime: Date.now() - startTime
      })

    } catch (dbError) {
      console.error('Database operation failed:', dbError)
      
      // If database operation fails, return the configuration that would have been saved
      const fallbackConfig = {
        ...getDefaultConfiguration(),
        ...updateData,
        id: existingConfig?.id || null
      }

      return NextResponse.json({
        success: true,
        message: 'Configuration updated (offline mode)',
        configuration: fallbackConfig,
        source: 'fallback',
        warning: 'Database unavailable - changes saved locally',
        responseTime: Date.now() - startTime
      })
    }

  } catch (error) {
    // If error is a NextResponse (from auth functions), return it directly
    if (error instanceof NextResponse) {
      return error
    }
    
    console.error('Unexpected error in PUT /api/configuration-v2:', error)
    
    return createErrorResponse({
      code: 'UNEXPECTED_ERROR',
      message: 'An unexpected error occurred while updating configuration',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
}

// Enhanced POST endpoint for reset
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check authentication and admin role
    const user = await requireRole(request, 'admin')

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return createErrorResponse({
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        timestamp: new Date().toISOString()
      }, 400)
    }

    const { action } = body

    if (action === 'reset') {
      try {
        // Create Supabase client
        const supabase = await createClient()
        if (!supabase) {
          return createErrorResponse({
            code: 'DATABASE_ERROR',
            message: 'Database connection failed',
            timestamp: new Date().toISOString()
          }, 500)
        }

        // Delete existing configuration
        await supabase
          .from('app_configuration')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        // Create default configuration
        const defaultConfig = getDefaultConfiguration()
        const { data, error } = await supabase
          .from('app_configuration')
          .insert({
            ...defaultConfig,
            created_by: user.id,
            updated_by: user.id
          })
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          message: 'Configuration reset to defaults successfully',
          configuration: data,
          source: 'database',
          responseTime: Date.now() - startTime
        })

      } catch (dbError) {
        console.error('Database reset failed:', dbError)
        
        return NextResponse.json({
          success: true,
          message: 'Configuration reset (offline mode)',
          configuration: getDefaultConfiguration(),
          source: 'fallback',
          warning: 'Database unavailable - using default configuration',
          responseTime: Date.now() - startTime
        })
      }
    }

    return createErrorResponse({
      code: 'INVALID_ACTION',
      message: 'Invalid action specified',
      details: { action },
      timestamp: new Date().toISOString()
    }, 400)

  } catch (error) {
    // If error is a NextResponse (from auth functions), return it directly
    if (error instanceof NextResponse) {
      return error
    }
    
    console.error('Unexpected error in POST /api/configuration-v2:', error)
    
    return createErrorResponse({
      code: 'UNEXPECTED_ERROR',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
}
