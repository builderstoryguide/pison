"use client"

import React, { useRef, useMemo, useState, useEffect } from 'react'
import { 
  Download, 
  GraduationCap,
  School,
  User,
  Star,
  Award,
  BookOpen,
  Eye,
  X,
  Pencil,
} from 'lucide-react'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'
import { getSequenceName, getSequenceNumberFromKey } from '@/lib/report-card-utils'
import { EditMarkDialog } from './EditMarkDialog'
// html2pdf.js will be dynamically imported to avoid SSR issues

import { SubjectGrade } from './report-card-types'

interface TermReportCardProps {
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
      term: 1 | 2 | 3
      orderNo: string
    }
    subjects: SubjectGrade[]
    totals: {
      coefficient: number
      totalScore: number
      average: number
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
      gceOtherSubjects?: number
      gceSubjectsPassed?: number
    }
    discipline: {
      absences: number
      suspensions: number
      warnings: number
    }
    history?: {
      term1?: number
      term2?: number
      term3?: number
      rank?: number
    }
  }
  classId?: string
  onRefresh?: () => void
}

const TERM_NAMES: Record<number, { en: string, fr: string, ordinal: string }> = {
  1: { en: 'FIRST TERM', fr: 'Premier Trimestre', ordinal: 'FIRST' },
  2: { en: 'SECOND TERM', fr: 'Deuxième Trimestre', ordinal: 'SECOND' },
  3: { en: 'THIRD TERM', fr: 'Troisième Trimestre', ordinal: 'THIRD' },
}

