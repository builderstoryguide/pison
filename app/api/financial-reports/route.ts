import { NextRequest, NextResponse } from 'next/server'
import { pdfGenerator } from '@/lib/pdf-generator'
import { simplePdfGenerator } from '@/lib/simple-pdf-generator'

export async function POST(request: NextRequest) {
  try {
    console.log('PDF generation request received')
    
    const body = await request.json()
    const { reportType, data, options = {} } = body

    console.log('Report type:', reportType)
    console.log('Data received:', {
      paymentsCount: data.payments?.length || 0,
      feeStructuresCount: data.feeStructures?.length || 0,
      assignmentsCount: data.assignments?.length || 0
    })

    let pdfBuffer: Buffer
    let useSimpleGenerator = false

    try {
      // Try to use Puppeteer first
      switch (reportType) {
        case 'payment-report':
          console.log('Generating payment report with Puppeteer...')
          pdfBuffer = await pdfGenerator.generatePaymentReport(data.payments, options)
          break
        
        case 'fee-structure-report':
          console.log('Generating fee structure report with Puppeteer...')
          pdfBuffer = await pdfGenerator.generateFeeStructureReport(data.feeStructures, options)
          break
        
        case 'outstanding-fees-report':
          console.log('Generating outstanding fees report with Puppeteer...')
          pdfBuffer = await pdfGenerator.generateOutstandingFeesReport(data.assignments, options)
          break
        
        case 'comprehensive-report':
          console.log('Generating comprehensive report with Puppeteer...')
          pdfBuffer = await pdfGenerator.generateFinancialReport(data, options)
          break
        
        default:
          console.error('Invalid report type:', reportType)
          return NextResponse.json(
            { error: 'Invalid report type' },
            { status: 400 }
          )
      }
    } catch (puppeteerError) {
      console.warn('Puppeteer failed, falling back to simple generator:', puppeteerError)
      useSimpleGenerator = true
      
      // Fallback to simple generator
      try {
        switch (reportType) {
          case 'payment-report':
            console.log('Generating payment report with simple generator...')
            pdfBuffer = await simplePdfGenerator.generatePaymentReport(data.payments, options)
            break
          
          case 'fee-structure-report':
            console.log('Generating fee structure report with simple generator...')
            pdfBuffer = await simplePdfGenerator.generateFeeStructureReport(data.feeStructures, options)
            break
          
          case 'outstanding-fees-report':
            console.log('Generating outstanding fees report with simple generator...')
            pdfBuffer = await simplePdfGenerator.generateOutstandingFeesReport(data.assignments, options)
            break
          
          case 'comprehensive-report':
            console.log('Generating comprehensive report with simple generator...')
            pdfBuffer = await simplePdfGenerator.generateFinancialReport(data, options)
            break
          
          default:
            throw new Error('Invalid report type')
        }
      } catch (simpleError) {
        console.error('Simple generator also failed:', simpleError)
        throw new Error(`Both PDF generators failed. Puppeteer error: ${puppeteerError instanceof Error ? puppeteerError.message : 'Unknown'}. Simple generator error: ${simpleError instanceof Error ? simpleError.message : 'Unknown'}`)
      }
    }

    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')
    console.log('Generator used:', useSimpleGenerator ? 'Simple' : 'Puppeteer')

    // Return the PDF as a response
    const responseHeaders: Record<string, string> = {
      'Content-Type': useSimpleGenerator ? 'text/html' : 'application/pdf',
      'Content-Disposition': `attachment; filename="financial-report-${Date.now()}.${useSimpleGenerator ? 'html' : 'pdf'}"`,
      'Content-Length': pdfBuffer.length.toString(),
    }

    return new NextResponse(pdfBuffer, {
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Error generating PDF report:', error)
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF report',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    // Clean up the browser instance
    try {
      await pdfGenerator.close()
    } catch (error) {
      console.error('Error closing PDF generator:', error)
    }
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Financial Reports API',
    availableReports: [
      'payment-report',
      'fee-structure-report', 
      'outstanding-fees-report',
      'comprehensive-report'
    ],
    status: 'operational',
    timestamp: new Date().toISOString(),
    generators: ['puppeteer', 'simple-html']
  })
}
