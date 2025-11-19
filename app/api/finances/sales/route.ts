import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkTableExists } from '@/lib/database-validation';

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

    // Validate that the sales table exists
    const { exists, error: tableError } = await checkTableExists(supabase, 'sales');
    if (!exists) {
      console.error('Sales table does not exist:', tableError);
      return NextResponse.json({
        sales: [],
        total: 0,
        limit,
        offset,
        error: tableError?.message || 'Sales table not found. Please run the database migration script: 2025-11-04_028_create_sales_table.sql',
        setupRequired: true,
        setupScript: '2025-11-04_028_create_sales_table.sql'
      }, { status: 503 }); // 503 Service Unavailable - indicates missing database setup
    }

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

    // Use service client to bypass RLS for API operations
    const supabase = createServiceClient();

    // Validate that the sales table exists
    const { exists, error: tableError } = await checkTableExists(supabase, 'sales');
    if (!exists) {
      console.error('Sales table does not exist:', tableError);
      return NextResponse.json({
        success: false,
        error: tableError?.message || 'Sales table not found. Please run the database migration script: 2025-11-04_028_create_sales_table.sql',
        setupRequired: true,
        setupScript: '2025-11-04_028_create_sales_table.sql'
      }, { status: 503 }); // 503 Service Unavailable - indicates missing database setup
    }

    // Generate sale ID with retry logic for collision handling
    // Format: YYMMDD + 6 random hex = 12 characters
    // Using 6 hex characters provides 16,777,216 unique combinations per day (16^6)
    // This significantly reduces collision probability compared to 4 characters (65,536 combinations)
    let saleId: string;
    let attempts = 0;
    const maxAttempts = 5;
    let isUnique = false;

    while (!isUnique && attempts < maxAttempts) {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const randomHex = crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
      saleId = `${year}${month}${day}${randomHex}`;
      
      // Check if ID already exists
      const { data: existing, error: checkError } = await supabase
        .from('sales')
        .select('id')
        .eq('id', saleId)
        .single();
      
      // Handle database errors during uniqueness check
      // PGRST116 is "not found" error, which is expected when ID doesn't exist
      if (checkError) {
        // Check if error has code property and it's not the expected "not found" error
        if (checkError.code && checkError.code !== 'PGRST116') {
          // Any other error code indicates a database problem
          console.error(`Error checking sale ID uniqueness: ${saleId}`, checkError);
          // Treat database errors as non-unique to trigger retry
          isUnique = false;
        } else if (!checkError.code) {
          // If error exists but no code, treat as database error
          console.error(`Unknown error checking sale ID uniqueness: ${saleId}`, checkError);
          isUnique = false;
        } else {
          // PGRST116 means "not found", so ID is unique
          isUnique = true;
        }
      } else {
        // No error means ID was found, so it's not unique
        isUnique = !existing;
      }
      
      attempts++;
      
      if (!isUnique && attempts < maxAttempts) {
        console.log(`Sale ID collision detected: ${saleId}. Retrying (attempt ${attempts}/${maxAttempts})...`);
      }
    }

    if (!isUnique) {
      console.error(`Failed to generate unique sale ID after ${maxAttempts} attempts`);
      return NextResponse.json({
        success: false,
        error: 'Failed to generate unique sale ID after multiple attempts. Please try again.'
      }, { status: 500 });
    }

    const newSale = {
      id: saleId!,
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

    // Validate that the sales table exists
    const { exists, error: tableError } = await checkTableExists(supabase, 'sales');
    if (!exists) {
      console.error('Sales table does not exist:', tableError);
      return NextResponse.json({
        success: false,
        error: tableError?.message || 'Sales table not found. Please run the database migration script: 2025-11-04_028_create_sales_table.sql',
        setupRequired: true,
        setupScript: '2025-11-04_028_create_sales_table.sql'
      }, { status: 503 });
    }

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

    // Validate that the sales table exists
    const { exists, error: tableError } = await checkTableExists(supabase, 'sales');
    if (!exists) {
      console.error('Sales table does not exist:', tableError);
      return NextResponse.json({
        success: false,
        error: tableError?.message || 'Sales table not found. Please run the database migration script: 2025-11-04_028_create_sales_table.sql',
        setupRequired: true,
        setupScript: '2025-11-04_028_create_sales_table.sql'
      }, { status: 503 });
    }

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
