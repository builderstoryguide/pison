import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET - Fetch all sales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const itemType = searchParams.get('item_type');
    const search = searchParams.get('search');

    const supabase = createServiceClient();

    // Build query for Supabase
    let query = supabase
      .from('sales')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (itemType && itemType !== 'all') {
      query = query.eq('item_type', itemType);
    }
    if (search) {
      query = query.or(`student_name.ilike.%${search}%,item_name.ilike.%${search}%,id.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: sales, error, count } = await query;

    if (error) {
      console.error('Error fetching sales:', error);
      return NextResponse.json({
        sales: [],
        total: 0,
        limit,
        offset,
        error: 'Failed to fetch sales data'
      });
    }

    return NextResponse.json({
      sales: sales || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error in GET /api/finances/sales:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      student_id,
      student_name,
      item_type,
      item_name,
      quantity,
      unit_price,
      notes,
      created_by = 'admin'
    } = body;

    // Validate required fields
    if (!student_id || !student_name || !item_type || !item_name || quantity === undefined || unit_price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert to proper types
    const quantityNum = Number(quantity);
    const unitPriceNum = Number(unit_price);

    // Validate numeric fields
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      );
    }

    if (isNaN(unitPriceNum) || unitPriceNum < 0) {
      return NextResponse.json(
        { error: 'Invalid unit price' },
        { status: 400 }
      );
    }

    // Validate student_id format (basic validation)
    if (typeof student_id !== 'string' || student_id.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid student_id format' },
        { status: 400 }
      );
    }

    // Validate item_type
    const validItemTypes = ['pullover', 'sport_wear', 'uniform', 't_shirt'];
    if (!validItemTypes.includes(item_type)) {
      return NextResponse.json(
        { error: 'Invalid item type' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const total_amount = quantityNum * unitPriceNum;

    // Generate sale ID using crypto.randomUUID for collision-free uniqueness
    const saleId = `SALE-${crypto.randomUUID()}`;

    const newSale = {
      id: saleId,
      student_id: student_id.trim(),
      student_name,
      item_type,
      item_name,
      quantity: quantityNum,
      unit_price: unitPriceNum,
      total_amount,
      sale_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      ...(notes && notes.trim() && { notes }),
      created_by
    };

    // Use service client to bypass RLS for API operations
    const supabase = createServiceClient();

    // Test if table exists by doing a simple select
    const { error: tableError } = await supabase
      .from('sales')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('Table access error:', tableError);
      return NextResponse.json({
        success: false,
        error: `Database table error: ${tableError.message || 'Sales table not accessible'}`
      }, { status: 500 });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('sales')
      .insert([newSale])
      .select()
      .single();

    if (error) {
      console.error('Error creating sale:', error);
      return NextResponse.json({
        success: false,
        error: `Failed to create sale in database: ${error.message || error.details || 'Unknown error'}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sale: data
    });

  } catch (error) {
    console.error('Error in POST /api/finances/sales:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a sale
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Sale ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Update in Supabase
    const { data, error } = await supabase
      .from('sales')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating sale:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update sale in database'
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sale: data
    });

  } catch (error) {
    console.error('Error in PUT /api/finances/sales:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a sale
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Sale ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Delete from Supabase
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting sale:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete sale from database'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Sale deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/finances/sales:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
