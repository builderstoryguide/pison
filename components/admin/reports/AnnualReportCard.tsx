"use client"

import React, { useRef, useMemo, useState } from 'react'
import { 
  Printer, 
  Download,
  School,
  User,
  Star,
  Award,
  BookOpen,
} from 'lucide-react'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

import { hasGceSubjectCode } from '@/lib/report-card-utils'
import { SubjectGrade } from './report-card-types'

interface AnnualReportCardProps {
  onRefresh?: () => void
  data: {
    student: {
      id: string
      studentId: string
      name: string
      sex: string
      dob: string
      pob: string
      className: string
      classMaster?: string
      enrollment: number
      photoUrl?: string
      speciality?: string
    }
    academic: {
      year: string
      orderNo: string
    }
    subjects: SubjectGrade[]
    totals: {
      coefficient: number
      totalScore: number
      average: number
    }
    history: {
      term1?: number
      term2?: number
      term3?: number
      annualAvg?: number
      rank?: number
    }
    stats: {
      classSize: number
      maxAvg: number
      minAvg: number
      passed: number
      passPercent: number
      classAvg: number
      gceTradeSubjects?: number
      gceRelatedTrade?: number
      gceLanguageSubjects?: number
      gceOtherSubjects?: number
      gceSubjectsPassed?: number
    }
    discipline: {
      absences: number
      suspensions: number
      warnings: number
    }
  }
}

function calculateGrade(mark: number): string {
  if (mark >= 17) return 'A'
  if (mark >= 14) return 'B'
  if (mark >= 12) return 'C'
  if (mark >= 10) return 'D'
  if (mark >= 7) return 'E'
  return 'F'
}

function calculateRemarks(grade: string): string {
  switch (grade) {
    case 'A': return 'Excellent'
    case 'B': return 'Very Good'
    case 'C': return 'Good'
    case 'D': return 'Pass'
    case 'E': return 'Weak'
    case 'F': return 'Fail'
    default: return ''
  }
}

function getCategoryLabel(category: string | undefined): string {
  switch (category) {
    case 'languages': return 'LANGUAGES'
    case 'related_trade_subjects': return 'R.T.S'
    case 'trade_subjects': return 'TRADE SUBJECTS'
    case 'others': return 'OTHER SUBJECTS'
    default: return 'OTHER SUBJECTS'
  }
}

function getCategoryFullLabel(category: string | undefined): string {
  switch (category) {
    case 'languages': return 'LANGUAGES'
    case 'related_trade_subjects': return 'RELATED TRADE SUBJECTS'
    case 'trade_subjects': return 'TRADE SUBJECTS'
    case 'others': return 'OTHER SUBJECTS'
    default: return 'OTHER SUBJECTS'
  }
}

