'use client'

import React from 'react'
import type { TermSequenceCounts } from '@/lib/sequence-term-mapping'
import { calculateGrade, getGradeRemarks, isNegativeRemark } from '@/lib/grading-utils'
import { REPORT_CARD_CATEGORIES } from '@/lib/report-card-transform'
import {
  formatReportMark,
  getSubjectTermAvg,
  getSubjectAnnualAvg,
  subjectHasYearSummaryMark,
  subjectCoefEligibleForYearSummary,
} from '@/lib/report-card-term-averages'
import type { SubjectGrade } from './report-card-types'

function getCategoryLabel(category: string | undefined): string {
  switch (category) {
    case 'general':
      return 'GENERAL'
    case 'languages':
      return 'LANGUAGES'
    case 'related_trade_subjects':
      return 'R.T.S'
    case 'trade_subjects':
      return 'TRADE SUBJECTS'
    case 'others':
      return 'OTHER SUBJECTS'
    default:
      return 'OTHER SUBJECTS'
  }
}

function getCategoryFullLabel(category: string | undefined): string {
  switch (category) {
    case 'general':
      return 'GENERAL SUBJECTS'
    case 'languages':
      return 'LANGUAGES'
    case 'related_trade_subjects':
      return 'RELATED TRADE SUBJECTS'
    case 'trade_subjects':
      return 'TRADE SUBJECTS'
    case 'others':
      return 'OTHER SUBJECTS'
    default:
      return 'OTHER SUBJECTS'
  }
}

function coefficientCellDisplay(subject: SubjectGrade): string | number {
  if (subject.coefficient > 0) return subject.coefficient
  if (subject.plannedCoefficient != null && subject.plannedCoefficient > 0) {
    return subject.plannedCoefficient
  }
  return '-'
}

export interface ThirdTermYearSummaryGradesTableProps {
  subjects: SubjectGrade[]
  termCounts: TermSequenceCounts
  totalCoefficient: number
  totalScore: number
  tableAnnualAvg: number
}

