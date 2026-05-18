export type AcademicReportTermMode =
  | { mode: 'per_term'; term: 1 | 2 | 3 }
  | { mode: 'annual' }

/** Annual report, or third-term bulletin with full-year grades table. */
export function isYearSummaryReport(termMode: AcademicReportTermMode): boolean {
  return termMode.mode === 'annual' || (termMode.mode === 'per_term' && termMode.term === 3)
}

/** Third-term report with annual-style columns (not the separate annual selector). */
export function isThirdTermYearSummaryTable(termMode: AcademicReportTermMode): boolean {
  return termMode.mode === 'per_term' && termMode.term === 3
}
