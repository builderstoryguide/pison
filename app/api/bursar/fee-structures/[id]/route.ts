import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('fee_structures')
      .select(`
        *,
        classes (name, subsystem, branch),
        fee_structure_items (
          *,
          fee_categories (name, code, description)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching fee structure:', error)
      return NextResponse.json(
        { error: 'Fee structure not found' },
        { status: 404 }
      )
    }

    // Transform data to include calculated total amount
    const totalAmount = data.fee_structure_items?.reduce(
      (sum: number, item: any) => sum + parseFloat(item.amount || 0),
      0
    ) || 0

    const transformedData = {
      id: data.id,
      name: data.name,
      classId: data.class_id,
      className: data.classes?.name,
      subsystem: data.subsystem,
      branch: data.branch,
      academicYear: data.academic_year,
      term: data.term,
      dueDate: data.due_date,
      isActive: data.is_active,
      totalAmount,
      items: data.fee_structure_items?.map((item: any) => ({
        id: item.id,
        categoryId: item.fee_category_id,
        categoryName: item.fee_categories?.name,
        categoryCode: item.fee_categories?.code,
        amount: parseFloat(item.amount || 0),
        isOptional: item.is_optional,
        description: item.description
      })) || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in fee structure GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const {
      name,
      dueDate,
      isActive,
      items
    } = body

    // Update fee structure
    const { error: structureError } = await supabase
      .from('fee_structures')
      .update({
        name,
        due_date: dueDate,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (structureError) {
      console.error('Error updating fee structure:', structureError)
      return NextResponse.json(
        { error: 'Failed to update fee structure' },
        { status: 500 }
      )
    }

    // Update fee structure items if provided
    if (items && items.length > 0) {
      // Delete existing items
      await supabase
        .from('fee_structure_items')
        .delete()
        .eq('fee_structure_id', params.id)

      // Insert new items
      const feeStructureItems = items.map((item: any) => ({
        fee_structure_id: params.id,
        fee_category_id: item.categoryId,
        amount: item.amount,
        is_optional: item.isOptional || false,
        description: item.description
      }))

      const { error: itemsError } = await supabase
        .from('fee_structure_items')
        .insert(feeStructureItems)

      if (itemsError) {
        console.error('Error updating fee structure items:', itemsError)
        return NextResponse.json(
          { error: 'Failed to update fee structure items' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Fee structure updated successfully' 
      }
    )
  } catch (error) {
    console.error('Error in fee structure PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Check if fee structure is being used by any student fees
    const { data: studentFees, error: checkError } = await supabase
      .from('student_fees')
      .select('id')
      .eq('fee_structure_id', params.id)
      .limit(1)

    if (checkError) {
      console.error('Error checking fee structure usage:', checkError)
      return NextResponse.json(
        { error: 'Failed to check fee structure usage' },
        { status: 500 }
      )
    }

    if (studentFees && studentFees.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete fee structure that is assigned to students' },
        { status: 400 }
      )
    }

    // Delete fee structure items first (due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from('fee_structure_items')
      .delete()
      .eq('fee_structure_id', params.id)

    if (itemsError) {
      console.error('Error deleting fee structure items:', itemsError)
      return NextResponse.json(
        { error: 'Failed to delete fee structure items' },
        { status: 500 }
      )
    }

    // Delete fee structure
    const { error: structureError } = await supabase
      .from('fee_structures')
      .delete()
      .eq('id', params.id)

    if (structureError) {
      console.error('Error deleting fee structure:', structureError)
      return NextResponse.json(
        { error: 'Failed to delete fee structure' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Fee structure deleted successfully' 
      }
    )
  } catch (error) {
    console.error('Error in fee structure DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

