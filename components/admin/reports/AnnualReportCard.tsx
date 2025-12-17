"use client"

import React, { useRef, useMemo, useState } from 'react'
import { 
  Printer, 
  Download,
  GraduationCap,
  School,
  User,
  Star,
  Award,
  BookOpen,
} from 'lucide-react'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

import { SubjectGrade } from './report-card-types'

interface AnnualReportCardProps {
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

export function AnnualReportCard({ data }: AnnualReportCardProps) {
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
      const a4Width = 210
      const a4Height = 297
      
      // Configure PDF options with optimized settings for high-quality output
      const opt = {
        margin: [0, 0, 0, 0],
        filename: filename,
        image: { 
          type: 'jpeg', 
          quality: 1.0 // Maximum quality for crisp text and barcodes
        },
        html2canvas: { 
          scale: 2, // High DPI (2x) for crisp text and barcodes
          useCORS: true, // CORS support for external images (logos, student photos)
          logging: false,
          backgroundColor: '#ffffff',
          letterRendering: true, // Better text rendering
          allowTaint: false, // Prevent canvas tainting, ensures CORS images work
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight
        },
        jsPDF: { 
          unit: 'mm', 
          format: [a4Width, a4Height], // A4 format: 210mm × 297mm
          orientation: 'portrait',
          compress: false, // Disable compression for better quality
          precision: 16
        },
        pagebreak: { 
          mode: ['avoid-all', 'css'], // Better page break handling
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: ['tr', '.no-break']
        }
      }

      // Add a small delay to ensure all styles and images are fully loaded
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Generate and download PDF
      await html2pdf().set(opt).from(element).save()
      
      toast.success('PDF downloaded successfully', {
        description: `Report card saved as ${filename}`
      })
    } catch (error) {
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
  const calculateCategorySummary = (subjects: typeof data.subjects, category: string) => {
    const coef = subjects.reduce((sum, s) => sum + s.coefficient, 0)
    const totalScore = subjects.reduce((sum, s) => {
      const avg = s.annualAverage ?? 0
      return sum + (avg * s.coefficient)
    }, 0)
    const avg = coef > 0 ? totalScore / coef : 0
    const rank = subjects.length > 0 ? Math.min(...subjects.map(s => s.rank ?? 0).filter(r => r > 0)) || 0 : 0
    const passed = subjects.filter(s => {
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

  // Calculate GCE section counts
  // Use API-provided GCE counts (only subjects with codes) if available, otherwise calculate from grouped subjects
  const gceCounts = React.useMemo(() => {
    // Check if API provides GCE counts (from stats)
    if (data.stats && 
        'gceTradeSubjects' in data.stats && 
        'gceRelatedTrade' in data.stats && 
        'gceOtherSubjects' in data.stats && 
        'gceSubjectsPassed' in data.stats) {
      return {
        tradeSubjects: data.stats.gceTradeSubjects ?? 0,
        relatedTrade: data.stats.gceRelatedTrade ?? 0,
        otherSubjects: data.stats.gceOtherSubjects ?? 0,
        passed: data.stats.gceSubjectsPassed ?? 0
      }
    }
    
    // Fallback: Calculate from grouped subjects, but only count subjects with codes (GCE subjects) that are PASSED (marks >= 10)
    const tradeSubjects = groupedSubjects.find(g => g.category === 'trade_subjects')?.subjects.filter(s => {
      if (!s.code) return false
      return (s.annualAverage ?? 0) >= 10
    }).length || 0
    
    const relatedTrade = groupedSubjects.find(g => g.category === 'related_trade_subjects')?.subjects.filter(s => {
      if (!s.code) return false
      return (s.annualAverage ?? 0) >= 10
    }).length || 0
    
    const otherSubjects = groupedSubjects.find(g => g.category === 'others')?.subjects.filter(s => {
      if (!s.code) return false
      return (s.annualAverage ?? 0) >= 10
    }).length || 0
    
    const passed = groupedSubjects.reduce((sum, group) => {
      return sum + group.subjects.filter(s => {
        // Only count subjects with codes (GCE subjects) that are PASSED
        if (!s.code) return false
        return (s.annualAverage ?? 0) >= 10
      }).length
    }, 0)
    
    return { tradeSubjects, relatedTrade, otherSubjects, passed }
  }, [groupedSubjects, data.stats])

  // Generate QR Code data with report card information
  const qrCodeData = useMemo(() => {
    const reportCardInfo = {
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
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full print:max-w-full overflow-hidden text-xs print:text-[8pt] relative print:h-[297mm]" ref={printRef}>
        
        {/* Top Border */}
        <div className="h-1 print:h-0.5 w-full bg-black print:block" style={{ color: 'rgba(17, 24, 39, 1)' }} />

        <div className="px-2 print:px-3 pt-2 print:pt-2 pb-2 print:pb-2 flex flex-col gap-0 relative" style={{ color: 'rgba(26, 26, 26, 1)' }}>
          
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
            <div className="text-center md:text-left text-[0.55rem] print:text-[7pt] uppercase font-medium space-y-0 print:space-y-0 leading-tight">
              <p className="print:leading-[1.1]">République du Cameroun</p>
              <p className="print:leading-[1.1]">Paix - Travail - Patrie</p>
              <p className="print:leading-[1.1]">Ministère des Enseignements Secondaires</p>
              <p className="print:leading-[1.1]">Délégation Régional de Littoral</p>
              <p className="font-bold text-black print:leading-[1.1]">PISON ACADEMY OF EXCELLENCE</p>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 print:w-12 h-16 print:h-12 mb-1 print:mb-0.5 relative overflow-hidden flex items-center justify-center">
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
                ORDER Nº: <span className="text-red-600 font-bold">{data.academic.orderNo}</span>
              </div>
            </div>

            <div className="text-left text-[0.55rem] print:text-[7pt] uppercase font-medium space-y-0 print:space-y-0 leading-tight">
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
          <div className="border border-black grid grid-cols-12 mb-1 print:mb-0.5 font-mono text-[0.65rem] print:text-[7pt] relative z-10 bg-white/90">
            <div className="col-span-12 md:col-span-4 p-1 print:p-0.5 border-b md:border-r border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Unique Identifier No / Matricule</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.studentId}</span>
            </div>
            <div className="col-span-12 md:col-span-6 p-1 print:p-0.5 border-b md:border-r border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Name & Surname / Noms et Prénoms</span>
              <span className="font-bold text-[0.7rem] print:text-[7pt]">{data.student.name}</span>
            </div>
            <div className="col-span-12 md:col-span-2 p-1 print:p-0.5 border-b border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Repeater / Redoublant</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">NO / NON</span>
            </div>

            <div className="col-span-2 p-1 print:p-0.5 border-b border-r border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Sex</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.sex}</span>
            </div>
            <div className="col-span-7 p-1 print:p-0.5 border-b border-r border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Date & Place of Birth / Né le - à</span>
              <div className="flex gap-1 text-[0.65rem] print:text-[7pt]">
                <span className="font-bold">{data.student.dob}</span>
                <span className="text-gray-400">|</span>
                <span className="font-bold">{data.student.pob}</span>
              </div>
            </div>
            
            {/* Photo Area */}
            <div className="col-span-3 row-span-2 border-b border-black flex flex-col items-center justify-center p-1 print:p-0.5 bg-gray-50">
              {data.student.photoUrl ? (
                <img src={data.student.photoUrl} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <div className="text-left text-gray-400 text-[0.5rem] print:text-[6pt]">
                  <User size={20} className="mx-auto mb-0.5 opacity-20 print:w-3 print:h-3" />
                  PHOTO
                </div>
              )}
            </div>

            <div className="col-span-5 p-1 print:p-0.5 border-b md:border-b-0 border-r border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Speciality</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.speciality || 'General'}</span>
            </div>
            <div className="col-span-2 p-1 print:p-0.5 border-b md:border-b-0 border-r border-black">
              <span className="block text-[0.5rem] print:text-[6pt] text-gray-500 uppercase leading-tight">Class</span>
              <span className="font-bold text-[0.65rem] print:text-[7pt]">{data.student.className}</span>
            </div>
            <div className="col-span-2 p-1 print:p-0.5 border-b md:border-b-0 border-r border-black">
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
                        const totalScore = avg * subject.coefficient
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
                            <td className="p-1 print:p-0.5 border-r border-gray-300 text-center">{avg > 0 ? avg.toFixed(1) : '-'}</td>
                            <td className="p-1 print:p-0.5 border-r border-gray-300 text-center">{subject.coefficient}</td>
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
                  Student's Evaluation Results
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
  )
}

export default AnnualReportCard
