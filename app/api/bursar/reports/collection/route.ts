import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const paymentMethodId = searchParams.get('paymentMethodId')
    const format = searchParams.get('format') || 'json'

    // Build the query
    let query = `
      SELECT 
        month_name,
        payment_method,
        total_transactions,
        total_amount,
        average_amount,
        unique_students,
        unique_collectors
      FROM collection_report_view
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    if (startDate) {
      query += ` AND month >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      query += ` AND month <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    if (paymentMethodId) {
      query += ` AND payment_method_code = $${paramIndex}`
      params.push(paymentMethodId)
      paramIndex++
    }

    query += ` ORDER BY month DESC, total_amount DESC`

    const { data, error } = await supabase.rpc('generate_collection_report', {
      start_date: startDate,
      end_date: endDate,
      payment_method_id: paymentMethodId
    })

    if (error) {
      console.error('Error generating collection report:', error)
      return NextResponse.json(
        { error: 'Failed to generate collection report' },
        { status: 500 }
      )
    }

    // Transform data for better frontend consumption
    const transformedData = data?.map((row: any) => ({
      monthName: row.month_name,
      paymentMethod: row.payment_method,
      totalTransactions: parseInt(row.total_transactions),
      totalAmount: parseFloat(row.total_amount || 0),
      averageAmount: parseFloat(row.average_amount || 0),
      uniqueStudents: parseInt(row.unique_students),
      uniqueCollectors: parseInt(row.unique_collectors)
    }))

    // Calculate summary statistics
    const summary = {
      totalTransactions: transformedData?.reduce((sum: number, row: any) => sum + row.totalTransactions, 0) || 0,
      totalAmount: transformedData?.reduce((sum: number, row: any) => sum + row.totalAmount, 0) || 0,
      averageAmount: transformedData?.length > 0 
        ? transformedData.reduce((sum: number, row: any) => sum + row.totalAmount, 0) / transformedData.length 
        : 0,
      uniqueStudents: new Set(transformedData?.flatMap((row: any) => Array(row.uniqueStudents).fill(row.paymentMethod)) || []).size,
      uniqueCollectors: new Set(transformedData?.flatMap((row: any) => Array(row.uniqueCollectors).fill(row.paymentMethod)) || []).size
    }

    if (format === 'csv') {
      // Generate CSV format
      const csvHeaders = 'Month,Payment Method,Total Transactions,Total Amount,Average Amount,Unique Students,Unique Collectors\n'
      const csvRows = transformedData?.map((row: any) => 
        `${row.monthName},${row.paymentMethod},${row.totalTransactions},${row.totalAmount},${row.averageAmount},${row.uniqueStudents},${row.uniqueCollectors}`
      ).join('\n') || ''
      
      const csvContent = csvHeaders + csvRows
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="collection-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      data: transformedData,
      summary,
      filters: {
        startDate,
        endDate,
        paymentMethodId
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in collection report GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

