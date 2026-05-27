'use client'

export interface StudentEvaluationResultsProps {
  term1?: number
  term2?: number
  term3?: number
  rank1?: number
  rank2?: number
  rank3?: number
  /** Bold the active term column (e.g. term 3 bulletin). */
  highlightTerm?: 1 | 2 | 3
  /** Header alignment; annual/term cards use left, legacy Pison uses center. */
  headerAlign?: 'left' | 'center'
}

function formatAverage(value: number | undefined): string {
  if (value == null || value <= 0) return '-'
  return value.toFixed(1)
}

function formatRank(value: number | undefined): string {
  if (value == null || value <= 0) return '-'
  return String(value)
}

function termCellClass(highlightTerm: 1 | 2 | 3 | undefined, term: 1 | 2 | 3): string {
  const base = 'p-0.5 print:p-0.5 border-r border-gray-300'
  if (highlightTerm === term) return `${base} font-bold`
  return base
}

function termCellClassLast(highlightTerm: 1 | 2 | 3 | undefined, term: 3): string {
  if (highlightTerm === term) return 'p-0.5 print:p-0.5 font-bold'
  return 'p-0.5 print:p-0.5'
}

export function StudentEvaluationResultsTable({
  term1,
  term2,
  term3,
  rank1,
  rank2,
  rank3,
  highlightTerm,
  headerAlign = 'left',
}: StudentEvaluationResultsProps) {
  const thAlign = headerAlign === 'center' ? 'text-center' : 'text-left'

  return (
    <div className="border border-black bg-white/90">
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
            <td className={termCellClass(highlightTerm, 1)}>{formatAverage(term1)}</td>
            <td className={termCellClass(highlightTerm, 2)}>{formatAverage(term2)}</td>
            <td className={termCellClassLast(highlightTerm, 3)}>{formatAverage(term3)}</td>
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
    </div>
  )
}