const SEQUENCE_LABELS: Record<number, { seq1: string, seq2: string }> = {
  1: { seq1: 'Seq 1', seq2: 'Seq 2' },
  2: { seq1: 'Seq 3', seq2: 'Seq 4' },
  3: { seq1: 'Seq 5', seq2: 'Seq 6' },
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

function getSpecialityFromClass(className: string | undefined, speciality: string | undefined): string {
  // If speciality is provided, use it
  if (speciality && speciality.trim() !== '') {
    return speciality
  }
  
  // Otherwise, derive from class name
  if (!className) return ''
  
  const classUpper = className.toUpperCase().trim()
  
  // Check for common class patterns
  if (classUpper.startsWith('AC')) {
    return 'Accounting'
  }
  if (classUpper.startsWith('SEC')) {
    return 'Secretariat'
  }
  if (classUpper.startsWith('COM')) {
    return 'Commerce'
  }
  if (classUpper.startsWith('MAN')) {
    return 'Management'
  }
  if (classUpper.startsWith('MKT')) {
    return 'Marketing'
  }
  
  // If no match, return empty string instead of "General"
  return ''
}

export function TermReportCard({ data, classId, onRefresh }: TermReportCardProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [logoError, setLogoError] = React.useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewScale, setPreviewScale] = useState(0.75)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  
  // Edit mark/coefficient dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<{
    subjectId: string
    subjectName: string
    sequenceNumber?: number
    sequenceName?: string
    currentMark?: number
    currentCoefficient?: number
    editType: 'mark' | 'coefficient' | 'both'
  } | null>(null)
  
  const isAdmin = user?.role === 'admin'

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
      const filename = `ReportCard_${studentName}_${data.academic.year}_Term${data.academic.term}.pdf`
      
      // A4 format dimensions in mm
      const a4Width = 210
      const a4Height = 297
      
      // Add a small delay to ensure all styles and images are fully loaded
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Calculate scaling to fit on single page
      const originalStyle = element.getAttribute('style') || ''
      const a4HeightPx = 1122 // Approx 297mm at 96 DPI
      const contentHeight = element.scrollHeight
      const contentWidth = element.scrollWidth
      
      let scale = 1
      if (contentHeight > a4HeightPx) {
        // Calculate scale needed to fit height, with small buffer
        scale = (a4HeightPx - 20) / contentHeight 
      }

      // Apply scaling if needed
      if (scale < 1) {
        // We need to scale down the content
        // We also need to adjust margins/width to keep it centered effectively if needed,
        // but simple scaling is usually enough for "fit to page"
        element.style.transform = `scale(${scale})`
        element.style.transformOrigin = 'top left'
        // Adjust width to compensate for scaling so it still fills the PDF width visually if appropriate,
        // but usually we just want it to fit.
        // Actually, if we scale down, the visual width shrinks. 
        // HTML2PDF captures the visual state.
        // If we want it to still look "full width" on the PDF paper, we'd need to change page size, but we want A4.
        // So visually it will look smaller on the A4 page. This is the definition of scaling to fit.
        element.style.width = `${100 / scale}%` // Compensate width to fill page?
        // If we increase width, flow might change and height might decrease?
        // Let's just scale the container. preserving aspect ratio is key for "exact match".
        element.style.width = `${210 / scale}mm` // Compensate width
      }

      // Configure PDF options with optimized settings for high-quality output
      const opt = {
        margin: [0, 0, 0, 0], // No margins, we handle padding in CSS
        filename: filename,
        image: { 
          type: 'jpeg', 
          quality: 1.0 
        },
        html2canvas: { 
          scale: 2, // High DPI
          useCORS: true, 
          logging: false,
          backgroundColor: '#ffffff',
          letterRendering: true,
          allowTaint: false,
          scrollY: 0, // Ensure we capture from top
          windowWidth: element.scrollWidth, // Capture full scaled width
          windowHeight: element.scrollHeight // Capture full scaled height
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4',
          orientation: 'portrait',
          compress: true,
          precision: 16
        }
      }

      // Generate and download PDF
      await html2pdf().set(opt).from(element).save()
      
      // Revert styles
      element.setAttribute('style', originalStyle)
      
      toast.success('PDF downloaded successfully', {
        description: `Report card saved as ${filename}`
      })
    } catch (error) {
      // Revert styles in case of error (if element still exists)
      if (printRef.current) {
        printRef.current.style.transform = ''
        printRef.current.style.width = ''
        printRef.current.style.transformOrigin = ''
      }
      
      console.error('Error generating PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error('PDF generation failed', {
        description: 'Opening print dialog as fallback option'
      })
      // Fallback to print dialog if PDF generation fails
      setTimeout(() => {
        window.print()
      }, 1000)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handlePrintFromPreview = () => {
    setShowPreview(false)
    // Small delay to ensure dialog is closed before printing
    setTimeout(() => {
      window.print()
    }, 200)
  }

  const calculatePreviewScale = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      const maxWidth = window.innerWidth * 0.85
      const a4Width = 794 // 210mm in pixels at 96dpi
      const calculatedScale = Math.min(0.8, Math.max(0.5, maxWidth / a4Width))
      setPreviewScale(calculatedScale)
    }
  }, [])

  const handleShowPreview = () => {
    setShowPreview(true)
    calculatePreviewScale()
  }

  // Update scale on window resize when preview is open
  useEffect(() => {
    if (!showPreview) return

    const handleResize = () => {
      calculatePreviewScale()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showPreview, calculatePreviewScale])

  const term = data.academic.term
  const termName = TERM_NAMES[term]
  const seqLabels = SEQUENCE_LABELS[term]

  // Get sequence values based on term
  const getSequenceValues = (subject: SubjectGrade) => {
    if (term === 1) {
      return { seq1: subject.sequences?.seq1 ?? subject.seq1, seq2: subject.sequences?.seq2 ?? subject.seq2 }
    } else if (term === 2) {
      return { seq1: subject.sequences?.seq3 ?? subject.seq3, seq2: subject.sequences?.seq4 ?? subject.seq4 }
    } else {
      return { seq1: subject.sequences?.seq5, seq2: subject.sequences?.seq6 }
    }
  }

  // Get global sequence number from term and sequence position (1 or 2)
  const getGlobalSequenceNumber = (term: number, position: 1 | 2): number => {
    if (term === 1) return position
    if (term === 2) return position + 2
    return position + 4
  }

  // Handle click on sequence cell
  const handleSequenceClick = (
    subject: SubjectGrade,
    sequencePosition: 1 | 2
  ) => {
    if (!isAdmin || !classId) return

    const seqs = getSequenceValues(subject)
    const currentMark = sequencePosition === 1 ? seqs.seq1 : seqs.seq2
    const globalSeqNum = getGlobalSequenceNumber(data.academic.term, sequencePosition)
    const sequenceName = getSequenceName(globalSeqNum)

    setEditingSubject({
      subjectId: subject.subjectId || '',
      subjectName: subject.subjectName,
      sequenceNumber: globalSeqNum,
      sequenceName,
      currentMark,
      currentCoefficient: subject.coefficient,
      editType: 'mark',
    })
    setEditDialogOpen(true)
  }

  // Handle click on coefficient cell
  const handleCoefficientClick = async (subject: SubjectGrade) => {
    if (!isAdmin || !classId) return

    let resolvedSubjectId = subject.subjectId

    // If subjectId is missing, look it up by subject name
    if (!resolvedSubjectId && subject.subjectName) {
      try {
        // Use search parameter to find subject by name
        const response = await fetch(`/api/subjects?search=${encodeURIComponent(subject.subjectName)}`)
        if (response.ok) {
          const data = await response.json()
          // Find exact match (case-insensitive)
          if (Array.isArray(data) && data.length > 0) {
            const exactMatch = data.find((s: any) => 
              s.name && s.name.trim().toLowerCase() === subject.subjectName.trim().toLowerCase()
            )
            if (exactMatch) {
              resolvedSubjectId = exactMatch.id
            } else if (data.length === 1) {
              // If only one result, use it
              resolvedSubjectId = data[0].id
            }
          }
        }
      } catch (error) {
        console.error('Error looking up subject ID:', error)
      }
    }

    if (!resolvedSubjectId) {
      toast({
        title: 'Error',
        description: 'Could not find subject ID. Please refresh the page and try again.',
        variant: 'destructive',
      })
      return
    }

    setEditingSubject({
      subjectId: resolvedSubjectId,
      subjectName: subject.subjectName,
      currentCoefficient: subject.coefficient,
      editType: 'coefficient',
    })
    setEditDialogOpen(true)
  }

  // Handle mark save completion
  const handleMarkSaved = () => {
    if (onRefresh) {
      try {
        onRefresh()
      } catch (error) {
        console.error('Error refreshing report card:', error)
        toast({
          title: 'Warning',
          description: 'Changes saved but failed to refresh. Please refresh the page manually.',
          variant: 'destructive',
        })
      }
    }
  }

  // Group subjects by category
  const categoryOrder: Array<'languages' | 'related_trade_subjects' | 'trade_subjects' | 'others'> = [
    'languages',
    'related_trade_subjects',
    'trade_subjects',
    'others'
  ]

  const groupedSubjects = React.useMemo(() => {
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
  }, [data.subjects])

  // Calculate category summaries
  // Only include coefficients for subjects that have marks (coefficient > 0)
  const calculateCategorySummary = (subjects: typeof data.subjects, category: string) => {
    // Only count coefficients for subjects with marks (coefficient > 0)
    const coef = subjects.reduce((sum, s) => sum + (s.coefficient > 0 ? s.coefficient : 0), 0)
    const totalScore = subjects.reduce((sum, s) => {
      // Skip subjects without marks (coefficient = 0)
      if (s.coefficient === 0) return sum
      const seqs = getSequenceValues(s)
      const avg = s.termAverage ?? 
        (seqs.seq1 !== undefined && seqs.seq2 !== undefined 
          ? (seqs.seq1 + seqs.seq2) / 2 
          : seqs.seq1 ?? seqs.seq2 ?? 0)
      return sum + (avg * s.coefficient)
    }, 0)
    const avg = coef > 0 ? totalScore / coef : 0
    const validRanks = subjects.map(s => s.rank ?? 0).filter(r => r > 0)
    const rank = validRanks.length > 0 ? Math.min(...validRanks) : 0
    const passed = subjects.filter(s => {
      // Skip subjects without marks
      if (s.coefficient === 0) return false
      const seqs = getSequenceValues(s)
      const avg = s.termAverage ?? 
        (seqs.seq1 !== undefined && seqs.seq2 !== undefined 
          ? (seqs.seq1 + seqs.seq2) / 2 
          : seqs.seq1 ?? seqs.seq2 ?? 0)
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

  // Calculate GCE section counts
  // Count subjects that are PASSED (termAverage >= 10) from each category
  const gceCounts = React.useMemo(() => {
    // Helper to check if a subject passed (termAverage >= 10)
    const isPassed = (s: SubjectData) => {
      const seqs = getSequenceValues(s)
      const avg = s.termAverage ?? 
        (seqs.seq1 !== undefined && seqs.seq2 !== undefined 
          ? (seqs.seq1 + seqs.seq2) / 2 
          : seqs.seq1 ?? seqs.seq2 ?? 0)
      return avg >= 10
    }
    
    // Count passed subjects in trade_subjects category
    const tradeSubjects = groupedSubjects.find(g => g.category === 'trade_subjects')?.subjects.filter(isPassed).length || 0
    
    // Count passed subjects in related_trade_subjects category
    const relatedTrade = groupedSubjects.find(g => g.category === 'related_trade_subjects')?.subjects.filter(isPassed).length || 0
    
    // Count passed subjects in languages and others categories combined
    const languagesPassed = groupedSubjects.find(g => g.category === 'languages')?.subjects.filter(isPassed).length || 0
    const othersPassed = groupedSubjects.find(g => g.category === 'others')?.subjects.filter(isPassed).length || 0
    const otherSubjects = languagesPassed + othersPassed
    
    // Total passed subjects
    const passed = tradeSubjects + relatedTrade + otherSubjects
    
    return { tradeSubjects, relatedTrade, otherSubjects, passed }
  }, [groupedSubjects])

  // Generate QR Code data with report card information
  const qrCodeData = useMemo(() => {
    const reportCardInfo = {
      studentId: data.student.studentId,
      studentName: data.student.name,
      orderNo: data.academic.orderNo,
      academicYear: data.academic.year,
      term: term,
      className: data.student.className,
      termAvg: data.totals.average,
      rank: data.history?.rank ?? 0,
      generatedAt: new Date().toISOString()
    }
    return JSON.stringify(reportCardInfo)
  }, [data, term])

  return (
    <>
      {/* Embedded styles for PDF generation - ensures styles are preserved */}
      <style dangerouslySetInnerHTML={{
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
            
            /* Flexbox Display */
            .pdf-report-card .flex {
              display: flex !important;
            }
            .pdf-report-card .flex-col {
              flex-direction: column !important;
            }
            .pdf-report-card .flex-row {
              flex-direction: row !important;
            }
            
            /* Flexbox Alignment */
            .pdf-report-card .items-center {
              align-items: center !important;
            }
            .pdf-report-card .items-start {
              align-items: flex-start !important;
            }
            .pdf-report-card .items-end {
              align-items: flex-end !important;
            }
            .pdf-report-card .justify-center {
              justify-content: center !important;
            }
            .pdf-report-card .justify-start {
              justify-content: flex-start !important;
            }
            .pdf-report-card .justify-between {
              justify-content: space-between !important;
            }
            .pdf-report-card .justify-end {
              justify-content: flex-end !important;
            }
            
            /* Text Alignment */
            .pdf-report-card .text-center {
              text-align: center !important;
            }
            .pdf-report-card .text-left {
              text-align: left !important;
            }
            .pdf-report-card .text-right {
              text-align: right !important;
            }
            
            /* Spacing - Padding */
            .pdf-report-card .p-0 { padding: 0 !important; }
            .pdf-report-card .p-0\.5 { padding: 0.125rem !important; }
            .pdf-report-card .p-1 { padding: 0.25rem !important; }
            .pdf-report-card .p-1\.5 { padding: 0.375rem !important; }
            .pdf-report-card .p-2 { padding: 0.5rem !important; }
            .pdf-report-card .p-4 { padding: 1rem !important; }
            .pdf-report-card .p-6 { padding: 1.5rem !important; }
            .pdf-report-card .p-8 { padding: 2rem !important; }
            .pdf-report-card .px-1 { padding-left: 0.25rem !important; padding-right: 0.25rem !important; }
            .pdf-report-card .px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
            .pdf-report-card .px-8 { padding-left: 2rem !important; padding-right: 2rem !important; }
            .pdf-report-card .pt-2 { padding-top: 0.5rem !important; }
            .pdf-report-card .pb-2 { padding-bottom: 0.5rem !important; }
            .pdf-report-card .pb-1 { padding-bottom: 0.25rem !important; }
            
            /* Spacing - Margin */
            .pdf-report-card .m-0 { margin: 0 !important; }
            .pdf-report-card .m-2 { margin: 0.5rem !important; }
            .pdf-report-card .mx-auto { margin-left: auto !important; margin-right: auto !important; }
            .pdf-report-card .mb-0 { margin-bottom: 0 !important; }
            .pdf-report-card .mb-0\.5 { margin-bottom: 0.125rem !important; }
            .pdf-report-card .mb-1 { margin-bottom: 0.25rem !important; }
            .pdf-report-card .mb-2 { margin-bottom: 0.5rem !important; }
            .pdf-report-card .mb-4 { margin-bottom: 1rem !important; }
            .pdf-report-card .mt-0 { margin-top: 0 !important; }
            .pdf-report-card .mt-0\.5 { margin-top: 0.125rem !important; }
            .pdf-report-card .mt-1 { margin-top: 0.25rem !important; }
            .pdf-report-card .mt-auto { margin-top: auto !important; }
            
            /* Spacing - Gap */
            .pdf-report-card .gap-0 { gap: 0 !important; }
            .pdf-report-card .gap-0\.5 { gap: 0.125rem !important; }
            .pdf-report-card .gap-1 { gap: 0.25rem !important; }
            .pdf-report-card .gap-2 { gap: 0.5rem !important; }
            .pdf-report-card .gap-4 { gap: 1rem !important; }
            
            /* Typography - Font Sizes */
            .pdf-report-card .text-\[0\.5rem\] { font-size: 0.5rem !important; }
            .pdf-report-card .text-\[0\.55rem\] { font-size: 0.55rem !important; }
            .pdf-report-card .text-\[0\.6rem\] { font-size: 0.6rem !important; }
            .pdf-report-card .text-\[0\.65rem\] { font-size: 0.65rem !important; }
            .pdf-report-card .text-\[0\.7rem\] { font-size: 0.7rem !important; }
            .pdf-report-card .text-xs { font-size: 0.75rem !important; }
            .pdf-report-card .text-sm { font-size: 0.875rem !important; }
            .pdf-report-card .text-base { font-size: 1rem !important; }
            .pdf-report-card .text-lg { font-size: 1.125rem !important; }
            .pdf-report-card .text-xl { font-size: 1.25rem !important; }
            .pdf-report-card .text-2xl { font-size: 1.5rem !important; }
            
            /* Typography - Font Weights */
            .pdf-report-card .font-medium { font-weight: 500 !important; }
            .pdf-report-card .font-bold { font-weight: 700 !important; }
            .pdf-report-card .font-black { font-weight: 900 !important; }
            
            /* Typography - Text Transform */
            .pdf-report-card .uppercase { text-transform: uppercase !important; }
            .pdf-report-card .lowercase { text-transform: lowercase !important; }
            .pdf-report-card .normal-case { text-transform: none !important; }
            
            /* Typography - Letter Spacing */
            .pdf-report-card .tracking-tighter { letter-spacing: -0.05em !important; }
            .pdf-report-card .tracking-widest { letter-spacing: 0.1em !important; }
            .pdf-report-card .tracking-\[0\.2em\] { letter-spacing: 0.2em !important; }
            
            /* Typography - Line Height */
            .pdf-report-card .leading-none { line-height: 1 !important; }
            .pdf-report-card .leading-tight { line-height: 1.25 !important; }
            .pdf-report-card .leading-\[1\.1\] { line-height: 1.1 !important; }
            
            /* Layout - Width */
            .pdf-report-card .w-full { width: 100% !important; }
            .pdf-report-card .w-6 { width: 1.5rem !important; }
            .pdf-report-card .w-16 { width: 4rem !important; }
            .pdf-report-card .w-24 { width: 6rem !important; }
            .pdf-report-card .max-w-\[60\%\] { max-width: 60% !important; }
            .pdf-report-card .max-w-\[210mm\] { max-width: 210mm !important; }
            
            /* Layout - Height */
            .pdf-report-card .h-0\.5 { height: 0.125rem !important; }
            .pdf-report-card .h-1 { height: 0.25rem !important; }
            .pdf-report-card .h-4 { height: 1rem !important; }
            .pdf-report-card .h-16 { height: 4rem !important; }
            .pdf-report-card .h-24 { height: 6rem !important; }
            .pdf-report-card .h-\[119px\] { height: 119px !important; }
            .pdf-report-card .h-\[297mm\] { height: 297mm !important; }
            .pdf-report-card .min-h-screen { min-height: 100vh !important; }
            
            /* Layout - Position */
            .pdf-report-card .relative { position: relative !important; }
            .pdf-report-card .absolute { position: absolute !important; }
            .pdf-report-card .z-0 { z-index: 0 !important; }
            .pdf-report-card .z-10 { z-index: 10 !important; }
            .pdf-report-card .z-20 { z-index: 20 !important; }
            
            /* Layout - Display */
            .pdf-report-card .hidden { display: none !important; }
            .pdf-report-card .block { display: block !important; }
            .pdf-report-card .inline-block { display: inline-block !important; }
            
            /* Grid Layout */
            .pdf-report-card .grid {
              display: grid !important;
            }
            .pdf-report-card .grid-cols-1 {
              grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
            }
            .pdf-report-card .grid-cols-12 {
              grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
            }
            .pdf-report-card .col-span-2 { grid-column: span 2 / span 2 !important; }
            .pdf-report-card .col-span-3 { grid-column: span 3 / span 3 !important; }
            .pdf-report-card .col-span-4 { grid-column: span 4 / span 4 !important; }
            .pdf-report-card .col-span-5 { grid-column: span 5 / span 5 !important; }
            .pdf-report-card .col-span-6 { grid-column: span 6 / span 6 !important; }
            .pdf-report-card .col-span-7 { grid-column: span 7 / span 7 !important; }
            .pdf-report-card .col-span-12 { grid-column: span 12 / span 12 !important; }
            .pdf-report-card .row-span-2 { grid-row: span 2 / span 2 !important; }
            
            /* Borders */
            .pdf-report-card .border { border-width: 1px !important; }
            .pdf-report-card .border-2 { border-width: 2px !important; }
            .pdf-report-card .border-black { border-color: #000000 !important; }
            .pdf-report-card .border-b { border-bottom-width: 1px !important; }
            .pdf-report-card .border-b-2 { border-bottom-width: 2px !important; }
            .pdf-report-card .border-r { border-right-width: 1px !important; }
            .pdf-report-card .border-t { border-top-width: 1px !important; }
            .pdf-report-card .border-gray-200 { border-color: #e5e7eb !important; }
            .pdf-report-card .border-gray-300 { border-color: #d1d5db !important; }
            .pdf-report-card .border-gray-600 { border-color: #4b5563 !important; }
            .pdf-report-card .border-dashed { border-style: dashed !important; }
            
            /* Border Radius */
            .pdf-report-card .rounded-full { border-radius: 9999px !important; }
            .pdf-report-card .rounded-xl { border-radius: 0.75rem !important; }
            
            /* Background Colors */
            .pdf-report-card .bg-white { background-color: #ffffff !important; }
            .pdf-report-card .bg-gray-50 { background-color: #f9fafb !important; }
            .pdf-report-card .bg-gray-100 { background-color: #f3f4f6 !important; }
            .pdf-report-card .bg-gray-200 { background-color: #e5e7eb !important; }
            .pdf-report-card .bg-gray-300 { background-color: #d1d5db !important; }
            .pdf-report-card .bg-black { background-color: #000000 !important; }
            
            /* Background with Opacity */
            .pdf-report-card .bg-white\/90 { background-color: rgba(255, 255, 255, 0.9) !important; }
            .pdf-report-card .bg-black\/30 { background-color: rgba(0, 0, 0, 0.3) !important; }
            .pdf-report-card .bg-black\/5 { background-color: rgba(0, 0, 0, 0.05) !important; }
            .pdf-report-card .bg-white\/50 { background-color: rgba(255, 255, 255, 0.5) !important; }
            
            /* Text Colors */
            .pdf-report-card .text-white { color: #ffffff !important; }
            .pdf-report-card .text-black { color: #000000 !important; }
            .pdf-report-card .text-gray-400 { color: #9ca3af !important; }
            .pdf-report-card .text-gray-500 { color: #6b7280 !important; }
            .pdf-report-card .text-gray-600 { color: #4b5563 !important; }
            .pdf-report-card .text-red-600 { color: #dc2626 !important; }
            .pdf-report-card .text-green-600 { color: #16a34a !important; }
            .pdf-report-card .text-green-700 { color: #15803d !important; }
            .pdf-report-card .text-blue-800 { color: #1e40af !important; }
            
            /* Text Colors with Opacity */
            .pdf-report-card .text-black\/80 { color: rgba(0, 0, 0, 0.8) !important; }
            .pdf-report-card .text-black\/60 { color: rgba(0, 0, 0, 0.6) !important; }
            
            /* Opacity */
            .pdf-report-card .opacity-20 { opacity: 0.2 !important; }
            .pdf-report-card .opacity-30 { opacity: 0.3 !important; }
            .pdf-report-card .opacity-70 { opacity: 0.7 !important; }
            .pdf-report-card .opacity-80 { opacity: 0.8 !important; }
            .pdf-report-card .opacity-\[0\.06\] { opacity: 0.06 !important; }
            
            /* Overflow */
            .pdf-report-card .overflow-hidden { overflow: hidden !important; }
            .pdf-report-card .overflow-auto { overflow: auto !important; }
            
            /* Whitespace */
            .pdf-report-card .whitespace-nowrap { white-space: nowrap !important; }
            
            /* Transform */
            .pdf-report-card .transform { transform: var(--tw-transform) !important; }
            .pdf-report-card .-rotate-6 { transform: rotate(-6deg) !important; }
            .pdf-report-card .rotate-12 { transform: rotate(12deg) !important; }
            .pdf-report-card .-translate-y-1\/2 { transform: translateY(-50%) !important; }
            .pdf-report-card .grayscale { filter: grayscale(100%) !important; }
            
            /* Shadow */
            .pdf-report-card .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important; }
            .pdf-report-card .shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important; }
            .pdf-report-card .shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25) !important; }
            
            /* Pointer Events */
            .pdf-report-card .pointer-events-none { pointer-events: none !important; }
            
            /* Object Fit */
            .pdf-report-card .object-contain { object-fit: contain !important; }
            .pdf-report-card .object-cover { object-fit: cover !important; }
            
            /* Space Between */
            .pdf-report-card .space-y-0 { }
            .pdf-report-card .space-y-0\.5 > * + * { margin-top: 0.125rem !important; }
            .pdf-report-card .space-y-1 > * + * { margin-top: 0.25rem !important; }
            .pdf-report-card .space-y-2 > * + * { margin-top: 0.5rem !important; }
            
            /* Table Styles */
            .pdf-report-card table {
              border-collapse: collapse !important;
              width: 100% !important;
              table-layout: fixed !important;
              page-break-inside: auto !important;
            }
            .pdf-report-card table thead {
              display: table-header-group !important;
            }
            .pdf-report-card table tbody {
              display: table-row-group !important;
            }
            .pdf-report-card table tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .pdf-report-card table td,
            .pdf-report-card table th {
              border: 1px solid #000 !important;
              padding: 2px 4px !important;
              vertical-align: middle !important;
            }
            
            /* Image Styles */
            .pdf-report-card img {
              max-width: 100% !important;
              height: auto !important;
            }
            
            /* Print-specific overrides */
            @media print {
              .pdf-report-card .print\\:p-0 { padding: 0 !important; }
              .pdf-report-card .print\\:p-0\\.5 { padding: 0.125rem !important; }
              .pdf-report-card .print\\:px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
              .pdf-report-card .print\\:pt-2 { padding-top: 0.5rem !important; }
              .pdf-report-card .print\\:pb-2 { padding-bottom: 0.5rem !important; }
              .pdf-report-card .print\\:mb-0 { margin-bottom: 0 !important; }
              .pdf-report-card .print\\:mb-0\\.5 { margin-bottom: 0.125rem !important; }
              .pdf-report-card .print\\:mb-1 { margin-bottom: 0.25rem !important; }
              .pdf-report-card .print\\:mt-0\\.5 { margin-top: 0.125rem !important; }
              .pdf-report-card .print\\:text-\[6pt\] { font-size: 6pt !important; }
              .pdf-report-card .print\\:text-\[7pt\] { font-size: 7pt !important; }
              .pdf-report-card .print\\:text-\[8pt\] { font-size: 8pt !important; }
              .pdf-report-card .print\\:text-2xl { font-size: 1.5rem !important; }
              .pdf-report-card .print\\:text-lg { font-size: 1.125rem !important; }
              .pdf-report-card .print\\:text-base { font-size: 1rem !important; }
              .pdf-report-card .print\\:text-xl { font-size: 1.25rem !important; }
              .pdf-report-card .print\\:w-1 { width: 0.25rem !important; }
              .pdf-report-card .print\\:w-4 { width: 1rem !important; }
              .pdf-report-card .print\\:w-8 { width: 2rem !important; }
              .pdf-report-card .print\\:w-10 { width: 2.5rem !important; }
              .pdf-report-card .print\\:w-14 { width: 3.5rem !important; }
              .pdf-report-card .print\\:w-20 { width: 5rem !important; }
              .pdf-report-card .print\\:w-24 { width: 6rem !important; }
              .pdf-report-card .print\\:h-1 { height: 0.25rem !important; }
              .pdf-report-card .print\\:h-3 { height: 0.75rem !important; }
              .pdf-report-card .print\\:h-4 { height: 1rem !important; }
              .pdf-report-card .print\\:hidden { display: none !important; }
              .pdf-report-card .print\\:block { display: block !important; }
              .pdf-report-card .print\\:shadow-none { box-shadow: none !important; }
              .pdf-report-card .print\\:w-full { width: 100% !important; }
              .pdf-report-card .print\\:max-w-full { max-width: 100% !important; }
              .pdf-report-card .print\\:h-\[297mm\] { height: 297mm !important; }
              .pdf-report-card .print\\:border { border-width: 1px !important; }
              .pdf-report-card .print\\:leading-\[1\\.1\] { line-height: 1.1 !important; }
              .pdf-report-card .print\\:space-y-2 > * + * { margin-top: 0.5rem !important; }
              /* Hide edit functionality in print */
              .pdf-report-card [class*="cursor-pointer"] { cursor: default !important; }
              .pdf-report-card [class*="hover:"] { background-color: transparent !important; }
            }
            
            /* Responsive - Medium screens and up */
            @media (min-width: 768px) {
              .pdf-report-card .md\\:grid-cols-3 {
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              }
              .pdf-report-card .md\\:grid-cols-4 {
                grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
              }
              .pdf-report-card .md\\:col-span-4 {
                grid-column: span 4 / span 4 !important;
              }
              .pdf-report-card .md\\:col-span-6 {
                grid-column: span 6 / span 6 !important;
              }
              .pdf-report-card .md\\:border-r {
                border-right-width: 1px !important;
              }
              .pdf-report-card .md\\:border-b-0 {
                border-bottom-width: 0 !important;
              }
              .pdf-report-card .md\\:flex {
                display: flex !important;
              }
              .pdf-report-card .md\\:flex-row {
                flex-direction: row !important;
              }
              .pdf-report-card .md\\:text-left {
                text-align: left !important;
              }
              .pdf-report-card .md\\:block {
                display: block !important;
              }
              .pdf-report-card .md\\:hidden {
                display: none !important;
              }
            }
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
        </div>

        {/* Main Report Card Sheet */}
        <div className="pdf-report-card max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full print:max-w-full overflow-hidden text-xs print:text-[8pt] relative print:h-[297mm]" ref={printRef}>
        
        <div className="px-8 print:px-3 pt-0 print:pt-6 pb-0 print:pb-2 flex flex-col gap-0 relative" style={{ color: 'rgba(26, 26, 26, 1)' }}>
          
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
            <img 
              src="/pison.png" 
              alt="Watermark" 
              className="w-[90%] h-auto opacity-[0.06] transform -rotate-6 grayscale"
              style={{ filter: 'grayscale(100%) contrast(1.5) brightness(1.5)' }}
            />
          </div>

          {/* Header */}
          <header className="grid grid-cols-1 md:grid-cols-3 gap-2 print:gap-1 mb-2 print:mb-1 border-b-2 border-black pb-1 print:pb-0.5 relative z-10">
            <div className="text-center md:text-left text-[0.55rem] print:text-[7pt] uppercase font-medium space-y-0 print:space-y-0 leading-tight mt-0 mb-0 w-fit h-[119px] pt-2 pb-2 flex flex-col gap-2">
              <p className="print:leading-[1.1]">République du Cameroun</p>
              <p className="print:leading-[1.1]">Paix - Travail - Patrie</p>
              <p className="print:leading-[1.1]">Ministère des Enseignements Secondaires</p>
              <p className="print:leading-[1.1]">Délégation Régional de Littoral</p>
              <p className="font-bold text-black print:leading-[1.1]">PISON ACADEMY OF EXCELLENCE</p>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="w-24 print:w-24 h-24 print:h-24 mb-1 print:mb-0.5 relative overflow-hidden flex items-center justify-center">
                {logoError ? (
                  <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-full">
                    <School size={24} className="text-gray-400 print:w-4 print:h-4" />
                  </div>
                ) : (
                  <img 
                    src="/pison.png" 
                    alt="Pison Academy Logo" 
                    className="max-w-full max-h-full object-contain grayscale" 
                    onError={() => setLogoError(true)}
                  />
                )}
              </div>
              <div className="text-[0.5rem] print:text-[6pt] font-mono text-left">
                ORDER Nº: <span className="text-red-600 font-bold">714/24/MINESEC/SG/DESTP/SSEPTP OF 31 DECEMBER 2024</span>
              </div>
            </div>

            <div className="text-right text-[0.55rem] print:text-[7pt] uppercase font-medium space-y-2 print:space-y-2 leading-tight pt-2 pb-2">
              <p className="print:leading-[1.1]">Republic of Cameroon</p>
              <p className="print:leading-[1.1]">Peace - Work - Fatherland</p>
              <p className="print:leading-[1.1]">Ministry of Secondary Education</p>
              <p className="print:leading-[1.1]">Regional Delegation of Littoral</p>
              <p className="font-bold text-blue-800 print:leading-[1.1]">PISON ACADEMY OF EXCELLENCE</p>
              <p className="normal-case text-red-600 text-[0.5rem] print:text-[6pt] print:leading-[1.1]">PO Box 58 Edea Tel: 676521570</p>
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
              <div className="absolute left-2 print:left-1 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center opacity-80 z-20">
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
                  <span className="text-black/80">{termName.ordinal}</span> <span className="relative inline-block">TERM</span>
                </h2>
                <p className="font-black text-base print:text-lg uppercase tracking-[0.2em] leading-none mb-1 print:mb-0.5 text-left">
                  REPORT CARD
                </p>
                <div className="flex items-center gap-1 w-full justify-center">
                  <div className="h-0.5 w-6 bg-black/30"></div>
                  <p className="text-[0.5rem] print:text-[6pt] font-bold tracking-widest text-black/60 uppercase whitespace-nowrap flex items-center gap-0.5">
                    <Star size={8} className="text-black/60 fill-black/60 print:w-1 print:h-1" /> Bulletin du {termName.fr} <Star size={8} className="text-black/60 fill-black/60 print:w-1 print:h-1" />
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
          <div className="border border-black grid grid-cols-12 mb-1 print:mb-0.5 font-mono text-[0.65rem] print:text-[7pt] relative z-10 bg-white/90" style={{ border: '1px solid #000', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <div className="col-span-12 md:col-span-4 p-1 print:p-0.5 border-b md:border-r border-black" style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '2px 4px' }}>
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">First Name / Prénom</span>
              <span className="font-bold text-[0.7rem] print:text-[7pt]">{data.student.firstName || data.student.name.split(' ')[0]}</span>
            </div>
            <div className="col-span-12 md:col-span-4 p-1 print:p-0.5 border-b md:border-r border-black" style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '2px 4px' }}>
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Last Name / Nom</span>
              <span className="font-bold text-[0.7rem] print:text-[7pt]">{data.student.lastName || data.student.name.split(' ').slice(1).join(' ')}</span>
            </div>
            <div className="col-span-12 md:col-span-4 p-1 print:p-0.5 border-b border-black" style={{ borderBottom: '1px solid #000', padding: '2px 4px' }}>
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Unique Identifier No / Matricule</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.studentId}</span>
            </div>

            <div className="col-span-2 p-1 print:p-0.5 border-b border-r border-black" style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '2px 4px' }}>
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Sex</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.sex}</span>
            </div>
            <div className="col-span-4 p-1 print:p-0.5 border-b border-r border-black" style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '2px 4px' }}>
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Date of Birth / Né le</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.dob}</span>
            </div>
            <div className="col-span-4 p-1 print:p-0.5 border-b border-r border-black" style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '2px 4px' }}>
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Place of Birth / Né à</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.pob}</span>
            </div>
            <div className="col-span-2 p-1 print:p-0.5 border-b border-black" style={{ borderBottom: '1px solid #000', padding: '2px 4px' }}>
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Repeater / Redoublant</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">NO / NON</span>
            </div>

            <div className="col-span-5 p-1 print:p-0.5 border-b md:border-b-0 border-r border-black" style={{ borderRight: '1px solid #000', padding: '2px 4px' }}>
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Speciality</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{getSpecialityFromClass(data.student.className, data.student.speciality)}</span>
            </div>
            <div className="col-span-4 p-1 print:p-0.5 border-b md:border-b-0 border-r border-black" style={{ borderRight: '1px solid #000', padding: '2px 4px' }}>
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Class</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.className}</span>
            </div>
            <div className="col-span-3 p-1 print:p-0.5 border-b md:border-b-0 border-black" style={{ borderBottom: '1px solid #000', padding: '2px 4px' }}>
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Master</span>
              <span className="font-bold text-[0.6rem] print:text-[6pt]">{data.student.classMaster || '-'}</span>
            </div>
          </div>

          {/* Grades Table */}
          <div className="border border-black mb-1 print:mb-0.5 overflow-hidden relative z-10 bg-white/90" style={{ border: '1px solid #000' }}>
            <table className="w-full text-left border-collapse" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead className="bg-gray-100 text-[0.55rem] print:text-[7pt] uppercase font-bold border-b border-black" style={{ backgroundColor: '#f3f4f6' }}>
                <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <th className="p-1 print:p-0.5 border-r border-black w-12 print:w-10" style={{ fontSize: '7pt', width: '8%', border: '1px solid #000', padding: '2px 4px' }}></th>
                  <th className="p-1 print:p-0.5 border-r border-black w-1/3 text-left" style={{ fontSize: '7pt', width: '25%', border: '1px solid #000', padding: '2px 4px' }}>Subjects</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt', width: '6%', border: '1px solid #000', padding: '2px 4px' }}>Coef</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt', width: '7%', border: '1px solid #000', padding: '2px 4px' }}>{seqLabels.seq1}</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt', width: '7%', border: '1px solid #000', padding: '2px 4px' }}>{seqLabels.seq2}</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt', width: '8%', border: '1px solid #000', padding: '2px 4px' }}>Average</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt', width: '8%', border: '1px solid #000', padding: '2px 4px' }}>TOTAL</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt', width: '7%', border: '1px solid #000', padding: '2px 4px' }}>Grade</th>
                  <th className="p-1 print:p-0.5 text-left" style={{ fontSize: '7pt', width: '24%', border: '1px solid #000', padding: '2px 4px' }}>Remarks</th>
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
                        const seqs = getSequenceValues(subject)
                        const avg = subject.termAverage ?? 
                          (seqs.seq1 !== undefined && seqs.seq2 !== undefined 
                            ? (seqs.seq1 + seqs.seq2) / 2 
                            : seqs.seq1 ?? seqs.seq2 ?? 0)
                        // Only calculate totalScore if coefficient > 0 (subject has marks)
                        const totalScore = subject.coefficient > 0 ? avg * subject.coefficient : 0
                        const grade = subject.grade || calculateGrade(avg)
                        const remarks = subject.remarks || calculateRemarks(grade)

                        return (
                          <tr 
                            key={`${group.category}-${idx}`} 
                            className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent"
                            style={{ 
                              '--print-order': printOrder,
                              pageBreakInside: 'avoid',
                              breakInside: 'avoid',
                              borderBottom: '1px solid #e5e7eb'
                            } as React.CSSProperties}
                          >
                            {/* Category Label - Only on first row of section */}
                            {idx === 0 && (
                              <td 
                                rowSpan={group.subjects.length + 1} 
                                className="border-r border-black bg-gray-200 text-center font-bold text-[0.55rem] print:text-[6pt] p-0.5 print:p-0.5 uppercase whitespace-nowrap"
                                style={{ 
                                  writingMode: 'vertical-rl', 
                                  transform: 'rotate(180deg)',
                                  border: '1px solid #000',
                                  backgroundColor: '#e5e7eb',
                                  padding: '2px 4px'
                                }}
                              >
                                {categoryLabel}
                              </td>
                            )}
                            <td className="p-1 print:p-0.5 border-r border-gray-300 font-medium" style={{ border: '1px solid #d1d5db', padding: '2px 4px' }}>{subject.subjectName}</td>
                            <td 
                              className={`p-1 print:p-0.5 border-r border-gray-300 text-center relative ${isAdmin && classId ? 'cursor-pointer hover:bg-blue-50 print:hover:bg-transparent print:cursor-default' : ''}`}
                              style={{ border: '1px solid #d1d5db', padding: '2px 4px' }}
                              onClick={() => {
                                if (isAdmin && classId && typeof window !== 'undefined' && !window.matchMedia('print').matches) {
                                  handleCoefficientClick(subject)
                                }
                              }}
                            >
                              {subject.coefficient > 0 ? subject.coefficient : '-'}
                              {isAdmin && classId && (
                                <Pencil className="h-3 w-3 text-gray-400 hover:text-blue-600 absolute top-0 right-0 opacity-0 hover:opacity-100 print:hidden transition-opacity pointer-events-none" style={{ margin: '2px' }} />
                              )}
                            </td>
                            <td 
                              className={`p-1 print:p-0.5 border-r border-gray-300 text-center relative ${isAdmin && classId ? 'cursor-pointer hover:bg-blue-50 print:hover:bg-transparent print:cursor-default' : ''}`}
                              style={{ border: '1px solid #d1d5db', padding: '2px 4px' }}
                              onClick={() => {
                                if (isAdmin && classId && typeof window !== 'undefined' && !window.matchMedia('print').matches) {
                                  handleSequenceClick(subject, 1)
                                }
                              }}
                            >
                              {seqs.seq1?.toFixed(1) ?? '-'}
                              {isAdmin && classId && (
                                <Pencil className="h-3 w-3 text-gray-400 hover:text-blue-600 absolute top-0 right-0 opacity-0 hover:opacity-100 print:hidden transition-opacity pointer-events-none" style={{ margin: '2px' }} />
                              )}
                            </td>
                            <td 
                              className={`p-1 print:p-0.5 border-r border-gray-300 text-center relative ${isAdmin && classId ? 'cursor-pointer hover:bg-blue-50 print:hover:bg-transparent print:cursor-default' : ''}`}
                              style={{ border: '1px solid #d1d5db', padding: '2px 4px' }}
                              onClick={() => {
                                if (isAdmin && classId && typeof window !== 'undefined' && !window.matchMedia('print').matches) {
                                  handleSequenceClick(subject, 2)
                                }
                              }}
                            >
                              {seqs.seq2?.toFixed(1) ?? '-'}
                              {isAdmin && classId && (
                                <Pencil className="h-3 w-3 text-gray-400 hover:text-blue-600 absolute top-0 right-0 opacity-0 hover:opacity-100 print:hidden transition-opacity pointer-events-none" style={{ margin: '2px' }} />
                              )}
                            </td>
                            <td className="p-1 print:p-0.5 border-r border-gray-300 text-center" style={{ border: '1px solid #d1d5db', padding: '2px 4px' }}>{avg > 0 ? avg.toFixed(1) : '-'}</td>
                            <td className="p-1 print:p-0.5 border-r border-gray-300 text-center" style={{ border: '1px solid #d1d5db', padding: '2px 4px' }}>{totalScore > 0 ? totalScore.toFixed(0) : '-'}</td>
                            <td className={`p-1 print:p-0.5 border-r border-gray-300 text-center font-bold ${grade === 'F' || grade === 'E' || grade === 'U' ? 'text-red-600' : ''}`} style={{ border: '1px solid #d1d5db', padding: '2px 4px', color: (grade === 'F' || grade === 'E' || grade === 'U') ? '#dc2626' : 'inherit' }}>
                              {grade}
                            </td>
                            <td className={`p-1 print:p-0.5 ${remarks.includes('Fail') || remarks.includes('Weak') || remarks.includes('Very weak') ? 'text-red-600' : 'text-green-700'}`} style={{ padding: '2px 4px', color: (remarks.includes('Fail') || remarks.includes('Weak') || remarks.includes('Very weak')) ? '#dc2626' : '#15803d' }}>
                              {remarks}
                            </td>
                          </tr>
                        )
                      })}
                      {/* Category Summary Row */}
                      <tr 
                        className="bg-gray-300 font-bold border-b border-black"
                        style={{ 
                          '--print-order': printOrder,
                          backgroundColor: '#d1d5db',
                          pageBreakInside: 'avoid',
                          breakInside: 'avoid',
                          borderBottom: '1px solid #000'
                        } as React.CSSProperties}
                      >
                        <td className="p-1 print:p-0.5 border-r border-black uppercase text-[0.55rem] print:text-[6pt] text-left" style={{ border: '1px solid #000', padding: '2px 4px' }}>{getCategoryFullLabel(group.category)} Summary</td>
                        <td className="p-1 print:p-0.5 border-r border-black text-center" style={{ border: '1px solid #000', padding: '2px 4px' }}>{summary.coef}</td>
                        <td colSpan={2} className="p-1 print:p-0.5 border-r border-black text-center text-gray-400" style={{ border: '1px solid #000', padding: '2px 4px', color: '#9ca3af' }}>/</td>
                        <td className="p-1 print:p-0.5 border-r border-black text-center whitespace-nowrap text-[0.55rem] print:text-[6pt]" style={{ border: '1px solid #000', padding: '2px 4px' }}>AV: {summary.avg.toFixed(2)}</td>
                        <td className="p-1 print:p-0.5 border-r border-black text-center" style={{ border: '1px solid #000', padding: '2px 4px' }}>{summary.totalScore.toFixed(0)}</td>
                        <td className="p-1 print:p-0.5 border-r border-black text-center" style={{ border: '1px solid #000', padding: '2px 4px' }}>{summary.rank > 0 ? summary.rank : '-'}</td>
                        <td className="p-1 print:p-0.5 uppercase text-[0.55rem] print:text-[6pt] text-left" style={{ padding: '2px 4px' }}>{summary.remark}</td>
                      </tr>
                    </React.Fragment>
                  )
                })}
                
                {/* Total Summary Row */}
                <tr 
                  className="bg-black text-white font-bold text-[0.65rem] print:text-[7pt]"
                  style={{ 
                    '--print-order': 0,
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid'
                  } as React.CSSProperties}
                >
                  <td colSpan={2} className="p-1 print:p-0.5 text-left uppercase border-r border-gray-600" style={{ border: '1px solid #4b5563', padding: '2px 4px' }}>Total Summary / Bilan Totale</td>
                  <td className="p-1 print:p-0.5 text-center border-r border-gray-600" style={{ border: '1px solid #4b5563', padding: '2px 4px' }}>{data.totals.coefficient}</td>
                  <td colSpan={2} className="p-1 print:p-0.5 border-r border-gray-600" style={{ border: '1px solid #4b5563', padding: '2px 4px' }}></td>
                  <td className="p-1 print:p-0.5 text-center border-r border-gray-600 font-bold" style={{ border: '1px solid #4b5563', padding: '2px 4px' }}>{data.totals.average.toFixed(2)}</td>
                  <td className="p-1 print:p-0.5 text-center border-r border-gray-600" style={{ border: '1px solid #4b5563', padding: '2px 4px' }}>{data.totals.totalScore.toFixed(0)}</td>
                  <td colSpan={2} className="bg-gray-100" style={{ backgroundColor: '#f3f4f6', padding: '2px 4px' }}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 print:gap-1 mb-2 print:mb-1 relative z-10">
            
            {/* Left Column: Term History & Discipline */}
            <div className="col-span-12 md:col-span-6 flex flex-col gap-0">
              <div className="border border-black bg-white/90">
                <div className="bg-gray-100 p-0.5 print:p-0.5 text-left text-[0.55rem] print:text-[6pt] font-bold uppercase border-b border-black">
                  Student's Evaluation Results
                </div>
                <table className="w-full text-[0.6rem] print:text-[7pt]">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="p-0.5 print:p-0.5 border-r border-gray-300 text-left">TERM</th>
                      <th className="p-0.5 print:p-0.5 text-left">{data.academic.term}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-300 font-mono">
                      <td className="p-0.5 print:p-0.5 font-bold border-r border-gray-300 text-left pl-1">AVERAGE</td>
                      <td className="p-0.5 print:p-0.5 font-bold">
                        {data.totals.average.toFixed(1)}
                      </td>
                    </tr>
                    <tr className="font-mono">
                      <td className="p-0.5 print:p-0.5 font-bold border-r border-gray-300 text-left pl-1">RANK</td>
                      <td className="p-0.5 print:p-0.5">{data.history?.rank ?? '-'}</td>
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
                    <span className="font-mono font-bold"></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Suspensions / Warnings</span>
                    <span className="font-mono font-bold"></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: GCE Section */}
            <div className="col-span-12 md:col-span-6">
              <div className="border border-black bg-white/90">
                <div className="border-b border-gray-300 p-1 print:p-0.5">
                  <h4 className="font-bold text-[0.6rem] print:text-[7pt] text-left">GCE SECTION</h4>
                </div>
                <div className="space-y-0.5 font-mono text-[0.6rem] print:text-[7pt] p-1 print:p-0.5">
                  <div className="flex justify-between"><span>Trade Subjects:</span> <span>{gceCounts.tradeSubjects.toString().padStart(2, '0')}</span></div>
                  <div className="flex justify-between"><span>Related Trade:</span> <span>{gceCounts.relatedTrade.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>Other Subjects:</span> <span>{gceCounts.otherSubjects.toFixed(1)}</span></div>
                  <div className="flex justify-between font-bold pt-1 border-t border-gray-300 mt-1">
                    <span>GCE SUBJECTS PASSED:</span> <span>{gceCounts.passed.toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-center items-start gap-2 print:gap-1 mt-auto relative z-10 w-full">
            <div className="border border-black p-1.5 print:p-1 text-[0.6rem] print:text-[7pt] flex flex-col justify-between bg-white/90 flex-1" style={{ height: '60px' }}>
              <h4 className="font-bold text-left underline">The Class Master</h4>
              <div className="text-left font-script text-sm print:text-xs opacity-70">{data.student.classMaster || ''}</div>
              <div className="text-[0.5rem] print:text-[6pt] text-left text-gray-400 mt-0.5 italic">Signature</div>
            </div>

            <div className="border border-black p-1.5 print:p-1 text-[0.6rem] print:text-[7pt] flex flex-col justify-between bg-white/90 flex-1" style={{ height: '60px' }}>
              <h4 className="font-bold text-left underline">The Principal</h4>
              <div className="text-left font-script text-sm print:text-xs opacity-70"></div>
              <div className="text-[0.5rem] print:text-[6pt] text-left text-gray-400 mt-0.5 italic">Stamp & Signature</div>
            </div>
          </div>
          

        </div>
        
        {/* Bottom Border */}
        <div className="h-1 print:h-0.5 w-full bg-black print:block text-white" />
        </div>
      </div>

      {/* Print Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full p-0" showCloseButton={true}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Print Preview
            </DialogTitle>
            <DialogDescription>
              Review how your report card will look when printed. Click "Print" to open the print dialog.
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[calc(95vh-180px)] bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-start justify-center">
            <div 
              ref={previewRef}
              className="bg-white shadow-2xl overflow-hidden text-xs print:text-[8pt] relative border-4 border-gray-300"
              style={{ 
                width: '210mm',
                minHeight: '297mm',
                transform: `scale(${previewScale})`,
                transformOrigin: 'top center',
                marginBottom: `calc(-297mm * ${1 - previewScale})` // Compensate for scale
              }}
            >
              <div className="px-8 print:px-3 pt-0 print:pt-2 pb-0 print:pb-2 flex flex-col gap-0 relative" style={{ color: 'rgba(26, 26, 26, 1)' }}>
                
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                  <img 
                    src="/pison.png" 
                    alt="Watermark" 
                    className="w-[90%] h-auto opacity-[0.06] transform -rotate-6 grayscale"
                    style={{ filter: 'grayscale(100%) contrast(1.5) brightness(1.5)' }}
                  />
                </div>

                {/* Header */}
                <header className="grid grid-cols-1 md:grid-cols-3 gap-2 print:gap-1 mb-2 print:mb-1 border-b-2 border-black pb-1 print:pb-0.5 relative z-10">
                  <div className="text-center md:text-left text-[0.55rem] print:text-[7pt] uppercase font-medium space-y-0 print:space-y-0 leading-tight mt-0 mb-0 w-fit h-[119px] pt-2 pb-2 flex flex-col gap-2">
                    <p className="print:leading-[1.1]">République du Cameroun</p>
                    <p className="print:leading-[1.1]">Paix - Travail - Patrie</p>
                    <p className="print:leading-[1.1]">Ministère des Enseignements Secondaires</p>
                    <p className="print:leading-[1.1]">Délégation Régional de Littoral</p>
                    <p className="font-bold text-black print:leading-[1.1]">PISON ACADEMY OF EXCELLENCE</p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-24 print:w-24 h-24 print:h-24 mb-1 print:mb-0.5 relative overflow-hidden flex items-center justify-center">
                      {logoError ? (
                        <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-full">
                          <School size={24} className="text-gray-400 print:w-4 print:h-4" />
                        </div>
                      ) : (
                        <img 
                          src="/pison.png" 
                          alt="Pison Academy Logo" 
                          className="max-w-full max-h-full object-contain grayscale" 
                          onError={() => setLogoError(true)}
                        />
                      )}
                    </div>
                    <div className="text-[0.5rem] print:text-[6pt] font-mono text-left">
                      ORDER Nº: <span className="text-red-600 font-bold">714/24/MINESEC/SG/DESTP/SSEPTP OF 31 DECEMBER 2024</span>
                    </div>
                  </div>

                  <div className="text-right text-[0.55rem] print:text-[7pt] uppercase font-medium space-y-2 print:space-y-2 leading-tight pt-2 pb-2">
                    <p className="print:leading-[1.1]">Republic of Cameroon</p>
                    <p className="print:leading-[1.1]">Peace - Work - Fatherland</p>
                    <p className="print:leading-[1.1]">Ministry of Secondary Education</p>
                    <p className="print:leading-[1.1]">Regional Delegation of Littoral</p>
                    <p className="font-bold text-blue-800 print:leading-[1.1]">PISON ACADEMY OF EXCELLENCE</p>
                    <p className="normal-case text-red-600 text-[0.5rem] print:text-[6pt] print:leading-[1.1]">PO Box 58 Edea Tel: 676521570</p>
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
                    <div className="absolute left-2 print:left-1 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center opacity-80 z-20">
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
                        <span className="text-black/80">{termName.ordinal}</span> <span className="relative inline-block">TERM</span>
                      </h2>
                      <p className="font-black text-base print:text-lg uppercase tracking-[0.2em] leading-none mb-1 print:mb-0.5 text-left">
                        REPORT CARD
                      </p>
                      <div className="flex items-center gap-1 w-full justify-center">
                        <div className="h-0.5 w-6 bg-black/30"></div>
                        <p className="text-[0.5rem] print:text-[6pt] font-bold tracking-widest text-black/60 uppercase whitespace-nowrap flex items-center gap-0.5">
                          <Star size={8} className="text-black/60 fill-black/60 print:w-1 print:h-1" /> Bulletin du {termName.fr} <Star size={8} className="text-black/60 fill-black/60 print:w-1 print:h-1" />
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
                <div className="border border-black grid grid-cols-12 mb-1 print:mb-0.5 font-mono text-[0.65rem] print:text-[7pt] relative z-10 bg-white/90">
                  <div className="col-span-12 md:col-span-4 p-1 print:p-0.5 border-b md:border-r border-black">
                    <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">First Name / Prénom</span>
                    <span className="font-bold text-[0.7rem] print:text-[7pt]">{data.student.firstName || data.student.name.split(' ')[0]}</span>
                  </div>
                  <div className="col-span-12 md:col-span-4 p-1 print:p-0.5 border-b md:border-r border-black">
                    <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Last Name / Nom</span>
                    <span className="font-bold text-[0.7rem] print:text-[7pt]">{data.student.lastName || data.student.name.split(' ').slice(1).join(' ')}</span>
                  </div>
                  <div className="col-span-12 md:col-span-4 p-1 print:p-0.5 border-b border-black">
                    <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Unique Identifier No / Matricule</span>
                    <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.studentId}</span>
                  </div>

                  <div className="col-span-2 p-1 print:p-0.5 border-b border-r border-black">
                    <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Sex</span>
                    <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.sex}</span>
                  </div>
                  <div className="col-span-4 p-1 print:p-0.5 border-b border-r border-black">
                    <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Date of Birth / Né le</span>
                    <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.dob}</span>
                  </div>
                  <div className="col-span-4 p-1 print:p-0.5 border-b border-r border-black">
                    <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Place of Birth / Né à</span>
                    <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.pob}</span>
                  </div>
                  <div className="col-span-2 p-1 print:p-0.5 border-b border-black">
                    <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Repeater / Redoublant</span>
                    <span className="font-bold text-[0.65rem] print:text-[7pt]">NO / NON</span>
                  </div>

                  <div className="col-span-5 p-1 print:p-0.5 border-b md:border-b-0 border-r border-black">
                    <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Speciality</span>
                    <span className="font-bold text-[0.65rem] print:text-[7pt]">{getSpecialityFromClass(data.student.className, data.student.speciality)}</span>
                  </div>
                  <div className="col-span-4 p-1 print:p-0.5 border-b md:border-b-0 border-r border-black">
                    <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Class</span>
                    <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.className}</span>
                  </div>
                  <div className="col-span-3 p-1 print:p-0.5 border-b md:border-b-0 border-black">
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
                        <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>Coef</th>
                        <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>{seqLabels.seq1}</th>
                        <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>{seqLabels.seq2}</th>
                        <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>Average</th>
                        <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>TOTAL</th>
                        <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>Grade</th>
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
                              const seqs = getSequenceValues(subject)
                              const avg = subject.termAverage ?? 
                                (seqs.seq1 !== undefined && seqs.seq2 !== undefined 
                                  ? (seqs.seq1 + seqs.seq2) / 2 
                                  : seqs.seq1 ?? seqs.seq2 ?? 0)
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
                                      className="border-r border-black bg-gray-200 text-center font-bold text-[0.55rem] print:text-[6pt] p-0.5 print:p-0.5 uppercase whitespace-nowrap"
                                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                    >
                                      {categoryLabel}
                                    </td>
                                  )}
                                  <td className="p-1 print:p-0.5 border-r border-gray-300 font-medium">{subject.subjectName}</td>
                                  <td 
                                    className={`p-1 print:p-0.5 border-r border-gray-300 text-center relative ${isAdmin && classId ? 'cursor-pointer hover:bg-blue-50 print:hover:bg-transparent print:cursor-default' : ''}`}
                                    onClick={() => {
                                      if (isAdmin && classId && typeof window !== 'undefined' && !window.matchMedia('print').matches) {
                                        handleCoefficientClick(subject)
                                      }
                                    }}
                                  >
                                    {subject.coefficient > 0 ? subject.coefficient : '-'}
                                    {isAdmin && classId && (
                                      <Pencil className="h-3 w-3 text-gray-400 hover:text-blue-600 absolute top-0 right-0 opacity-0 hover:opacity-100 print:hidden transition-opacity pointer-events-none" style={{ margin: '2px' }} />
                                    )}
                                  </td>
                                  <td 
                                    className={`p-1 print:p-0.5 border-r border-gray-300 text-center relative ${isAdmin && classId ? 'cursor-pointer hover:bg-blue-50 print:hover:bg-transparent print:cursor-default' : ''}`}
                                    onClick={() => {
                                      if (isAdmin && classId && typeof window !== 'undefined' && !window.matchMedia('print').matches) {
                                        handleSequenceClick(subject, 1)
                                      }
                                    }}
                                  >
                                    {seqs.seq1?.toFixed(1) ?? '-'}
                                    {isAdmin && classId && (
                                      <Pencil className="h-3 w-3 text-gray-400 hover:text-blue-600 absolute top-0 right-0 opacity-0 hover:opacity-100 print:hidden transition-opacity pointer-events-none" style={{ margin: '2px' }} />
                                    )}
                                  </td>
                                  <td 
                                    className={`p-1 print:p-0.5 border-r border-gray-300 text-center relative ${isAdmin && classId ? 'cursor-pointer hover:bg-blue-50 print:hover:bg-transparent print:cursor-default' : ''}`}
                                    onClick={() => {
                                      if (isAdmin && classId && typeof window !== 'undefined' && !window.matchMedia('print').matches) {
                                        handleSequenceClick(subject, 2)
                                      }
                                    }}
                                  >
                                    {seqs.seq2?.toFixed(1) ?? '-'}
                                    {isAdmin && classId && (
                                      <Pencil className="h-3 w-3 text-gray-400 hover:text-blue-600 absolute top-0 right-0 opacity-0 hover:opacity-100 print:hidden transition-opacity pointer-events-none" style={{ margin: '2px' }} />
                                    )}
                                  </td>
                                  <td className="p-1 print:p-0.5 border-r border-gray-300 text-center">{avg > 0 ? avg.toFixed(1) : '-'}</td>
                                  <td className="p-1 print:p-0.5 border-r border-gray-300 text-center">{totalScore > 0 ? totalScore.toFixed(0) : '-'}</td>
                                  <td className={`p-1 print:p-0.5 border-r border-gray-300 text-center font-bold ${grade === 'F' || grade === 'E' || grade === 'U' ? 'text-red-600' : ''}`}>
                                    {grade}
                                  </td>
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
                              <td className="p-1 print:p-0.5 border-r border-black text-center">{summary.coef}</td>
                              <td colSpan={2} className="p-1 print:p-0.5 border-r border-black text-center text-gray-400">/</td>
                              <td className="p-1 print:p-0.5 border-r border-black text-center whitespace-nowrap text-[0.55rem] print:text-[6pt]">AV: {summary.avg.toFixed(2)}</td>
                              <td className="p-1 print:p-0.5 border-r border-black text-center">{summary.totalScore.toFixed(0)}</td>
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
                        <td className="p-1 print:p-0.5 text-center border-r border-gray-600">{data.totals.coefficient}</td>
                        <td colSpan={2} className="p-1 print:p-0.5 border-r border-gray-600"></td>
                        <td className="p-1 print:p-0.5 text-center border-r border-gray-600 font-bold">{data.totals.average.toFixed(2)}</td>
                        <td className="p-1 print:p-0.5 text-center border-r border-gray-600">{data.totals.totalScore.toFixed(0)}</td>
                        <td colSpan={2} className="bg-gray-100"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer Stats */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 print:gap-1 mb-2 print:mb-1 relative z-10">
                  
                  {/* Left Column: Term History & Discipline */}
                  <div className="col-span-12 md:col-span-6 flex flex-col gap-0">
                    <div className="border border-black bg-white/90">
                      <div className="bg-gray-100 p-0.5 print:p-0.5 text-left text-[0.55rem] print:text-[6pt] font-bold uppercase border-b border-black">
                        Student's Evaluation Results
                      </div>
                      <table className="w-full text-[0.6rem] print:text-[7pt]">
                        <thead>
                          <tr className="border-b border-gray-300">
                            <th className="p-0.5 print:p-0.5 border-r border-gray-300 text-left">TERM</th>
                            <th className="p-0.5 print:p-0.5 text-left">{data.academic.term}</th>
                          </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-300 font-mono">
                              <td className="p-0.5 print:p-0.5 font-bold border-r border-gray-300 text-left pl-1">AVERAGE</td>
                              <td className="p-0.5 print:p-0.5 font-bold">
                                {data.totals.average.toFixed(1)}
                              </td>
                            </tr>
                          <tr className="font-mono">
                            <td className="p-0.5 print:p-0.5 font-bold border-r border-gray-300 text-left pl-1">RANK</td>
                            <td className="p-0.5 print:p-0.5">{data.history?.rank ?? '-'}</td>
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
                          <span className="font-mono font-bold"></span>
                        </div>
                        <div className="flex justify-between">
                          <span>Suspensions / Warnings</span>
                          <span className="font-mono font-bold"></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: GCE Section */}
                  <div className="col-span-12 md:col-span-6">
                    <div className="border border-black bg-white/90">
                      <div className="border-b border-gray-300 p-1 print:p-0.5">
                        <h4 className="font-bold text-[0.6rem] print:text-[7pt] text-left">GCE SECTION</h4>
                      </div>
                      <div className="space-y-0.5 font-mono text-[0.6rem] print:text-[7pt] p-1 print:p-0.5">
                        <div className="flex justify-between"><span>Trade Subjects:</span> <span>{gceCounts.tradeSubjects.toString().padStart(2, '0')}</span></div>
                        <div className="flex justify-between"><span>Related Trade:</span> <span>{gceCounts.relatedTrade.toFixed(1)}</span></div>
                        <div className="flex justify-between"><span>Other Subjects:</span> <span>{gceCounts.otherSubjects.toFixed(1)}</span></div>
                        <div className="flex justify-between font-bold pt-1 border-t border-gray-300 mt-1">
                          <span>GCE SUBJECTS PASSED:</span> <span>{gceCounts.passed.toString().padStart(2, '0')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="flex justify-center items-start gap-2 print:gap-1 mt-auto relative z-10 w-full">
                  <div className="border border-black p-1.5 print:p-1 text-[0.6rem] print:text-[7pt] flex flex-col justify-between bg-white/90 flex-1" style={{ height: '60px' }}>
                    <h4 className="font-bold text-left underline">The Class Master</h4>
                    <div className="text-left font-script text-sm print:text-xs opacity-70">{data.student.classMaster || ''}</div>
                    <div className="text-[0.5rem] print:text-[6pt] text-left text-gray-400 mt-0.5 italic">Signature</div>
                  </div>

                    <div className="border border-black p-1.5 print:p-1 text-[0.6rem] print:text-[7pt] flex flex-col justify-between bg-white/90 flex-1" style={{ height: '60px' }}>
                      <h4 className="font-bold text-left underline">The Principal</h4>
                      <div className="text-left font-script text-sm print:text-xs opacity-70"></div>
                      <div className="text-[0.5rem] print:text-[6pt] text-left text-gray-400 mt-0.5 italic">Stamp & Signature</div>
                    </div>
                </div>
                

              </div>
              
              {/* Bottom Border */}
              <div className="h-1 print:h-0.5 w-full bg-black print:block" />
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 border-t bg-gray-50">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-muted-foreground">
                Review the preview above, then click Print to open the print dialog
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handlePrintFromPreview} className="bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Print Report Card
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Mark/Coefficient Dialog */}
      {editingSubject && (
        <EditMarkDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          subjectName={editingSubject.subjectName}
          subjectId={editingSubject.subjectId}
          sequenceNumber={editingSubject.sequenceNumber}
          sequenceName={editingSubject.sequenceName}
          currentMark={editingSubject.currentMark}
          currentCoefficient={editingSubject.currentCoefficient}
          studentId={editingSubject.editType === 'mark' || editingSubject.editType === 'both' ? data.student.id : undefined}
          classId={editingSubject.editType === 'mark' || editingSubject.editType === 'both' ? classId : undefined}
          term={editingSubject.editType === 'mark' || editingSubject.editType === 'both' ? data.academic.term : undefined}
          academicYear={editingSubject.editType === 'mark' || editingSubject.editType === 'both' ? data.academic.year : undefined}
          editType={editingSubject.editType}
          onSave={handleMarkSaved}
        />
      )}
    </>
  )
}

export default TermReportCard
