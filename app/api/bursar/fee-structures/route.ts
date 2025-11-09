import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAnyRole } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')
    const isActive = searchParams.get('isActive')

    // First, try to query with joins (in case relationships exist)
    // If that fails, fall back to a simple query without joins
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

    let { data, error } = await query

    // If the query fails due to relationship issues, try a simpler query
    if (error && (error.code === 'PGRST201' || error.code === '42P01')) {
      console.warn('Relationship query failed, falling back to simple query:', error.message)
      
      // Simple query without joins
      let simpleQuery = supabase
        .from('fee_structures')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (classId) {
        simpleQuery = simpleQuery.eq('class_id', classId)
      }
      if (academicYear) {
        simpleQuery = simpleQuery.eq('academic_year', academicYear)
      }
      if (term) {
        simpleQuery = simpleQuery.eq('term', term)
      }
      if (isActive !== null) {
        simpleQuery = simpleQuery.eq('is_active', isActive === 'true')
      }

      const simpleResult = await simpleQuery
      data = simpleResult.data
      error = simpleResult.error

      // If simple query also fails, try to get class names separately
      if (!error && data && data.length > 0) {
        const classIds = [...new Set(data.map((s: any) => s.class_id).filter(Boolean))]
        if (classIds.length > 0) {
          const { data: classesData } = await supabase
            .from('classes')
            .select('id, name, subsystem, branch')
            .in('id', classIds)

          // Map class data to fee structures
          const classMap = new Map(classesData?.map((c: any) => [c.id, c]) || [])
          data = data.map((s: any) => ({
            ...s,
            classes: classMap.get(s.class_id) || null
          }))
        }
      }
    }

    if (error) {
      console.error('Error fetching fee structures:', error)
      return NextResponse.json(
        { error: 'Failed to fetch fee structures', details: error.message },
        { status: 500 }
      )
    }

    // Transform data to include calculated total amount
    // Use amount from fee_structures table as primary source
    // Fallback to summing fee_structure_items if items exist and amount is 0
    const transformedData = data?.map((structure: any) => {
      // Primary: use amount from fee_structures table (this is what we store)
      let totalAmount = parseFloat(structure.amount || 0)
      
      // Fallback: if amount is 0 or items exist, try to sum from items
      if ((totalAmount === 0 || structure.fee_structure_items?.length > 0) && structure.fee_structure_items) {
        const itemsTotal = structure.fee_structure_items.reduce(
          (sum: number, item: any) => sum + parseFloat(item.amount || 0),
          0
        )
        // Only use items total if it's greater than 0 (meaning items exist)
        if (itemsTotal > 0) {
          totalAmount = itemsTotal
        }
      }

      return {
        id: structure.id,
        name: structure.name,
        classId: structure.class_id,
        className: structure.classes?.name || null,
        level: structure.level || null,
        subsystem: structure.subsystem,
        branch: structure.branch,
        academicYear: structure.academic_year,
        term: structure.term,
        dueDate: structure.due_date,
        isActive: structure.is_active,
        totalAmount,
        description: structure.description || null,
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
      level,
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
    if (!name || !classId || !subsystem || !branch || !level || !academicYear || !term || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields. Level is required.' },
        { status: 400 }
      )
    }

    // Validate term value - database only accepts 'first', 'second', or 'third'
    const validTerms = ['first', 'second', 'third']
    if (term === 'all') {
      return NextResponse.json(
        { error: 'Cannot create fee structure for "all" terms. Please select a specific term (first, second, or third).' },
        { status: 400 }
      )
    }
    
    if (!validTerms.includes(term)) {
      return NextResponse.json(
        { error: `Invalid term value: ${term}. Must be one of: first, second, third` },
        { status: 400 }
      )
    }

    // Check authentication and require bursar or admin role
    const user = await requireAnyRole(request, ['bursar', 'admin'])

    // Check if fee structure already exists for this class, academic year, and term
    const { data: existingStructure, error: checkError } = await supabase
      .from('fee_structures')
      .select('id, name')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .eq('term', term)
      .maybeSingle()

    // Handle check errors (except "no rows found" which is expected)
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing fee structure:', checkError)
      return NextResponse.json(
        { error: 'Failed to verify fee structure uniqueness', details: checkError.message },
        { status: 500 }
      )
    }

    if (existingStructure) {
      // Get class name for better error message
      let className = 'this class'
      try {
        const { data: classData } = await supabase
          .from('classes')
          .select('name')
          .eq('id', classId)
          .single()
        if (classData) {
          className = classData.name
        }
      } catch (e) {
        // Ignore errors getting class name
      }

      return NextResponse.json(
        { 
          error: `A fee structure already exists for ${className} in ${academicYear} - ${term} term. Please edit the existing fee structure or choose a different class, academic year, or term.`,
          existingFeeStructureId: existingStructure.id,
          existingFeeStructureName: existingStructure.name
        },
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
        level: level, // Include level field
        academic_year: academicYear,
        term,
        due_date: dueDate,
        amount: totalAmount || 0,
        description: description || '',
        is_active: isActive !== undefined ? isActive : true,
        created_by: user.id
      })
      .select()
      .single()

    if (structureError) {
      console.error('Error creating fee structure:', structureError)
      
      // Handle unique constraint violation (database-level duplicate prevention)
      if (structureError.code === '23505') { // PostgreSQL unique violation
        // Get class name for better error message
        let className = 'this class'
        try {
          const { data: classData } = await supabase
            .from('classes')
            .select('name')
            .eq('id', classId)
            .single()
          if (classData) {
            className = classData.name
          }
        } catch (e) {
          // Ignore errors getting class name
        }

        return NextResponse.json(
          { 
            error: `A fee structure already exists for ${className} in ${academicYear} - ${term} term. The duplicate was prevented by the database constraint.`,
            details: 'This error indicates a race condition or a duplicate request was made simultaneously.'
          },
          { status: 409 }
        )
      }
      
      // Return more detailed error message for other errors
      const errorMessage = structureError.message || 'Failed to create fee structure'
      return NextResponse.json(
        { error: errorMessage, details: structureError },
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
          created_by: user.id
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

