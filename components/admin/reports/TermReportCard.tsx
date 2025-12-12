"use client"

import React, { useRef } from 'react';
import { 
  Printer, 
  GraduationCap,
  School,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SubjectGrade {
  subjectName: string
  coefficient: number
  sequences: {
    seq1?: number
    seq2?: number
    seq3?: number
    seq4?: number
  }
  termAverage?: number
  grade?: string
  rank?: number
  remarks?: string
}

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
      term: 1 | 2
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
    }
    discipline: {
      absences: number
      suspensions: number
      warnings: number
    }
  }
}

const TERM_NAMES: Record<number, { en: string, fr: string }> = {
  1: { en: 'FIRST TERM', fr: 'Premier Trimestre' },
  2: { en: 'SECOND TERM', fr: 'Deuxième Trimestre' },
}

const SEQUENCE_LABELS: Record<number, { seq1: string, seq2: string }> = {
  1: { seq1: 'Seq 1', seq2: 'Seq 2' },
  2: { seq1: 'Seq 3', seq2: 'Seq 4' },
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

export function TermReportCard({ data }: TermReportCardProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [logoError, setLogoError] = React.useState(false)

  const handlePrint = () => {
    window.print()
  }

  const term = data.academic.term
  const termName = TERM_NAMES[term]
  const seqLabels = SEQUENCE_LABELS[term]

  // Get sequence values based on term
  const getSequenceValues = (subject: SubjectGrade) => {
    if (term === 1) {
      return { seq1: subject.sequences.seq1, seq2: subject.sequences.seq2 }
    } else {
      return { seq1: subject.sequences.seq3, seq2: subject.sequences.seq4 }
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-900">
      
      {/* Control Bar - Hide on print */}
      <div className="print:hidden max-w-[210mm] mx-auto mb-4 flex justify-end gap-2">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      {/* Main Report Card Sheet */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full overflow-hidden text-xs md:text-sm print:text-[10pt] relative">
        
        {/* Top Border */}
        <div className="h-2 w-full bg-black print:block" />

        <div className="p-4 md:p-6 print:p-2 flex flex-col gap-4 relative" ref={printRef}>
          
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
            <GraduationCap className="w-[60%] h-auto opacity-[0.03] transform -rotate-12" />
          </div>

          {/* Header */}
          <header className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 border-b-2 border-black pb-4 relative z-10">
            <div className="text-center md:text-left text-[0.65rem] md:text-[0.7rem] uppercase font-medium space-y-1">
              <p>République du Cameroun</p>
              <p>Paix - Travail - Patrie</p>
              <p>Ministère des Enseignements Secondaires</p>
              <p>Délégation Régional de Littoral</p>
              <p className="font-bold text-black mt-1">PISON ACADEMY OF EXCELLENCE</p>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 mb-2 relative overflow-hidden flex items-center justify-center">
                {logoError ? (
                  <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-full">
                    <School size={32} className="text-gray-400" />
                  </div>
                ) : (
                  <img 
                    src="https://raw.githubusercontent.com/builderstoryguide/pison/New-Work/public/pison.png" 
                    alt="Pison Academy Logo" 
                    className="max-w-full max-h-full object-contain grayscale" 
                    onError={() => setLogoError(true)}
                  />
                )}
              </div>
              <div className="text-[0.6rem] font-mono text-center">
                ORDER Nº: <span className="text-red-600 font-bold">{data.academic.orderNo}</span>
              </div>
            </div>

            <div className="text-center md:text-right text-[0.65rem] md:text-[0.7rem] uppercase font-medium space-y-1">
              <p>Republic of Cameroon</p>
              <p>Peace - Work - Fatherland</p>
              <p>Ministry of Secondary Education</p>
              <p>Regional Delegation of Littoral</p>
              <p className="font-bold text-blue-800 mt-1">PISON ACADEMY OF EXCELLENCE</p>
              <p className="normal-case text-red-600 text-[0.6rem]">PO Box 58 Edea Tel: 676521570</p>
            </div>
          </header>

          {/* Title Banner */}
          <div className="mb-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between bg-black text-white p-1 mb-1">
              <span className="font-mono text-[0.6rem] uppercase tracking-widest px-2">Academic Year {data.academic.year}</span>
              <div className="flex-1 mx-4 h-px bg-white/50 hidden md:block"></div>
              <span className="font-mono text-[0.6rem] uppercase tracking-widest px-2">Année Scolaire {data.academic.year}</span>
            </div>
            
            <div className="border-4 border-black p-4 relative overflow-hidden">
              <div className="flex flex-col items-center justify-center relative z-10">
                <h2 className="font-black text-3xl md:text-5xl uppercase tracking-tighter leading-none mb-1 text-center">
                  {termName.en}
                </h2>
                <p className="font-black text-xl md:text-3xl uppercase tracking-[0.2em] leading-none mb-3 text-center">
                  REPORT CARD
                </p>
                <div className="flex items-center gap-2 w-full justify-center">
                  <div className="h-0.5 w-8 bg-black/30"></div>
                  <p className="text-[0.6rem] font-bold tracking-widest text-black/60 uppercase whitespace-nowrap flex items-center gap-1">
                    <Star size={10} className="text-black/60 fill-black/60" /> 
                    Bulletin du {termName.fr}
                    <Star size={10} className="text-black/60 fill-black/60" />
                  </p>
                  <div className="h-0.5 w-8 bg-black/30"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="border-2 border-black grid grid-cols-12 mb-6 font-mono text-xs relative z-10 bg-white/90">
            <div className="col-span-12 md:col-span-4 p-2 border-b md:border-r border-black">
              <span className="block text-[0.6rem] text-gray-500 uppercase">Matricule</span>
              <span className="font-bold">{data.student.studentId}</span>
            </div>
            <div className="col-span-12 md:col-span-6 p-2 border-b md:border-r border-black">
              <span className="block text-[0.6rem] text-gray-500 uppercase">Name & Surname</span>
              <span className="font-bold text-sm">{data.student.name}</span>
            </div>
            <div className="col-span-12 md:col-span-2 p-2 border-b border-black">
              <span className="block text-[0.6rem] text-gray-500 uppercase">Sex</span>
              <span className="font-bold">{data.student.sex}</span>
            </div>

            <div className="col-span-4 p-2 border-b border-r border-black">
              <span className="block text-[0.6rem] text-gray-500 uppercase">Date of Birth</span>
              <span className="font-bold">{data.student.dob}</span>
            </div>
            <div className="col-span-5 p-2 border-b border-r border-black">
              <span className="block text-[0.6rem] text-gray-500 uppercase">Place of Birth</span>
              <span className="font-bold">{data.student.pob}</span>
            </div>
            <div className="col-span-3 p-2 border-b border-black">
              <span className="block text-[0.6rem] text-gray-500 uppercase">Class</span>
              <span className="font-bold">{data.student.className}</span>
            </div>
          </div>

          {/* Grades Table */}
          <div className="border-2 border-black mb-6 overflow-hidden relative z-10 bg-white/90">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-[0.65rem] uppercase font-bold border-b-2 border-black">
                <tr>
                  <th className="p-2 border-r border-black w-1/3">Subject</th>
                  <th className="p-2 border-r border-black text-center w-12">Coef</th>
                  <th className="p-2 border-r border-black text-center w-14">{seqLabels.seq1}</th>
                  <th className="p-2 border-r border-black text-center w-14">{seqLabels.seq2}</th>
                  <th className="p-2 border-r border-black text-center w-14">Average</th>
                  <th className="p-2 border-r border-black text-center w-12">Total</th>
                  <th className="p-2 border-r border-black text-center w-12">Grade</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="text-[0.7rem] font-mono">
                {data.subjects.map((subject, idx) => {
                  const seqs = getSequenceValues(subject)
                  const avg = subject.termAverage ?? 
                    (seqs.seq1 !== undefined && seqs.seq2 !== undefined 
                      ? (seqs.seq1 + seqs.seq2) / 2 
                      : seqs.seq1 ?? seqs.seq2 ?? 0)
                  const total = avg * subject.coefficient
                  const grade = calculateGrade(avg)
                  const remarks = calculateRemarks(grade)

                  return (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-2 border-r border-gray-300 font-medium">{subject.subjectName}</td>
                      <td className="p-2 border-r border-gray-300 text-center">{subject.coefficient}</td>
                      <td className="p-2 border-r border-gray-300 text-center">{seqs.seq1?.toFixed(1) ?? '-'}</td>
                      <td className="p-2 border-r border-gray-300 text-center">{seqs.seq2?.toFixed(1) ?? '-'}</td>
                      <td className="p-2 border-r border-gray-300 text-center font-bold">{avg.toFixed(2)}</td>
                      <td className="p-2 border-r border-gray-300 text-center">{total.toFixed(2)}</td>
                      <td className={`p-2 border-r border-gray-300 text-center font-bold ${grade === 'F' || grade === 'E' ? 'text-red-600' : ''}`}>
                        {grade}
                      </td>
                      <td className={`p-2 ${remarks.includes('Fail') || remarks.includes('Weak') ? 'text-red-600' : 'text-green-700'}`}>
                        {remarks}
                      </td>
                    </tr>
                  )
                })}
                
                {/* Total Row */}
                <tr className="bg-black text-white font-bold text-sm">
                  <td className="p-3 text-right uppercase border-r border-gray-600">Total</td>
                  <td className="p-3 text-center border-r border-gray-600">{data.totals.coefficient}</td>
                  <td colSpan={2} className="p-3 border-r border-gray-600"></td>
                  <td className="p-3 text-center border-r border-gray-600 font-bold">{data.totals.average.toFixed(2)}</td>
                  <td className="p-3 text-center border-r border-gray-600">{data.totals.totalScore.toFixed(2)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 relative z-10">
            {/* Discipline */}
            <div className="border border-black bg-white/90">
              <div className="bg-gray-100 p-1 text-center text-[0.65rem] font-bold uppercase border-b border-black">
                Discipline & Conduct
              </div>
              <div className="text-[0.7rem] p-2 space-y-2">
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span>Unjustified Absences</span>
                  <span className="font-mono font-bold">{data.discipline.absences}hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Warnings / Suspensions</span>
                  <span className="font-mono font-bold">{data.discipline.warnings}</span>
                </div>
              </div>
            </div>

            {/* Average Circle */}
            <div className="flex items-center justify-center py-4">
              <div className="w-32 h-32 rounded-full border-4 border-black flex flex-col items-center justify-center bg-white shadow-lg">
                <span className="text-[0.6rem] text-gray-500 uppercase font-bold">Term Average</span>
                <span className="text-4xl font-black">{data.totals.average.toFixed(2)}</span>
                <span className={`text-[0.6rem] font-bold uppercase ${data.totals.average >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.totals.average >= 10 ? 'Passed' : 'Failed'}
                </span>
              </div>
            </div>

            {/* Class Stats */}
            <div className="border border-black h-full bg-white/90">
              <div className="bg-gray-100 p-1 text-center text-[0.65rem] font-bold uppercase border-b border-black">
                Class Statistics
              </div>
              <table className="w-full text-[0.7rem]">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="p-1 pl-2 font-bold">Class Size</td>
                    <td className="p-1 pl-2 font-mono">{data.stats.classSize}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1 pl-2 font-bold">Highest Average</td>
                    <td className="p-1 pl-2 font-mono">{data.stats.maxAvg.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1 pl-2 font-bold">Lowest Average</td>
                    <td className="p-1 pl-2 font-mono">{data.stats.minAvg.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-1 pl-2 font-bold bg-gray-100">Class Average</td>
                    <td className="p-1 pl-2 font-mono font-bold bg-gray-100">{data.stats.classAvg.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-auto h-24 relative z-10">
            <div className="border border-black p-3 text-[0.7rem] flex flex-col justify-between bg-white/90">
              <h4 className="font-bold text-center underline">Parent/Guardian</h4>
              <div className="text-xs text-center text-gray-400 mt-2 italic">Signature</div>
            </div>
            
            <div className="border border-black p-3 text-[0.7rem] flex flex-col justify-between bg-white/90">
              <h4 className="font-bold text-center underline">Class Master</h4>
              <div className="text-center font-script text-lg opacity-70">{data.student.classMaster || ''}</div>
              <div className="text-xs text-center text-gray-400 italic">Signature</div>
            </div>

            <div className="border border-black p-3 text-[0.7rem] flex flex-col justify-between bg-white/90">
              <h4 className="font-bold text-center underline">The Principal</h4>
              <div className="text-xs text-center text-gray-400 mt-2 italic">Stamp & Signature</div>
            </div>
          </div>
          
          <div className="text-[0.6rem] text-center text-gray-400 mt-2 font-mono uppercase relative z-10">
            This document is computer generated and contains no alterations.
          </div>

        </div>
        
        {/* Bottom Border */}
        <div className="h-2 w-full bg-black print:block" />
      </div>
    </div>
  )
}

export default TermReportCard
