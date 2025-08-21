import { useState } from 'react'
import { useToast } from './use-toast'

export interface PDFExportOptions {
  format?: 'A4' | 'Letter'
  margin?: {
    top: string
    right: string
    bottom: string
    left: string
  }
  header?: {
    title: string
    subtitle?: string
  }
  footer?: {
    text: string
    pageNumbers?: boolean
  }
}

export function usePDFExport() {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const generatePDF = async (
    reportType: string,
    data: any,
    options: PDFExportOptions = {}
  ): Promise<boolean> => {
    setIsGenerating(true)
    
    try {
      console.log('Starting PDF generation for:', reportType)
      console.log('Data to be sent:', {
        reportType,
        dataKeys: Object.keys(data),
        dataSizes: {
          payments: data.payments?.length || 0,
          feeStructures: data.feeStructures?.length || 0,
          assignments: data.assignments?.length || 0
        }
      })

      const response = await fetch('/api/financial-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          data,
          options
        }),
      })

      console.log('API response status:', response.status)
      console.log('API response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error response:', errorData)
        throw new Error(errorData.error || errorData.details || 'Failed to generate PDF')
      }

      // Get the PDF blob
      const pdfBlob = await response.blob()
      console.log('PDF blob received, size:', pdfBlob.size, 'bytes')
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename based on report type and date
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${reportType}-${timestamp}.pdf`
      link.download = filename
      
      console.log('Triggering download with filename:', filename)
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      window.URL.revokeObjectURL(url)
      
      toast.success('PDF report generated and downloaded successfully')
      console.log('PDF generation completed successfully')
      return true
    } catch (error) {
      console.error('Error generating PDF:', error)
      
      // Provide more detailed error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      
      toast.error(`Failed to generate PDF report: ${errorMessage}`)
      return false
    } finally {
      setIsGenerating(false)
    }
  }

  const exportPaymentReport = async (payments: any[], options: PDFExportOptions = {}) => {
    console.log('Exporting payment report with', payments.length, 'payments')
    return generatePDF('payment-report', { payments }, {
      header: { title: 'Payment Report' },
      ...options
    })
  }

  const exportFeeStructureReport = async (feeStructures: any[], options: PDFExportOptions = {}) => {
    console.log('Exporting fee structure report with', feeStructures.length, 'structures')
    return generatePDF('fee-structure-report', { feeStructures }, {
      header: { title: 'Fee Structure Report' },
      ...options
    })
  }

  const exportOutstandingFeesReport = async (assignments: any[], options: PDFExportOptions = {}) => {
    console.log('Exporting outstanding fees report with', assignments.length, 'assignments')
    return generatePDF('outstanding-fees-report', { assignments }, {
      header: { title: 'Outstanding Fees Report' },
      ...options
    })
  }

  const exportComprehensiveReport = async (data: any, options: PDFExportOptions = {}) => {
    console.log('Exporting comprehensive report with data:', {
      payments: data.payments?.length || 0,
      feeStructures: data.feeStructures?.length || 0,
      studentFeeAssignments: data.studentFeeAssignments?.length || 0
    })
    return generatePDF('comprehensive-report', data, {
      header: { title: 'Comprehensive Financial Report' },
      ...options
    })
  }

  return {
    isGenerating,
    generatePDF,
    exportPaymentReport,
    exportFeeStructureReport,
    exportOutstandingFeesReport,
    exportComprehensiveReport,
  }
}
