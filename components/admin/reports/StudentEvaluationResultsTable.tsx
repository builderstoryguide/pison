'use client'

import type { CSSProperties } from 'react'

export interface StudentEvaluationResultsProps {
  term1?: number
  term2?: number
  term3?: number
  rank1?: number
  rank2?: number
  rank3?: number
  annualAvg?: number
  annualRank?: number
  /** When annual summary is shown, drives the PASSED/FAILED header badge. */
  passed?: boolean
  /** Bold the active term column (e.g. term 3 bulletin). */
  highlightTerm?: 1 | 2 | 3
  /** Header alignment; annual/term cards use left, legacy Pison uses center. */
  headerAlign?: 'left' | 'center'
  /** Show term grid + annual summary + pass/fail header. Default: true when annual data is provided. */
  showAnnualSummary?: boolean
}

function formatAverage(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) return '-'
  return value.toFixed(1)
}

function formatAnnualAverage(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) return '-'
  return value.toFixed(2)
}

function formatRank(value: number | undefined): string {
  if (value == null || value <= 0) return '-'
  return String(value)
}

function averagePassed(value: number | undefined): boolean | null {
  if (value == null || Number.isNaN(value)) return null
  return value >= 10
}

function averageColorClass(value: number | undefined): string {
  const passed = averagePassed(value)
  if (passed === null) return ''
  return passed ? 'text-green-700' : 'text-red-600'
}

function averageColorStyle(value: number | undefined): CSSProperties | undefined {
  const passed = averagePassed(value)
  if (passed === null) return undefined
  return { color: passed ? '#15803d' : '#dc2626' }
}

function termCellClass(highlightTerm: 1 | 2 | 3 | undefined, term: 1 | 2 | 3): string {
  const base = 'p-0.5 print:p-0.5 border-r border-gray-300 text-center'
  if (highlightTerm === term) return `${base} font-bold`
  return base
}

function termCellClassLast(highlightTerm: 1 | 2 | 3 | undefined, term: 3): string {
  const base = 'p-0.5 print:p-0.5 text-center'
  if (highlightTerm === term) return `${base} font-bold`
  return base
}

function annualTermCellClass(highlightTerm: 1 | 2 | 3 | undefined, term: 1 | 2 | 3): string {
  const base = 'px-0.5 py-1 print:px-0.5 print:py-0.5 border-r border-gray-300 text-center'
  if (highlightTerm === term) return `${base} font-bold`
  return base
}

function annualTermCellClassLast(highlightTerm: 1 | 2 | 3 | undefined, term: 3): string {
  const base = 'px-0.5 py-1 print:px-0.5 print:py-0.5 text-center'
  if (highlightTerm === term) return `${base} font-bold`
  return base
}

function annualLabelCellClass(): string {
  return 'px-0.5 py-1 print:px-0.5 print:py-0.5 font-bold border-r border-gray-300 text-left pl-1'
}

