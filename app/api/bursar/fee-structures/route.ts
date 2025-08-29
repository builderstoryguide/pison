import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')
    const isActive = searchParams.get('isActive')

    let query = supabase
      .from('fee_structures')
      .select(`
        *,
        classes (name, subsystem, branch),
        fee_structure_items (
          *,
          fee_categories (name, code, description)
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (classId) {
      query = query.eq('class_id', classId)
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }
    if (term) {
      query = query.eq('term', term)
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching fee structures:', error)
      return NextResponse.json(
        { error: 'Failed to fetch fee structures' },
        { status: 500 }
      )
    }

    // Transform data to include calculated total amount
    const transformedData = data?.map(structure => {
      const totalAmount = structure.fee_structure_items?.reduce(
        (sum: number, item: any) => sum + parseFloat(item.amount || 0),
        0
      ) || 0

      return {
        id: structure.id,
        name: structure.name,
        classId: structure.class_id,
        className: structure.classes?.name,
        subsystem: structure.subsystem,
        branch: structure.branch,
        academicYear: structure.academic_year,
        term: structure.term,
        dueDate: structure.due_date,
        isActive: structure.is_active,
        totalAmount,
        items: structure.fee_structure_items?.map((item: any) => ({
          id: item.id,
          categoryId: item.fee_category_id,
          categoryName: item.fee_categories?.name,
          categoryCode: item.fee_categories?.code,
          amount: parseFloat(item.amount || 0),
          isOptional: item.is_optional,
          description: item.description
        })) || [],
        createdAt: structure.created_at,
        updatedAt: structure.updated_at
      }
    })

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in fee structures GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      name,
      classId,
      subsystem,
      branch,
      academicYear,
      term,
      dueDate,
      totalAmount,
      numberOfInstallments,
      installments,
      items,
      description,
      isActive
    } = body

    // Validate required fields
    if (!name || !classId || !subsystem || !branch || !academicYear || !term || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if fee structure already exists for this class, academic year, and term
    const { data: existingStructure } = await supabase
      .from('fee_structures')
      .select('id')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .single()

    if (existingStructure) {
      return NextResponse.json(
        { error: 'Fee structure already exists for this class, academic year, and term' },
        { status: 409 }
      )
    }

    // Create fee structure
    const { data: feeStructure, error: structureError } = await supabase
      .from('fee_structures')
      .insert({
        name,
        class_id: classId,
        subsystem,
        branch,
        academic_year: academicYear,
        term,
        due_date: dueDate,
        amount: totalAmount || 0,
        description: description || '',
        is_active: isActive !== undefined ? isActive : true,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (structureError) {
      console.error('Error creating fee structure:', structureError)
      return NextResponse.json(
        { error: 'Failed to create fee structure' },
        { status: 500 }
      )
    }

    // Create fee structure items (if provided)
    if (items && items.length > 0) {
      const feeStructureItems = items.map((item: any) => ({
        fee_structure_id: feeStructure.id,
        fee_category_id: item.categoryId,
        amount: item.amount,
        is_optional: item.isOptional || false,
        description: item.description
      }))

      const { error: itemsError } = await supabase
        .from('fee_structure_items')
        .insert(feeStructureItems)

      if (itemsError) {
        console.error('Error creating fee structure items:', itemsError)
        // Rollback fee structure creation
        await supabase
          .from('fee_structures')
          .delete()
          .eq('id', feeStructure.id)
        
        return NextResponse.json(
          { error: 'Failed to create fee structure items' },
          { status: 500 }
        )
      }
    }

    // Create payment plan with installments (if installments are provided)
    if (installments && installments.length > 0) {
      // First create a payment plan template
      const { data: paymentPlan, error: planError } = await supabase
        .from('payment_plans')
        .insert({
          fee_structure_id: feeStructure.id,
          total_amount: totalAmount || 0,
          amount_paid: 0,
          balance: totalAmount || 0,
          status: 'active',
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (planError) {
        console.error('Error creating payment plan:', planError)
        // Rollback fee structure creation
        await supabase
          .from('fee_structures')
          .delete()
          .eq('id', feeStructure.id)
        
        return NextResponse.json(
          { error: 'Failed to create payment plan' },
          { status: 500 }
        )
      }

      // Create installments
      const installmentData = installments.map((inst: any) => ({
        payment_plan_id: paymentPlan.id,
        installment_number: inst.installmentNumber,
        amount: inst.amount,
        due_date: inst.dueDate,
        status: 'pending'
      }))

      const { error: installmentsError } = await supabase
        .from('payment_plan_installments')
        .insert(installmentData)

      if (installmentsError) {
        console.error('Error creating installments:', installmentsError)
        // Rollback fee structure and payment plan creation
        await supabase
          .from('fee_structures')
          .delete()
          .eq('id', feeStructure.id)
        
        return NextResponse.json(
          { error: 'Failed to create installments' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        feeStructureId: feeStructure.id,
        message: 'Fee structure created successfully' 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in fee structures POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

