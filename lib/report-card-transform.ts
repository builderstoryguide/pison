import type { SubjectGrade } from '@/components/admin/reports/report-card-types'

/** Categories aligned with student-report section grouping and subject_groupings. */
export const REPORT_CARD_CATEGORIES = [
  'general',
  'languages',
  'trade_subjects',
  'related_trade_subjects',
  'others',
] as const

export type ReportCardCategory = (typeof REPORT_CARD_CATEGORIES)[number]

export interface PisonReportSubjectItem {
  name: string
  subjectId?: string
  code?: string
  eval?: number | string
  coef?: number | string
  plannedCoef?: number
  total?: number | string
  grade?: string
  rank?: number | string
  remark?: string
  category?: string
  hasMark?: boolean
  coefEligible?: boolean
  seq1?: number
  seq2?: number
  seq3?: number
  seq4?: number
  seq5?: number
  seq6?: number
  term1?: number
  term2?: number
  term3?: number
  annualAverage?: number
}

export interface PisonSubjectSectionInput {
  items?: PisonReportSubjectItem[]
}

export function normalizeReportCategory(raw: string | undefined): ReportCardCategory {
  const key = (raw ?? 'others').toLowerCase().trim()
  if ((REPORT_CARD_CATEGORIES as readonly string[]).includes(key)) {
    return key as ReportCardCategory
  }
  return 'others'
}

function readSeq(item: PisonReportSubjectItem, n: 1 | 2 | 3 | 4 | 5 | 6): number | undefined {
  const key = `seq${n}` as keyof PisonReportSubjectItem
  const v = item[key]
  return typeof v === 'number' ? v : undefined
}

/**
 * Maps a student-report subject row into SubjectGrade with safe coefficient typing.
 */
export function normalizeReportItem(item: PisonReportSubjectItem): SubjectGrade {
  const hasMark =
    item.hasMark === true ||
    (item.hasMark !== false && typeof item.eval === 'number' && !Number.isNaN(item.eval))

  const coefEligible =
    item.coefEligible === true ||
    (item.coefEligible !== false &&
      typeof item.coef === 'number' &&
      !Number.isNaN(item.coef) &&
      item.coef > 0)

  const coefficient =
    typeof item.coef === 'number' && !Number.isNaN(item.coef) && item.coef > 0 ? item.coef : 0

  const plannedCoefficient =
    typeof item.plannedCoef === 'number' && item.plannedCoef > 0 ? item.plannedCoef : undefined

  const rawCode = item.code
  const code =
    typeof rawCode === 'string' && rawCode.trim().length > 0 ? rawCode.trim() : undefined

  const evalNum = typeof item.eval === 'number' ? item.eval : undefined
  const rank = typeof item.rank === 'number' ? item.rank : undefined

  return {
    subjectName: item.name,
    subjectId: item.subjectId,
    code,
    coefficient,
    plannedCoefficient,
    hasMark,
    coefEligible,
    category: normalizeReportCategory(item.category),
    seq1: readSeq(item, 1),
    seq2: readSeq(item, 2),
    seq3: readSeq(item, 3),
    seq4: readSeq(item, 4),
    seq5: readSeq(item, 5),
    seq6: readSeq(item, 6),
    sequences: {
      seq1: readSeq(item, 1),
      seq2: readSeq(item, 2),
      seq3: readSeq(item, 3),
      seq4: readSeq(item, 4),
      seq5: readSeq(item, 5),
      seq6: readSeq(item, 6),
    },
    termAverage: evalNum,
    annualAverage:
      typeof item.annualAverage === 'number' && !Number.isNaN(item.annualAverage)
        ? item.annualAverage
        : evalNum,
    term1: typeof item.term1 === 'number' ? item.term1 : undefined,
    term2: typeof item.term2 === 'number' ? item.term2 : undefined,
    term3: typeof item.term3 === 'number' ? item.term3 : undefined,
    termAverages: {
      term1: typeof item.term1 === 'number' ? item.term1 : undefined,
      term2: typeof item.term2 === 'number' ? item.term2 : undefined,
      term3: typeof item.term3 === 'number' ? item.term3 : undefined,
    },
    grade: typeof item.grade === 'string' ? item.grade : undefined,
    rank,
    remarks: typeof item.remark === 'string' ? item.remark : undefined,
  }
}

/** Flatten grouped Pison report sections into a single subject list. */
export function flattenPisonSubjects(
  sections: Record<string, PisonSubjectSectionInput | undefined>
): SubjectGrade[] {
  const items: PisonReportSubjectItem[] = []
  for (const section of Object.values(sections)) {
    if (section?.items && Array.isArray(section.items)) {
      items.push(
        ...section.items.filter((item) => item.remark !== 'Excluded for class')
      )
    }
  }
  return items.map(normalizeReportItem)
}