function LegacyEvaluationTable({
  term1,
  term2,
  term3,
  rank1,
  rank2,
  rank3,
  highlightTerm,
  headerAlign,
}: StudentEvaluationResultsProps) {
  const thAlign = headerAlign === 'center' ? 'text-center' : 'text-left'

  return (
    <>
      <div className="bg-gray-100 p-0.5 print:p-0.5 text-left text-[0.55rem] print:text-[6pt] font-bold uppercase border-b border-black">
        Student&apos;s Evaluation Results
      </div>
      <table className="w-full text-[0.6rem] print:text-[7pt]">
        <thead>
          <tr className="border-b border-gray-300">
            <th className={`p-0.5 print:p-0.5 border-r border-gray-300 ${thAlign}`}>TERM</th>
            <th className={`p-0.5 print:p-0.5 border-r border-gray-300 ${thAlign}`}>1</th>
            <th className={`p-0.5 print:p-0.5 border-r border-gray-300 ${thAlign}`}>2</th>
            <th className={`p-0.5 print:p-0.5 ${thAlign}`}>3</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-300 font-mono">
            <td className="p-0.5 print:p-0.5 font-bold border-r border-gray-300 text-left pl-1">
              AVERAGE
            </td>
            <td
              className={`${termCellClass(highlightTerm, 1)} ${averageColorClass(term1)}`}
              style={averageColorStyle(term1)}
            >
              {formatAverage(term1)}
            </td>
            <td
              className={`${termCellClass(highlightTerm, 2)} ${averageColorClass(term2)}`}
              style={averageColorStyle(term2)}
            >
              {formatAverage(term2)}
            </td>
            <td
              className={`${termCellClassLast(highlightTerm, 3)} ${averageColorClass(term3)}`}
              style={averageColorStyle(term3)}
            >
              {formatAverage(term3)}
            </td>
          </tr>
          <tr className="font-mono">
            <td className="p-0.5 print:p-0.5 font-bold border-r border-gray-300 text-left pl-1">
              RANK
            </td>
            <td className={termCellClass(highlightTerm, 1)}>{formatRank(rank1)}</td>
            <td className={termCellClass(highlightTerm, 2)}>{formatRank(rank2)}</td>
            <td className={termCellClassLast(highlightTerm, 3)}>{formatRank(rank3)}</td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

export function StudentEvaluationResultsTable(props: StudentEvaluationResultsProps) {
  const {
    term1,
    term2,
    term3,
    rank1,
    rank2,
    rank3,
    annualAvg,
    annualRank,
    passed,
    highlightTerm,
    showAnnualSummary,
  } = props

  const useAnnualSummary =
    showAnnualSummary ??
    (annualAvg != null || annualRank != null || passed != null)

  if (!useAnnualSummary) {
    return (
      <div className="border border-black bg-white/90">
        <LegacyEvaluationTable {...props} />
      </div>
    )
  }

  const isPassed = passed ?? (annualAvg != null && annualAvg >= 10)

  return (
    <div className="border border-black bg-white/90 h-full min-h-[4.5rem] print:min-h-[4.25rem] flex flex-col">
      <div className="grid grid-cols-[3fr_1fr] border-b border-black">
        <div className="bg-gray-100 p-0.5 print:p-0.5 text-left text-[0.55rem] print:text-[6pt] font-bold uppercase">
          Student&apos;s Evaluation Results
        </div>
        <div
          className={`p-0.5 print:p-0.5 text-center text-[0.55rem] print:text-[6pt] font-bold uppercase ${
            isPassed ? 'text-green-700' : 'text-red-600'
          }`}
          style={{ backgroundColor: isPassed ? '#dcfce7' : '#fee2e2' }}
        >
          {isPassed ? 'PASSED' : 'FAILED'}
        </div>
      </div>
      <table className="w-full text-[0.6rem] print:text-[7pt] flex-1">
        <tbody>
          <tr className="border-b border-gray-300">
            <td className={annualLabelCellClass()}>
              TERM
            </td>
            <td className={annualTermCellClass(highlightTerm, 1)}>1</td>
            <td className={annualTermCellClass(highlightTerm, 2)}>2</td>
            <td className={`${annualTermCellClass(highlightTerm, 3)} border-r border-gray-300`}>3</td>
            <td rowSpan={2} className="px-0.5 py-1 print:px-0.5 print:py-0.5 align-middle border-gray-300 w-[28%]">
              <div className="flex items-center justify-between gap-1 px-0.5">
                <span className="flex flex-col leading-none text-[0.5rem] print:text-[6pt] font-bold uppercase">
                  <span>Annual</span>
                  <span>Avg</span>
                </span>
                <span
                  className={`text-xl print:text-lg font-black font-mono shrink-0 ${averageColorClass(annualAvg)}`}
                  style={averageColorStyle(annualAvg)}
                >
                  {formatAnnualAverage(annualAvg)}
                </span>
              </div>
            </td>
          </tr>
          <tr className="border-b border-gray-300 font-mono">
            <td className={annualLabelCellClass()}>
              AVERAGE
            </td>
            <td
              className={`${annualTermCellClass(highlightTerm, 1)} ${averageColorClass(term1)}`}
              style={averageColorStyle(term1)}
            >
              {formatAverage(term1)}
            </td>
            <td
              className={`${annualTermCellClass(highlightTerm, 2)} ${averageColorClass(term2)}`}
              style={averageColorStyle(term2)}
            >
              {formatAverage(term2)}
            </td>
            <td
              className={`${annualTermCellClass(highlightTerm, 3)} border-r border-gray-300 ${averageColorClass(term3)}`}
              style={averageColorStyle(term3)}
            >
              {formatAverage(term3)}
            </td>
          </tr>
          <tr className="font-mono">
            <td className={annualLabelCellClass()}>
              RANK
            </td>
            <td className={annualTermCellClass(highlightTerm, 1)}>{formatRank(rank1)}</td>
            <td className={annualTermCellClass(highlightTerm, 2)}>{formatRank(rank2)}</td>
            <td className={`${annualTermCellClass(highlightTerm, 3)} border-r border-gray-300`}>
              {formatRank(rank3)}
            </td>
            <td className="px-0.5 py-1 print:px-0.5 print:py-0.5 align-middle">
              <div className="flex items-center justify-between gap-1 px-0.5">
                <span className="text-[0.5rem] print:text-[6pt] font-bold uppercase">Rank</span>
                <span className="text-xl print:text-lg font-black">{formatRank(annualRank)}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