export function AnnualReportCard({ data, onRefresh: _onRefresh }: AnnualReportCardProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [logoError, setLogoError] = React.useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const { toast } = useToast()

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current) return

    setIsGeneratingPDF(true)
    try {
      // Dynamically import html2pdf.js to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default
      
      // Get the report card element
      const element = printRef.current
      
      // Generate filename
      const studentName = data.student.name.replace(/[^a-zA-Z0-9]/g, '_')
      const filename = `ReportCard_${studentName}_${data.academic.year}_Annual.pdf`
      
      // A4 format dimensions in mm
      // const a4Width = 210
      // const a4Height = 297
      
      // Add a small delay to ensure all styles and images are fully loaded
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Calculate scaling to fit on single page (width + height, aligned with TermReportCard)
      const originalStyle = element.getAttribute('style') || ''
      const a4WidthPx = 794
      const a4HeightPx = 1122
      const contentHeight = element.scrollHeight
      const contentWidth = element.scrollWidth

      let scale = 1
      const scaleWidth = a4WidthPx / contentWidth
      const scaleHeight = a4HeightPx / contentHeight
      if (contentHeight > a4HeightPx || contentWidth > a4WidthPx) {
        scale = Math.min(scaleWidth, scaleHeight, 1)
        element.style.transform = `scale(${scale})`
        element.style.transformOrigin = 'top center'
        element.style.width = `${100 / scale}%`
      }

      // Configure PDF options with optimized settings for high-quality output
      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: filename,
        image: { 
          type: 'png' as const, 
          quality: 1.0 
        },
        html2canvas: { 
          scale: 2,
          useCORS: true, 
          logging: false,
          backgroundColor: '#ffffff',
          letterRendering: true, 
          allowTaint: false, 
          scrollY: 0,
          scrollX: 0,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          x: 0,
          y: 0,
          onclone: (clonedDoc: Document) => {
            const source = document.getElementById('annual-report-card-pdf-styles')
            if (source?.textContent) {
              const s = clonedDoc.createElement('style')
              s.textContent = source.textContent
              ;(clonedDoc.head ?? clonedDoc.documentElement).appendChild(s)
            }
            const root = clonedDoc.querySelector('.pdf-report-card') as HTMLElement | null
            root?.classList.add('pdf-capture-mode')
            root?.style.removeProperty('transform')
            root?.style.removeProperty('transform-origin')
            root?.style.removeProperty('width')
          }
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4',
          orientation: 'portrait' as const,
          compress: true,
          precision: 16
        },
        pagebreak: { mode: 'avoid-all' as const }
      }

      // Generate and download PDF
      // @ts-ignore - html2pdf types are loose
      await html2pdf().set(opt).from(element).save()

      // Revert styles
      element.setAttribute('style', originalStyle)
      
      toast.success('PDF downloaded successfully', {
        description: `Report card saved as ${filename}`
      })
    } catch (error) {
      if (printRef.current) {
         const element = printRef.current;
         element.style.transform = '';
         element.style.width = '';
         element.style.transformOrigin = '';
      }
      // eslint-disable-next-line no-console
      console.error('Error generating PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error('PDF generation failed', {
        description: `${errorMessage}. Opening print dialog as fallback.`
      })
      // Fallback to print dialog if PDF generation fails
      setTimeout(() => {
        window.print()
      }, 1000)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const groupedSubjects = React.useMemo(() => {
    const categoryOrder: Array<'languages' | 'related_trade_subjects' | 'trade_subjects' | 'others'> = [
      'languages',
      'related_trade_subjects',
      'trade_subjects',
      'others'
    ]
    const groups: Record<string, typeof data.subjects> = {
      languages: [],
      related_trade_subjects: [],
      trade_subjects: [],
      others: []
    }

    data.subjects.forEach(subject => {
      const category = subject.category || 'others'
      groups[category] = groups[category] || []
      groups[category].push(subject)
    })

    return categoryOrder.map(category => ({
      category,
      subjects: groups[category] || []
    })).filter(group => group.subjects.length > 0)
  }, [data])

  // Calculate category summaries
  // Only include coefficients for subjects that have marks (coefficient > 0)
  const calculateCategorySummary = (subjects: typeof data.subjects, category: string) => {
    // Only count coefficients for subjects with marks (coefficient > 0)
    const coef = subjects.reduce((sum, s) => sum + (s.coefficient > 0 ? s.coefficient : 0), 0)
    const totalScore = subjects.reduce((sum, s) => {
      // Skip subjects without marks (coefficient = 0)
      if (s.coefficient === 0) return sum
      const avg = s.annualAverage ?? 0
      return sum + (avg * s.coefficient)
    }, 0)
    const avg = coef > 0 ? totalScore / coef : 0
    const rank = subjects.length > 0 ? Math.min(...subjects.map(s => s.rank ?? 0).filter(r => r > 0)) || 0 : 0
    const passed = subjects.filter(s => {
      // Skip subjects without marks
      if (s.coefficient === 0) return false
      const avg = s.annualAverage ?? 0
      return avg >= 10
    }).length
    
    // Generate remark based on category and pass/fail status
    const categoryName = category === 'languages' ? 'languages' :
                        category === 'related_trade_subjects' ? 'related trade subjects' :
                        category === 'trade_subjects' ? 'trade subjects' :
                        'other subjects'
    const remark = avg >= 10 
      ? `Pass in ${categoryName}` 
      : `Fail in ${categoryName}`
    
    return { coef, totalScore, avg, rank, passed, remark }
  }

  // GCE counts: subject rows with non-empty code and annual avg >= 10 (coef > 0), aligned with category summaries
  const gceCounts = React.useMemo(() => {
    const anyGceCodeOnSubjects = data.subjects.some(s => hasGceSubjectCode(s.code))

    if (
      !anyGceCodeOnSubjects &&
      data.stats &&
      'gceTradeSubjects' in data.stats &&
      'gceRelatedTrade' in data.stats &&
      'gceOtherSubjects' in data.stats &&
      'gceSubjectsPassed' in data.stats
    ) {
      const lang = data.stats.gceLanguageSubjects ?? 0
      const other = data.stats.gceOtherSubjects ?? 0
      return {
        tradeSubjects: data.stats.gceTradeSubjects ?? 0,
        relatedTrade: data.stats.gceRelatedTrade ?? 0,
        otherSubjects: lang + other,
        passed: data.stats.gceSubjectsPassed ?? 0
      }
    }

    const isGceAnnualPassed = (s: SubjectGrade) => {
      if (s.coefficient === 0) return false
      if (!hasGceSubjectCode(s.code)) return false
      return (s.annualAverage ?? 0) >= 10
    }

    const tradeSubjects =
      groupedSubjects.find(g => g.category === 'trade_subjects')?.subjects.filter(isGceAnnualPassed).length || 0
    const relatedTrade =
      groupedSubjects.find(g => g.category === 'related_trade_subjects')?.subjects.filter(isGceAnnualPassed).length ||
      0
    const otherSubjects =
      groupedSubjects.find(g => g.category === 'others')?.subjects.filter(isGceAnnualPassed).length || 0

    const passed = groupedSubjects.reduce(
      (sum, group) => sum + group.subjects.filter(isGceAnnualPassed).length,
      0
    )

    return { tradeSubjects, relatedTrade, otherSubjects, passed }
  }, [groupedSubjects, data.stats, data.subjects])

  // Generate QR Code data with report card information
  const qrCodeData = useMemo(() => {
    const reportCardInfo = {
      recordId: data.student.id,
      // studentId = form matricule (unique identifier); empty if not provided at enrollment/edit
      studentId: data.student.studentId,
      studentName: data.student.name,
      orderNo: data.academic.orderNo,
      academicYear: data.academic.year,
      className: data.student.className,
      annualAvg: data.history.annualAvg ?? 0,
      rank: data.history.rank ?? 0,
      generatedAt: new Date().toISOString()
    }
    return JSON.stringify(reportCardInfo)
  }, [data])

  return (
    <>
      {/* Embedded styles for PDF generation - ensures styles are preserved */}
      <style id="annual-report-card-pdf-styles" dangerouslySetInnerHTML={{
        __html: `
          @media print, screen {
            .pdf-report-card,
            .pdf-report-card * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            .pdf-report-card {
              width: 210mm !important;
              min-height: 297mm !important;
              max-width: 210mm !important;
              margin: 0 auto !important;
              background: white !important;
              padding: 0 !important;
            }
            
            /* Table Styles */
            .pdf-report-card table {
              border-collapse: collapse !important;
              width: 100% !important;
              table-layout: fixed !important;
            }
            .pdf-report-card table td,
            .pdf-report-card table th {
              border: 1px solid #000 !important;
              padding: 4px 6px !important;
              vertical-align: middle !important; /* Fix for bottom alignment */
              text-align: left; /* Default to left alignment */
            }

            .pdf-report-card .rc-student-grid > div {
              padding: 5px 8px !important;
              vertical-align: top !important;
            }
            
            /* Alignment Overrides */
            .pdf-report-card .text-center { text-align: center !important; }
            .pdf-report-card .text-right { text-align: right !important; }
            .pdf-report-card .text-left { text-align: left !important; }
            
            /* Flexbox utilities */
            .pdf-report-card .flex { display: flex !important; }
            .pdf-report-card .flex-col { flex-direction: column !important; }
            .pdf-report-card .items-center { align-items: center !important; }
            .pdf-report-card .justify-center { justify-content: center !important; }
            .pdf-report-card .justify-between { justify-content: space-between !important; }
            
            /* Grid utilities */
            .pdf-report-card .grid { display: grid !important; }
            .pdf-report-card .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
            .pdf-report-card .col-span-12 { grid-column: span 12 / span 12 !important; }
            .pdf-report-card .col-span-2 { grid-column: span 2 / span 2 !important; }
            .pdf-report-card .col-span-3 { grid-column: span 3 / span 3 !important; }
            .pdf-report-card .col-span-4 { grid-column: span 4 / span 4 !important; }
            .pdf-report-card .col-span-5 { grid-column: span 5 / span 5 !important; }
            .pdf-report-card .col-span-6 { grid-column: span 6 / span 6 !important; }
            .pdf-report-card .col-span-7 { grid-column: span 7 / span 7 !important; }
            .pdf-report-card .row-span-2 { grid-row: span 2 / span 2 !important; }

            /* Spacing & Sizing from TermReportCard */
            .pdf-report-card .p-0\\.5 { padding: 0.125rem !important; }
            .pdf-report-card .p-1 { padding: 0.25rem !important; }
            .pdf-report-card .text-\\[0\\.5rem\\] { font-size: 0.5rem !important; }
            .pdf-report-card .text-\\[0\\.6rem\\] { font-size: 0.6rem !important; }
            .pdf-report-card .text-\\[0\\.55rem\\] { font-size: 0.55rem !important; }
            .pdf-report-card .text-\\[6pt\\] { font-size: 6pt !important; }
            .pdf-report-card .text-\\[7pt\\] { font-size: 7pt !important; }

             /* Print-specific overrides */
            @media print {
              .pdf-report-card .print\\:text-\\[6pt\\] { font-size: 6pt !important; }
              .pdf-report-card .print\\:text-\\[7pt\\] { font-size: 7pt !important; }
              .pdf-report-card .print\\:p-0\\.5 { padding: 0.125rem !important; }
            }

            .pdf-report-card.pdf-capture-mode {
              font-size: 8pt !important;
              box-shadow: none !important;
            }
            .pdf-report-card.pdf-capture-mode div.border.border-black:has(> table.w-full:first-child) {
              border: none !important;
            }
            .pdf-report-card.pdf-capture-mode table {
              border-collapse: collapse !important;
              border-spacing: 0 !important;
              border-top: 1px solid #000 !important;
              border-left: 1px solid #000 !important;
            }
            .pdf-report-card.pdf-capture-mode table td,
            .pdf-report-card.pdf-capture-mode table th {
              border: none !important;
              border-right: 1px solid #000 !important;
              border-bottom: 1px solid #000 !important;
              padding: 4px 6px !important;
              vertical-align: middle !important;
            }
            .pdf-report-card.pdf-capture-mode .grid.grid-cols-12.border-black.font-mono {
              border: none !important;
              border-top: 1px solid #000 !important;
              border-left: 1px solid #000 !important;
            }
            .pdf-report-card.pdf-capture-mode .grid.grid-cols-12.border-black.font-mono > div {
              border: none !important;
              border-right: 1px solid #000 !important;
              border-bottom: 1px solid #000 !important;
            }
            .pdf-report-card.pdf-capture-mode .border-2 {
              border-width: 1px !important;
            }
            .pdf-report-card.pdf-capture-mode .border-b-2 {
              border-bottom-width: 1px !important;
            }
            @media (min-width: 768px) {
              .pdf-report-card.pdf-capture-mode .grid.grid-cols-12.border-black.font-mono > div.md\\:border-b-0 {
                border-bottom: none !important;
              }
            }
            .pdf-report-card.pdf-capture-mode .print\\:p-0 { padding: 0 !important; }
            .pdf-report-card.pdf-capture-mode .print\\:p-0\\.5 { padding: 0.125rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:p-1 { padding: 0.25rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:pt-2 { padding-top: 0.5rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:pb-2 { padding-bottom: 0.5rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:mb-0 { margin-bottom: 0 !important; }
            .pdf-report-card.pdf-capture-mode .print\\:mb-0\\.5 { margin-bottom: 0.125rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:mb-1 { margin-bottom: 0.25rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:mt-0\\.5 { margin-top: 0.125rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:gap-1 { gap: 0.25rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:space-y-0 > * + * { margin-top: 0 !important; }
            .pdf-report-card.pdf-capture-mode .print\\:text-\\[6pt\\] { font-size: 6pt !important; }
            .pdf-report-card.pdf-capture-mode .print\\:text-\\[7pt\\] { font-size: 7pt !important; }
            .pdf-report-card.pdf-capture-mode .print\\:text-\\[8pt\\] { font-size: 8pt !important; }
            .pdf-report-card.pdf-capture-mode .print\\:text-2xl { font-size: 1.5rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:text-lg { font-size: 1.125rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:text-xl { font-size: 1.25rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:w-1 { width: 0.25rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:w-3 { width: 0.75rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:w-4 { width: 1rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:w-8 { width: 2rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:w-10 { width: 2.5rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:w-12 { width: 3rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:h-1 { height: 0.25rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:h-0\\.5 { height: 0.125rem !important; }
            .pdf-report-card.pdf-capture-mode .print\\:hidden { display: none !important; }
            .pdf-report-card.pdf-capture-mode .print\\:block { display: block !important; }
            .pdf-report-card.pdf-capture-mode .print\\:shadow-none { box-shadow: none !important; }
            .pdf-report-card.pdf-capture-mode .print\\:w-full { width: 100% !important; }
            .pdf-report-card.pdf-capture-mode .print\\:max-w-full { max-width: 100% !important; }
            .pdf-report-card.pdf-capture-mode .print\\:h-\\[297mm\\] { min-height: 297mm !important; height: auto !important; }
            .pdf-report-card.pdf-capture-mode .print\\:border { border-width: 1px !important; }
            .pdf-report-card.pdf-capture-mode .print\\:leading-\\[1\\.1\\] { line-height: 1.1 !important; }
            .pdf-report-card.pdf-capture-mode .print\\:left-1 { left: 0.25rem !important; }
            .pdf-report-card.pdf-capture-mode [class*="cursor-pointer"] { cursor: default !important; }
            .pdf-report-card.pdf-capture-mode [class*="hover:"] { background-color: transparent !important; }
          }
        `
      }} />

    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-900 print:p-0">
      
      {/* Control Bar */}
      <div className="print:hidden max-w-[210mm] mx-auto mb-4 flex justify-end gap-2">
        <Button onClick={handleDownloadPDF} variant="default" size="sm" disabled={isGeneratingPDF}>
          <Download className="h-4 w-4 mr-2" />
          {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
        </Button>
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Main Report Card Sheet */}
      <div className="pdf-report-card max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full print:max-w-full overflow-hidden text-xs print:text-[8pt] relative print:h-[297mm]" ref={printRef}>
        
        {/* Top Border */}
        <div className="h-1 print:h-0.5 w-full bg-black print:block" style={{ color: 'rgba(17, 24, 39, 1)' }} />

        <div className="px-2 print:px-3 pt-2 print:pt-2 pb-2 print:pb-2 flex flex-col gap-0 relative" style={{ color: 'rgba(26, 26, 26, 1)' }}>
          
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
            <img 
              src="/pison.png" 
              alt="Watermark" 
              className="w-[90%] h-auto opacity-[0.06] transform -rotate-6"
              style={{ filter: 'contrast(1.5) brightness(1.5)' }}
            />
          </div>

          {/* Header — same structure as term card for consistent export */}
          <header className="grid grid-cols-1 md:grid-cols-3 md:items-stretch gap-3 print:gap-2 mb-2 print:mb-1 border-b-2 border-black pb-2 print:pb-1 relative z-10">
            <div className="flex flex-col justify-center text-center md:text-left text-[0.55rem] print:text-[7pt] uppercase font-medium leading-tight gap-1 print:gap-0.5 min-h-[6.5rem] md:min-h-[7.25rem] w-full">
              <p className="print:leading-[1.15]">République du Cameroun</p>
              <p className="print:leading-[1.15]">Paix - Travail - Patrie</p>
              <p className="print:leading-[1.15]">Ministère des Enseignements Secondaires</p>
              <p className="print:leading-[1.15]">Délégation Régional de Littoral</p>
              <p className="font-bold text-black print:leading-[1.15]">PISON ACADEMY OF EXCELLENCE</p>
            </div>

            <div className="flex flex-col items-center justify-center gap-1.5 print:gap-1 min-h-[6.5rem] md:min-h-[7.25rem]">
              <div className="w-24 print:w-24 h-24 print:h-24 shrink-0 relative overflow-hidden flex items-center justify-center">
                {logoError ? (
                  <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-full">
                    <School size={24} className="text-gray-400 print:w-4 print:h-4" />
                  </div>
                ) : (
                  <img 
                    src="/pison.png" 
                    alt="Pison Academy Logo" 
                    className="max-w-full max-h-full object-contain" 
                    onError={() => setLogoError(true)}
                  />
                )}
              </div>
              <div className="text-[0.5rem] print:text-[6pt] font-mono w-full max-w-[15rem] mx-auto text-center leading-snug px-1">
                ORDER Nº: <span className="text-red-600 font-bold break-words">{data.academic.orderNo}</span>
              </div>
            </div>

            <div className="flex flex-col justify-center text-right text-[0.55rem] print:text-[7pt] uppercase font-medium leading-tight gap-1 print:gap-0.5 min-h-[6.5rem] md:min-h-[7.25rem]">
              <p className="print:leading-[1.15]">Republic of Cameroon</p>
              <p className="print:leading-[1.15]">Peace - Work - Fatherland</p>
              <p className="print:leading-[1.15]">Ministry of Secondary Education</p>
              <p className="print:leading-[1.15]">Regional Delegation of Littoral</p>
              <p className="font-bold text-blue-800 print:leading-[1.15]">PISON ACADEMY OF EXCELLENCE</p>
              <p className="normal-case text-red-600 text-[0.5rem] print:text-[6pt] print:leading-[1.15]">PO Box 58 Edea Tel: 676521570</p>
            </div>
          </header>

          {/* Title Banner */}
          <div className="mb-1 print:mb-0.5 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between bg-black text-white p-0.5 print:p-0.5 mb-0.5 print:mb-0.5">
              <span className="font-mono text-[0.5rem] print:text-[6pt] uppercase tracking-widest px-1">Academic Year {data.academic.year}</span>
              <div className="flex-1 mx-2 h-px bg-white/50 hidden md:block"></div>
              <span className="font-mono text-[0.5rem] print:text-[6pt] uppercase tracking-widest px-1">Année Scolaire {data.academic.year}</span>
            </div>
            
            <div className="border-2 print:border border-black p-2 print:p-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-100 to-transparent opacity-30"></div>
              
              {/* QR Code */}
              <div className="absolute left-2 print:left-1 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-80 z-20" style={{ transform: 'translateY(-50%)' }}>
                <div className="bg-white p-0.5 print:p-0.5 border border-black shadow-sm">
                  <QRCode
                    value={qrCodeData}
                    size={64}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 64 64`}
                  />
                </div>
              </div>

              {/* Center Text */}
              <div className="flex flex-col items-center justify-center relative z-10 mx-auto max-w-[60%]">
                <h2 className="font-black text-xl print:text-2xl uppercase tracking-tighter leading-none mb-0.5 print:mb-0.5 text-left">
                  <span className="text-black/80">ANNUAL</span> <span className="relative inline-block">REPORT CARD</span>
                </h2>
                <div className="flex items-center gap-1 w-full justify-center">
                  <div className="h-0.5 w-6 bg-black/30"></div>
                  <p className="text-[0.5rem] print:text-[6pt] font-bold tracking-widest text-black/60 uppercase whitespace-nowrap flex items-center gap-0.5">
                    <Star size={8} className="text-black/60 fill-black/60 print:w-1 print:h-1" /> Bulletin Annuel <Star size={8} className="text-black/60 fill-black/60 print:w-1 print:h-1" />
                  </p>
                  <div className="h-0.5 w-6 bg-black/30"></div>
                </div>
              </div>

              {/* Decorative Icons - Hidden in print */}
              <Award size={80} className="absolute -right-8 -top-8 text-black/5 transform rotate-12 pointer-events-none print:hidden" />
              <BookOpen size={80} className="absolute -left-8 -bottom-8 text-black/5 transform -rotate-12 pointer-events-none print:hidden" />
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="rc-student-grid border border-black grid grid-cols-12 mb-1 print:mb-0.5 font-mono text-[0.65rem] print:text-[7pt] relative z-10 bg-white/90">
            <div className="col-span-12 md:col-span-4 border-b md:border-r border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Unique Identifier No / Matricule</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.studentId}</span>
            </div>
            <div className="col-span-12 md:col-span-6 border-b md:border-r border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Name & Surname / Noms et Prénoms</span>
              <span className="font-bold text-[0.7rem] print:text-[7pt]">{data.student.name}</span>
            </div>
            <div className="col-span-12 md:col-span-2 border-b border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Repeater / Redoublant</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">NO / NON</span>
            </div>

            <div className="col-span-2 border-b border-r border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Sex</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.sex}</span>
            </div>
            <div className="col-span-7 border-b border-r border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Date & Place of Birth / Né le - à</span>
              <div className="flex gap-1 text-[0.65rem] print:text-[7pt]">
                <span className="font-bold">{data.student.dob}</span>
                <span className="text-gray-400">|</span>
                <span className="font-bold">{data.student.pob}</span>
              </div>
            </div>
            
            {/* Photo Area */}
            <div className="col-span-3 row-span-2 border-b border-black flex flex-col items-center justify-center bg-gray-50 min-h-[4rem]">
              {data.student.photoUrl ? (
                <img src={data.student.photoUrl} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <div className="text-left text-gray-400 text-[0.5rem] print:text-[6pt]">
                  <User size={20} className="mx-auto mb-0.5 opacity-20 print:w-3 print:h-3" />
                  PHOTO
                </div>
              )}
            </div>

            <div className="col-span-5 border-b md:border-b-0 border-r border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Speciality</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.speciality || 'General'}</span>
            </div>
            <div className="col-span-2 border-b md:border-b-0 border-r border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Class</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.className}</span>
            </div>
            <div className="col-span-2 border-b md:border-b-0 border-r border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Master</span>
              <span className="font-bold text-[0.6rem] print:text-[6pt]">{data.student.classMaster || '-'}</span>
            </div>
          </div>

          {/* Grades Table */}
          <div className="border border-black mb-1 print:mb-0.5 overflow-hidden relative z-10 bg-white/90">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-[0.55rem] print:text-[7pt] uppercase font-bold border-b border-black">
                <tr>
                  <th className="p-1 print:p-0.5 border-r border-black w-12 print:w-10" style={{ fontSize: '7pt' }}></th>
                  <th className="p-1 print:p-0.5 border-r border-black w-1/3 text-left" style={{ fontSize: '7pt' }}>Subjects</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>Marks</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>Coef</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>TOTAL</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>Grade</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>Rank</th>
                  <th className="p-1 print:p-0.5 text-left" style={{ fontSize: '7pt' }}>Remarks</th>
                </tr>
              </thead>
              <tbody className="text-[0.6rem] print:text-[7pt] font-mono report-card-subjects-tbody">
                {groupedSubjects.map((group, groupIdx) => {
                  const summary = calculateCategorySummary(group.subjects, group.category)
                  const categoryLabel = getCategoryLabel(group.category)
                  // Calculate reverse order for print (last item gets order 1, first gets highest order)
                  const printOrder = groupedSubjects.length - groupIdx
                  
                  return (
                    <React.Fragment key={group.category}>
                      {group.subjects.map((subject, idx) => {
                        const avg = subject.annualAverage ?? 0
                        // Only calculate totalScore if coefficient > 0 (subject has marks)
                        const totalScore = subject.coefficient > 0 ? avg * subject.coefficient : 0
                        const grade = subject.grade || calculateGrade(avg)
                        const remarks = subject.remarks || calculateRemarks(grade)

                        return (
                          <tr 
                            key={`${group.category}-${idx}`} 
                            className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent"
                            style={{ '--print-order': printOrder } as React.CSSProperties}
                          >
                            {/* Category Label - Only on first row of section */}
                            {idx === 0 && (
                              <td 
                                rowSpan={group.subjects.length + 1} 
                                className="border-r border-black bg-gray-200 text-center font-bold text-[0.55rem] print:text-[6pt] p-0 print:p-0 uppercase whitespace-nowrap relative"
                                style={{ 
                                  width: '30px',
                                  minWidth: '30px'
                                }}
                              >
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span style={{ 
                                    transform: 'rotate(-90deg)',
                                    display: 'inline-block',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {categoryLabel}
                                  </span>
                                </div>
                              </td>
                            )}
                            <td className="p-1 print:p-0.5 border-r border-gray-300 font-medium">{subject.subjectName}</td>
                            <td className="p-1 print:p-0.5 border-r border-gray-300 text-center">{avg > 0 ? avg.toFixed(1) : '-'}</td>
                            <td className="p-1 print:p-0.5 border-r border-gray-300 text-center">{subject.coefficient > 0 ? subject.coefficient : '-'}</td>
                            <td className="p-1 print:p-0.5 border-r border-gray-300 text-center">{totalScore > 0 ? totalScore.toFixed(0) : '-'}</td>
                            <td className={`p-1 print:p-0.5 border-r border-gray-300 text-center font-bold ${grade === 'F' || grade === 'E' || grade === 'U' ? 'text-red-600' : ''}`}>
                              {grade}
                            </td>
                            <td className="p-1 print:p-0.5 border-r border-gray-300 text-center">{subject.rank ?? '-'}</td>
                            <td className={`p-1 print:p-0.5 ${remarks.includes('Fail') || remarks.includes('Weak') || remarks.includes('Very weak') ? 'text-red-600' : 'text-green-700'}`}>
                              {remarks}
                            </td>
                          </tr>
                        )
                      })}
                      {/* Category Summary Row */}
                      <tr 
                        className="bg-gray-300 font-bold border-b border-black"
                        style={{ '--print-order': printOrder } as React.CSSProperties}
                      >
                        <td className="p-1 print:p-0.5 border-r border-black uppercase text-[0.55rem] print:text-[6pt] text-left">{getCategoryFullLabel(group.category)} Summary</td>
                        <td className="p-1 print:p-0.5 border-r border-black text-center text-gray-400">/</td>
                        <td className="p-1 print:p-0.5 border-r border-black text-center">{summary.coef}</td>
                        <td className="p-1 print:p-0.5 border-r border-black text-center">{summary.totalScore.toFixed(0)}</td>
                        <td className="p-1 print:p-0.5 border-r border-black text-center whitespace-nowrap text-[0.55rem] print:text-[6pt]">AV: {summary.avg.toFixed(2)}</td>
                        <td className="p-1 print:p-0.5 border-r border-black text-center">{summary.rank > 0 ? summary.rank : '-'}</td>
                        <td className="p-1 print:p-0.5 uppercase text-[0.55rem] print:text-[6pt] text-left">{summary.remark}</td>
                      </tr>
                    </React.Fragment>
                  )
                })}
                
                {/* Total Summary Row */}
                <tr 
                  className="bg-black text-white font-bold text-[0.65rem] print:text-[7pt]"
                  style={{ '--print-order': 0 } as React.CSSProperties}
                >
                  <td colSpan={2} className="p-1 print:p-0.5 text-left uppercase border-r border-gray-600">Total Summary / Bilan Totale</td>
                  <td className="p-1 print:p-0.5 text-center border-r border-gray-600">/</td>
                  <td className="p-1 print:p-0.5 text-center border-r border-gray-600">{data.totals.coefficient}</td>
                  <td className="p-1 print:p-0.5 text-center border-r border-gray-600">{data.totals.totalScore.toFixed(0)}</td>
                  <td colSpan={2} className="bg-gray-100"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 print:gap-1 mb-2 print:mb-1 relative z-10">
            
            {/* Left Column: Term History & Discipline */}
            <div className="col-span-12 md:col-span-4 flex flex-col gap-0">
              <div className="border border-black bg-white/90">
                <div className="bg-gray-100 p-0.5 print:p-0.5 text-left text-[0.55rem] print:text-[6pt] font-bold uppercase border-b border-black">
                  Student&apos;s Evaluation Results
                </div>
                <table className="w-full text-[0.6rem] print:text-[7pt]">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="p-0.5 print:p-0.5 border-r border-gray-300">TERM</th>
                      <th className="p-0.5 print:p-0.5 border-r border-gray-300">1</th>
                      <th className="p-0.5 print:p-0.5 border-r border-gray-300">2</th>
                      <th className="p-0.5 print:p-0.5">3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-300 font-mono">
                      <td className="p-0.5 print:p-0.5 font-bold border-r border-gray-300 text-left pl-1">AVERAGE</td>
                      <td className="p-0.5 print:p-0.5 border-r border-gray-300">{data.history.term1?.toFixed(1) ?? '-'}</td>
                      <td className="p-0.5 print:p-0.5 border-r border-gray-300">{data.history.term2?.toFixed(1) ?? '-'}</td>
                      <td className="p-0.5 print:p-0.5 font-bold">{data.history.term3?.toFixed(1) ?? '-'}</td>
                    </tr>
                    <tr className="font-mono">
                      <td className="p-0.5 print:p-0.5 font-bold border-r border-gray-300 text-left pl-1">RANK</td>
                      <td className="p-0.5 print:p-0.5 border-r border-gray-300">-</td>
                      <td className="p-0.5 print:p-0.5 border-r border-gray-300">-</td>
                      <td className="p-0.5 print:p-0.5">{data.history.rank ?? '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border border-black bg-white/90">
                <div className="bg-gray-100 p-0.5 print:p-0.5 text-left text-[0.55rem] print:text-[6pt] font-bold uppercase border-b border-black">
                  Discipline And Conduct
                </div>
                <div className="text-[0.6rem] print:text-[7pt] p-1 print:p-0.5 space-y-1">
                  <div className="flex justify-between border-b border-gray-200 pb-0.5">
                    <span>Unjustified Absences</span>
                    <span className="font-mono font-bold">{data.discipline.absences}hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Suspensions</span>
                    <span className="font-mono font-bold">{data.discipline.suspensions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Warnings</span>
                    <span className="font-mono font-bold">{data.discipline.warnings}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column: Annual Average Circle */}
            <div className="col-span-12 md:col-span-4 flex items-center justify-center py-2 print:py-1">
              <div className="flex flex-col gap-0 items-center">
                <div className="w-24 print:w-20 h-24 print:h-20 rounded-full flex flex-col items-center justify-center z-10">
                  <span className="text-[0.5rem] print:text-[6pt] text-gray-500 uppercase font-bold">Annual Average</span>
                  <span className="text-2xl print:text-xl font-black">{data.history.annualAvg?.toFixed(2) ?? '0.00'}</span>
                  <span className={`text-[0.5rem] print:text-[6pt] font-bold uppercase ${(data.history.annualAvg ?? 0) >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                    {(data.history.annualAvg ?? 0) >= 10 ? 'Passed' : 'Failed'}
                  </span>
                </div>
                <div className="w-16 print:w-14 h-16 print:h-14 rounded-full flex flex-col items-center justify-center z-10 mt-1">
                  <span className="text-[0.5rem] print:text-[6pt] text-gray-500 uppercase font-bold">Rank</span>
                  <span className="text-lg print:text-base font-black">{data.history.rank ?? '-'}</span>
                </div>
              </div>
            </div>

            {/* Right Column: GCE Section */}
            <div className="col-span-12 md:col-span-4">
              <div className="border border-black bg-white/90">
                <div className="border-b border-gray-300 p-1 print:p-0.5">
                  <h4 className="font-bold text-[0.6rem] print:text-[7pt] text-left">GCE SECTION</h4>
                </div>
                <div className="space-y-0.5 font-mono text-[0.6rem] print:text-[7pt] p-1 print:p-0.5">
                  <div className="flex justify-between"><span>Trade Subjects:</span> <span>{gceCounts.tradeSubjects.toString().padStart(2, '0')}</span></div>
                  <div className="flex justify-between"><span>Related Trade:</span> <span>{gceCounts.relatedTrade.toString().padStart(2, '0')}</span></div>
                  <div className="flex justify-between"><span>Other Subjects:</span> <span>{gceCounts.otherSubjects.toString().padStart(2, '0')}</span></div>
                  <div className="flex justify-between font-bold pt-1 border-t border-gray-300 mt-1">
                    <span>GCE SUBJECTS PASSED:</span> <span>{gceCounts.passed.toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 print:gap-1 mt-auto relative z-10">
            <div className="border border-black p-1.5 print:p-1 text-[0.6rem] print:text-[7pt] flex flex-col justify-between bg-white/90" style={{ height: '60px' }}>
              <h4 className="font-bold text-left underline">The Class Master</h4>
              <div className="text-left font-script text-sm print:text-xs opacity-70">{data.student.classMaster || ''}</div>
              <div className="text-[0.5rem] print:text-[6pt] text-left text-gray-400 mt-0.5 italic">Signature</div>
            </div>

            <div className="border border-black p-1.5 print:p-1 text-[0.6rem] print:text-[7pt] flex flex-col justify-between bg-white/90" style={{ height: '60px' }}>
              <h4 className="font-bold text-left underline">The Principal</h4>
              <div className="text-left font-script text-sm print:text-xs opacity-70">Dr. Pison</div>
              <div className="text-[0.5rem] print:text-[6pt] text-left text-gray-400 mt-0.5 italic">Stamp & Signature</div>
            </div>
          </div>
          
          <div className="text-[0.5rem] print:text-[6pt] text-center text-gray-400 mt-1 print:mt-0.5 font-mono uppercase relative z-10">
            This document is computer generated and contains no alterations.
          </div>

        </div>
        
        {/* Bottom Border */}
        <div className="h-1 print:h-0.5 w-full bg-black print:block" />
      </div>
    </div>
    </>
  )
}

export default AnnualReportCard
