import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const classId = searchParams.get('classId')
    const feeCategoryId = searchParams.get('feeCategoryId')
    const format = searchParams.get('format') || 'json'

    const { data, error } = await supabase.rpc('generate_revenue_report', {
      start_date: startDate,
      end_date: endDate,
      class_id: classId,
      fee_category_id: feeCategoryId
    })

    if (error) {
      console.error('Error generating revenue report:', error)
      return NextResponse.json(
        { error: 'Failed to generate revenue report' },
        { status: 500 }
      )
    }

    // Transform data for better frontend consumption
    const transformedData = data?.map((row: any) => ({
      monthName: row.month_name,
      className: row.class_name,
      feeCategory: row.fee_category,
      totalPayments: parseInt(row.total_payments),
      totalRevenue: parseFloat(row.total_revenue || 0),
      averagePayment: parseFloat(row.average_payment || 0),
      uniqueStudents: parseInt(row.unique_students)
    }))

    // Calculate summary statistics
    const summary = {
      totalRevenue: transformedData?.reduce((sum: number, row: any) => sum + row.totalRevenue, 0) || 0,
      totalPayments: transformedData?.reduce((sum: number, row: any) => sum + row.totalPayments, 0) || 0,
      averageRevenue: transformedData?.length > 0 
        ? transformedData.reduce((sum: number, row: any) => sum + row.totalRevenue, 0) / transformedData.length 
        : 0,
      uniqueStudents: new Set(transformedData?.flatMap((row: any) => Array(row.uniqueStudents).fill(row.className)) || []).size,
      topClass: transformedData?.reduce((max: any, row: any) => 
        row.totalRevenue > (max?.totalRevenue || 0) ? row : max, null)?.className || 'N/A',
      topCategory: transformedData?.reduce((max: any, row: any) => 
        row.totalRevenue > (max?.totalRevenue || 0) ? row : max, null)?.feeCategory || 'N/A'
    }

    if (format === 'csv') {
      // Generate CSV format
      const csvHeaders = 'Month,Class,Fee Category,Total Payments,Total Revenue,Average Payment,Unique Students\n'
      const csvRows = transformedData?.map((row: any) => 
        `${row.monthName},${row.className},${row.feeCategory},${row.totalPayments},${row.totalRevenue},${row.averagePayment},${row.uniqueStudents}`
      ).join('\n') || ''
      
      const csvContent = csvHeaders + csvRows
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="revenue-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      data: transformedData,
      summary,
      filters: {
        startDate,
        endDate,
        classId,
        feeCategoryId
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in revenue report GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

