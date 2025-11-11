import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(_request: NextRequest) {
  try {
    // Get total count of parents
    const { count, error } = await supabase
      .from('parents')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching parent count:', error);
      return NextResponse.json(
        { error: 'Failed to fetch parent count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0
    });

  } catch (error) {
    console.error('Error in GET /api/parents/count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