export function ThirdTermYearSummaryGradesTable({
  subjects,
  termCounts,
  totalCoefficient,
  totalScore,
  tableAnnualAvg,
}: ThirdTermYearSummaryGradesTableProps) {
  const groupedSubjects = React.useMemo(() => {
    const groups: Record<string, SubjectGrade[]> = Object.fromEntries(
      REPORT_CARD_CATEGORIES.map((c) => [c, [] as SubjectGrade[]])
    )
    subjects.forEach((subject) => {
      const category = subject.category && groups[subject.category] ? subject.category : 'others'
      groups[category].push(subject)
    })
    return REPORT_CARD_CATEGORIES.map((category) => ({
      category,
      subjects: groups[category] || [],
    })).filter((group) => group.subjects.length > 0)
  }, [subjects])

  const annualAverageFromSubject = React.useCallback(
    (subject: SubjectGrade) => getSubjectAnnualAvg(subject, termCounts),
    [termCounts]
  )

  const calculateCategorySummary = React.useCallback(
    (groupSubjects: SubjectGrade[], category: string) => {
      const coef = groupSubjects.reduce(
        (sum, s) => sum + (subjectCoefEligibleForYearSummary(s) ? s.coefficient : 0),
        0
      )
      const sectionTotal = groupSubjects.reduce((sum, s) => {
        if (!subjectCoefEligibleForYearSummary(s)) return sum
        const avg = annualAverageFromSubject(s)
        if (avg === undefined) return sum
        return sum + avg * s.coefficient
      }, 0)
      const avg = coef > 0 ? sectionTotal / coef : 0
      const validRanks = groupSubjects.map((s) => s.rank ?? 0).filter((r) => r > 0)
      const rank = validRanks.length > 0 ? Math.min(...validRanks) : 0
      const categoryName =
        category === 'general'
          ? 'general subjects'
          : category === 'languages'
            ? 'languages'
            : category === 'related_trade_subjects'
              ? 'related trade subjects'
              : category === 'trade_subjects'
                ? 'trade subjects'
                : 'other subjects'
      const remark = avg >= 10 ? `Pass in ${categoryName}` : `Fail in ${categoryName}`
      return { coef, totalScore: sectionTotal, avg, rank, remark }
    },
    [annualAverageFromSubject]
  )

  return (
    <>
      <thead
        className="bg-gray-100 text-[0.55rem] print:text-[7pt] uppercase font-bold border-b border-black"
        style={{ backgroundColor: '#E0E0E0' }}
      >
        <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <th
            className="p-1 print:p-0.5 border-r border-black w-12 print:w-10"
            style={{ fontSize: '7pt', width: '8%', border: '1px solid #000', padding: '4px 6px' }}
          />
          <th
            className="p-1 print:p-0.5 border-r border-black w-1/3 text-left"
            style={{ fontSize: '7pt', width: '25%', border: '1px solid #000', padding: '4px 6px' }}
          >
            Subjects
          </th>
          <th
            className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8"
            style={{ fontSize: '7pt', width: '6%', border: '1px solid #000', padding: '4px 6px' }}
          >
            Coef
          </th>
          <th
            className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8"
            style={{ fontSize: '7pt', width: '7%', border: '1px solid #000', padding: '4px 6px' }}
          >
            Term 1
          </th>
          <th
            className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8"
            style={{ fontSize: '7pt', width: '7%', border: '1px solid #000', padding: '4px 6px' }}
          >
            Term 2
          </th>
          <th
            className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8"
            style={{ fontSize: '7pt', width: '7%', border: '1px solid #000', padding: '4px 6px' }}
          >
            Term 3
          </th>
          <th
            className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8"
            style={{ fontSize: '7pt', width: '8%', border: '1px solid #000', padding: '4px 6px' }}
          >
            Annual Avg
          </th>
          <th
            className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8"
            style={{ fontSize: '7pt', width: '8%', border: '1px solid #000', padding: '4px 6px' }}
          >
            TOTAL
          </th>
          <th
            className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8"
            style={{ fontSize: '7pt', width: '7%', border: '1px solid #000', padding: '4px 6px' }}
          >
            Grade
          </th>
          <th
            className="p-1 print:p-0.5 text-left"
            style={{ fontSize: '7pt', width: '24%', border: '1px solid #000', padding: '4px 6px' }}
          >
            Remarks
          </th>
        </tr>
      </thead>
      <tbody className="text-[0.6rem] print:text-[7pt] font-mono report-card-subjects-tbody">
        {groupedSubjects.map((group, groupIdx) => {
          const summary = calculateCategorySummary(group.subjects, group.category)
          const categoryLabel = getCategoryLabel(group.category)
          const printOrder = groupedSubjects.length - groupIdx

          return (
            <React.Fragment key={group.category}>
              {group.subjects.map((subject, idx) => {
                const t1 = getSubjectTermAvg(subject, 1, termCounts)
                const t2 = getSubjectTermAvg(subject, 2, termCounts)
                const t3 = getSubjectTermAvg(subject, 3, termCounts)
                const avg = annualAverageFromSubject(subject)
                const eligible = subjectCoefEligibleForYearSummary(subject)
                const hasMark = subjectHasYearSummaryMark(subject)
                const rowTotal =
                  eligible && avg !== undefined ? avg * subject.coefficient : undefined
                const grade =
                  hasMark && subject.grade && subject.grade !== '-'
                    ? subject.grade
                    : hasMark && avg !== undefined
                      ? calculateGrade(avg)
                      : '-'
                const remarks =
                  hasMark && subject.remarks && subject.remarks !== 'No Grade'
                    ? subject.remarks
                    : hasMark && avg !== undefined
                      ? getGradeRemarks(calculateGrade(avg))
                      : subject.remarks || '-'

                return (
                  <tr
                    key={`${group.category}-${idx}`}
                    className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent"
                    style={{
                      '--print-order': printOrder,
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                      borderBottom: '1px solid #e5e7eb',
                    } as React.CSSProperties}
                  >
                    {idx === 0 && (
                      <td
                        rowSpan={group.subjects.length + 1}
                        className="border-r border-black bg-gray-200 text-center font-bold text-[0.55rem] print:text-[6pt] p-0 print:p-0 uppercase whitespace-nowrap relative"
                        style={{
                          border: '1px solid #000',
                          backgroundColor: '#E0E0E0',
                          width: '30px',
                          minWidth: '30px',
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            style={{
                              transform: 'rotate(-90deg)',
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {categoryLabel}
                          </span>
                        </div>
                      </td>
                    )}
                    <td
                      className="p-1 print:p-0.5 border-r border-gray-300 font-medium"
                      style={{ border: '1px solid #d1d5db', padding: '4px 6px' }}
                    >
                      {subject.subjectName}
                    </td>
                    <td
                      className="p-1 print:p-0.5 border-r border-gray-300 text-center"
                      style={{ border: '1px solid #d1d5db', padding: '4px 6px' }}
                    >
                      {coefficientCellDisplay(subject)}
                    </td>
                    <td
                      className="p-1 print:p-0.5 border-r border-gray-300 text-center"
                      style={{ border: '1px solid #d1d5db', padding: '4px 6px' }}
                    >
                      {formatReportMark(t1)}
                    </td>
                    <td
                      className="p-1 print:p-0.5 border-r border-gray-300 text-center"
                      style={{ border: '1px solid #d1d5db', padding: '4px 6px' }}
                    >
                      {formatReportMark(t2)}
                    </td>
                    <td
                      className="p-1 print:p-0.5 border-r border-gray-300 text-center"
                      style={{ border: '1px solid #d1d5db', padding: '4px 6px' }}
                    >
                      {formatReportMark(t3)}
                    </td>
                    <td
                      className="p-1 print:p-0.5 border-r border-gray-300 text-center"
                      style={{ border: '1px solid #d1d5db', padding: '4px 6px' }}
                    >
                      {hasMark && avg !== undefined ? avg.toFixed(2) : '-'}
                    </td>
                    <td
                      className="p-1 print:p-0.5 border-r border-gray-300 text-center"
                      style={{ border: '1px solid #d1d5db', padding: '4px 6px' }}
                    >
                      {rowTotal !== undefined ? rowTotal.toFixed(0) : '-'}
                    </td>
                    <td
                      className={`p-1 print:p-0.5 border-r border-gray-300 text-center font-bold ${grade === 'D' || grade === 'U' ? 'text-red-600' : ''}`}
                      style={{
                        border: '1px solid #d1d5db',
                        padding: '4px 6px',
                        color: grade === 'D' || grade === 'U' ? '#dc2626' : 'inherit',
                      }}
                    >
                      {grade}
                    </td>
                    <td
                      className={`p-1 print:p-0.5 ${isNegativeRemark(remarks) ? 'text-red-600' : 'text-green-700'}`}
                      style={{
                        padding: '4px 6px',
                        color: isNegativeRemark(remarks) ? '#dc2626' : '#15803d',
                      }}
                    >
                      {remarks}
                    </td>
                  </tr>
                )
              })}
              <tr
                className="bg-gray-300 font-bold border-b border-black"
                style={{
                  '--print-order': printOrder,
                  backgroundColor: '#CCCCCC',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                  borderBottom: '1px solid #000',
                } as React.CSSProperties}
              >
                <td
                  className="p-1 print:p-0.5 border-r border-black uppercase text-[0.55rem] print:text-[6pt] text-left"
                  style={{ border: '1px solid #000', padding: '4px 6px' }}
                >
                  {getCategoryFullLabel(group.category)} Summary
                </td>
                <td
                  className="p-1 print:p-0.5 border-r border-black text-center"
                  style={{ border: '1px solid #000', padding: '4px 6px' }}
                >
                  {summary.coef}
                </td>
                <td
                  colSpan={3}
                  className="p-1 print:p-0.5 border-r border-black text-center text-gray-400"
                  style={{ border: '1px solid #000', padding: '4px 6px', color: '#9ca3af' }}
                >
                  /
                </td>
                <td
                  className="p-1 print:p-0.5 border-r border-black text-center whitespace-nowrap text-[0.55rem] print:text-[6pt]"
                  style={{ border: '1px solid #000', padding: '4px 6px' }}
                >
                  AV: {summary.avg.toFixed(2)}
                </td>
                <td
                  className="p-1 print:p-0.5 border-r border-black text-center"
                  style={{ border: '1px solid #000', padding: '4px 6px' }}
                >
                  {summary.totalScore.toFixed(0)}
                </td>
                <td
                  className="p-1 print:p-0.5 border-r border-black text-center"
                  style={{ border: '1px solid #000', padding: '4px 6px' }}
                >
                  {summary.rank > 0 ? summary.rank : '-'}
                </td>
                <td
                  className="p-1 print:p-0.5 uppercase text-[0.55rem] print:text-[6pt] text-left"
                  style={{ padding: '4px 6px' }}
                >
                  {summary.remark}
                </td>
              </tr>
            </React.Fragment>
          )
        })}
        <tr
          className="bg-black text-white font-bold text-[0.65rem] print:text-[7pt]"
          style={{
            '--print-order': 0,
            backgroundColor: '#000000',
            color: '#ffffff',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
          } as React.CSSProperties}
        >
          <td
            colSpan={2}
            className="p-1 print:p-0.5 text-left uppercase border-r border-gray-600"
            style={{ border: '1px solid #4b5563', padding: '4px 6px' }}
          >
            Total Summary / Bilan Totale
          </td>
          <td
            className="p-1 print:p-0.5 text-center border-r border-gray-600"
            style={{ border: '1px solid #4b5563', padding: '4px 6px' }}
          >
            {totalCoefficient}
          </td>
          <td
            colSpan={3}
            className="p-1 print:p-0.5 border-r border-gray-600"
            style={{ border: '1px solid #4b5563', padding: '4px 6px' }}
          />
          <td
            className="p-1 print:p-0.5 text-center border-r border-gray-600 font-bold"
            style={{ border: '1px solid #4b5563', padding: '4px 6px' }}
          >
            {tableAnnualAvg.toFixed(2)}
          </td>
          <td
            className="p-1 print:p-0.5 text-center border-r border-gray-600"
            style={{ border: '1px solid #4b5563', padding: '4px 6px' }}
          >
            {totalScore.toFixed(0)}
          </td>
          <td colSpan={2} className="bg-gray-100" style={{ backgroundColor: '#CCCCCC', padding: '4px 6px' }} />
        </tr>
      </tbody>
    </>
  )
}
