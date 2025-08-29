import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    let query = supabase
      .from('payment_methods')
      .select('*')
      .order('name', { ascending: true })

    // Apply filters
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching payment methods:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payment methods' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in payment methods GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

