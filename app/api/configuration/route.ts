import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'

// GET - Retrieve app configuration
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the configuration (only one record should exist)
    const { data: configuration, error } = await supabase
      .from('app_configuration')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching app configuration:', error)
      
      // If the table doesn't exist, return default configuration
      if (error.code === 'PGRST116' || error.message.includes('relation "app_configuration" does not exist')) {
        console.log('App configuration table does not exist, returning default configuration')
        const defaultConfig = {
          id: null,
          school_name: 'Pison Academy',
          school_logo_url: '/pison.png',
          school_logo_alt_text: 'School Logo',
          school_address: '',
          school_phone: '',
          school_email: '',
          school_website: '',
          school_motto: '',
          primary_color: '#1f2937',
          secondary_color: '#3b82f6',
          academic_year: '2024-2025',
          currency: 'XOF',
          timezone: 'Africa/Douala',
          language: 'en',
          date_format: 'DD/MM/YYYY',
          time_format: '24h',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null,
          updated_by: null
        }
        return NextResponse.json({ configuration: defaultConfig })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      )
    }

    // If no configuration exists, return default values
    if (!configuration) {
      const defaultConfig = {
        id: null,
        school_name: 'Pison Academy',
        school_logo_url: '/pison.png',
        school_logo_alt_text: 'School Logo',
        school_address: '',
        school_phone: '',
        school_email: '',
        school_website: '',
        school_motto: '',
        primary_color: '#1f2937',
        secondary_color: '#3b82f6',
        academic_year: '2024-2025',
        currency: 'XOF',
        timezone: 'Africa/Douala',
        language: 'en',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        updated_by: null
      }
      return NextResponse.json({ configuration: defaultConfig })
    }

    return NextResponse.json({ configuration })
  } catch (error) {
    console.error('Unexpected error in GET /api/configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update app configuration (admin only)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication and admin role
    const user = await requireRole(request, 'admin')

    const body = await request.json()
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
      return NextResponse.json(
        { error: 'School name is required' },
        { status: 400 }
      )
    }

    // Check if configuration already exists
    const { data: existingConfig, error: checkError } = await supabase
      .from('app_configuration')
      .select('id')
      .limit(1)
      .single()

    // If table doesn't exist, return error with instructions
    if (checkError && (checkError.code === 'PGRST116' || checkError.message.includes('relation "app_configuration" does not exist'))) {
      return NextResponse.json(
        { 
          error: 'Configuration table does not exist. Please create the app_configuration table in your Supabase database first.',
          instructions: 'Run the SQL script from scripts/create-app-configuration-table.sql in your Supabase SQL editor.'
        },
        { status: 500 }
      )
    }

    let result
    if (existingConfig) {
      // Update existing configuration
      const { data, error } = await supabase
        .from('app_configuration')
        .update({
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
        })
        .eq('id', existingConfig.id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Create new configuration
      const { data, error } = await supabase
        .from('app_configuration')
        .insert({
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
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single()

      result = { data, error }
    }

    if (result.error) {
      console.error('Error updating app configuration:', result.error)
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Configuration updated successfully',
      configuration: result.data
    })
  } catch (error) {
    console.error('Unexpected error in PUT /api/configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Reset configuration to defaults (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication and admin role
    const user = await requireRole(request, 'admin')

    const body = await request.json()
    const { action } = body

    if (action === 'reset') {
      // Delete existing configuration
      const { error: deleteError } = await supabase
        .from('app_configuration')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

      if (deleteError) {
        console.error('Error deleting app configuration:', deleteError)
        return NextResponse.json(
          { error: 'Failed to reset configuration' },
          { status: 500 }
        )
      }

      // Create default configuration
      const { data, error } = await supabase
        .from('app_configuration')
        .insert({
          school_name: 'Pison Academy',
          school_logo_url: '/pison.png',
          school_logo_alt_text: 'School Logo',
          school_address: '',
          school_phone: '',
          school_email: '',
          school_website: '',
          school_motto: '',
          primary_color: '#1f2937',
          secondary_color: '#3b82f6',
          academic_year: '2024-2025',
          currency: 'XOF',
          timezone: 'Africa/Douala',
          language: 'en',
          date_format: 'DD/MM/YYYY',
          time_format: '24h',
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating default configuration:', error)
        return NextResponse.json(
          { error: 'Failed to create default configuration' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Configuration reset to defaults successfully',
        configuration: data
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
