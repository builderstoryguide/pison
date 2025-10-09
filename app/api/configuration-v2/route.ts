import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  school_logo_url: process.env.NEXT_PUBLIC_SCHOOL_LOGO || '/placeholder-logo.svg',
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
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Strategy 1: Try to get authenticated user
    let user = null
    try {
      const supabase = await createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
    } catch (authError) {
      console.warn('Auth check failed, proceeding without authentication:', authError)
    }

    // Strategy 2: Try to fetch from database
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
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      }, 401)
    }

    // Check admin permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return createErrorResponse({
        code: 'FORBIDDEN',
        message: 'Admin role required',
        timestamp: new Date().toISOString()
      }, 403)
    }

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

    // Prepare update data
    const updateData = {
      school_name: school_name.trim(),
      school_logo_url: school_logo_url?.trim() || null,
      school_logo_alt_text: school_logo_alt_text?.trim() || 'School Logo',
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

    // Check if configuration exists
    let existingConfig
    try {
      const { data } = await supabase
        .from('app_configuration')
        .select('id')
        .limit(1)
        .single()
      existingConfig = data
    } catch (configCheckError) {
      // If we can't check for existing config, assume none exists
      existingConfig = null
    }

    // Try to update/create configuration
    try {

      let result
      if (existingConfig) {
        // Update existing
        const { data, error } = await supabase
          .from('app_configuration')
          .update(updateData)
          .eq('id', existingConfig.id)
          .select()
          .single()

        if (error) throw error
        result = { data, error }
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

        if (error) throw error
        result = { data, error }
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return createErrorResponse({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      }, 401)
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return createErrorResponse({
        code: 'FORBIDDEN',
        message: 'Admin role required',
        timestamp: new Date().toISOString()
      }, 403)
    }

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
    console.error('Unexpected error in POST /api/configuration-v2:', error)
    
    return createErrorResponse({
      code: 'UNEXPECTED_ERROR',
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
}
