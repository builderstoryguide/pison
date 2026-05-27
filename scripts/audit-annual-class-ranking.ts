/**
 * Audit annual cohort ranking across all canonical class groups (AC, BC, HEC, EPS).
 * Flags duplicate rank-1 students with different display averages.
 * Run: npx tsx scripts/audit-annual-class-ranking.ts
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { classGroups } from '../lib/class-curriculum'
import {
  DEFAULT_TERM_COUNTS,
  type TermSequenceCounts,
} from '../lib/sequence-term-mapping'
import { getTermFromAssessment } from '../lib/report-card-assessment-resolution'
import { isSubjectExcludedForClass } from '../lib/report-card-subject-matching'
import {
  buildCohortRankingMetrics,
  rankCohortByMetrics,
  type StudentGradeRow,
  type StudentBranchGradeRow,
} from '../lib/report-card-class-ranking'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface ClassAuditResult {
  userClassName: string
  dbSearchName: string
  classId?: string
  classLabel?: string
  status: 'ok' | 'not_found' | 'no_students' | 'error'
  studentCount: number
  rankedCount: number
  rank1Count: number
  duplicateRank1WithDifferentAvg: boolean
  rank1Students: Array<{ name: string; displayAvg: number }>
  error?: string
}

function studentName(s: {
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
}): string {
  return [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ')
}

async function auditClass(
  group: (typeof classGroups)[number],
  academicYear: string,
  termCounts: TermSequenceCounts,
  totalSequences: 5 | 6,
  sequenceIdToNumberMap: Map<string, number>
): Promise<ClassAuditResult> {
  const base: ClassAuditResult = {
    userClassName: group.userClassName,
    dbSearchName: group.dbSearchName,
    status: 'ok',
    studentCount: 0,
    rankedCount: 0,
    rank1Count: 0,
    duplicateRank1WithDifferentAvg: false,
    rank1Students: [],
  }

  try {
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name, class_name')
      .or(`name.ilike.%${group.dbSearchName}%,class_name.ilike.%${group.dbSearchName}%`)
      .limit(5)

    if (!classes?.length) {
      return { ...base, status: 'not_found' }
    }

    const classRow = classes[0]
    const classId = classRow.id
    const classLabel = String(classRow.class_name || classRow.name || group.dbSearchName)
    base.classId = classId
    base.classLabel = classLabel

    const classKeys = Array.from(
      new Set(
        [classId, classRow.name, classRow.class_name]
          .filter((v): v is string => Boolean(v && String(v).trim()))
          .map((v) => String(v).trim())
      )
    )

    const studentBuckets: Array<{ id: string }[]> = []
    for (const key of classKeys) {
      const { data } = await supabase.from('students').select('id').eq('class', key)
      studentBuckets.push(data || [])
    }
    const studentIds = [...new Map(studentBuckets.flat().map((s) => [s.id, s])).keys()]
    if (studentIds.length === 0) {
      return { ...base, status: 'no_students' }
    }

    const { data: students } = await supabase
      .from('students')
      .select('id, first_name, middle_name, last_name')
      .in('id', studentIds)

    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select(`
        subject_id,
        subjects!inner ( id, name, coefficient, has_sub_branches, is_active )
      `)
      .eq('class_id', classId)

    const subjects = (classSubjects || [])
      .map((cs) => {
        const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects
        return subj as { id: string; name: string; coefficient: number; has_sub_branches?: boolean }
      })
      .filter((s) => s?.id && !isSubjectExcludedForClass(classLabel, s.name))

    const subjectIds = subjects.map((s) => s.id)
    const { data: subBranches } = subjectIds.length
      ? await supabase
          .from('subject_sub_branches')
          .select('id, subject_id')
          .in('subject_id', subjectIds)
      : { data: [] }
    const { data: subjectBranchesNew } = subjectIds.length
      ? await supabase
          .from('subject_branches')
          .select('id, subject_id')
          .in('subject_id', subjectIds)
      : { data: [] }

    const branchIdsBySubjectId = new Map<string, string[]>()
    const rankingSubjects = subjects.map((subject) => {
      const branchesOld = (subBranches || []).filter((b) => b.subject_id === subject.id)
      const branchesNew = (subjectBranchesNew || []).filter((b) => b.subject_id === subject.id)
      const branchIds = [...branchesOld.map((b) => b.id), ...branchesNew.map((b) => b.id)]
      if (branchIds.length) branchIdsBySubjectId.set(subject.id, branchIds)
      return {
        id: subject.id,
        name: subject.name,
        coefficient: subject.coefficient || 1,
        hasSubBranches:
          Boolean(subject.has_sub_branches) ||
          branchesOld.length > 0 ||
          branchesNew.length > 0,
      }
    })

    const { data: allGrades } = await supabase
      .from('grades')
      .select(`
        marks_obtained,
        student_id,
        assessment:assessments!inner ( subject, title, class_id )
      `)
      .in('student_id', studentIds)
      .eq('assessment.class_id', classId)

    const { data: allBranchGrades } = await supabase
      .from('branch_grades')
      .select(`
        marks_obtained,
        student_id,
        branch_id,
        assessment:branch_assessments!inner ( title, term, class_id )
      `)
      .in('student_id', studentIds)
      .eq('assessment.class_id', classId)

    const gradesByStudentId = new Map<string, StudentGradeRow[]>()
    for (const g of allGrades || []) {
      const sid = g.student_id as string
      const a = g.assessment as { subject?: string; title?: string }
      if (!gradesByStudentId.has(sid)) gradesByStudentId.set(sid, [])
      gradesByStudentId.get(sid)!.push({
        marks_obtained: g.marks_obtained as number,
        title: a?.title || '',
        subject: a?.subject || '',
        term: null,
      })
    }

    const branchGradesByStudentId = new Map<string, StudentBranchGradeRow[]>()
    for (const bg of allBranchGrades || []) {
      const sid = bg.student_id as string
      const a = bg.assessment as { title?: string; term?: string }
      if (!branchGradesByStudentId.has(sid)) branchGradesByStudentId.set(sid, [])
      branchGradesByStudentId.get(sid)!.push({
        marks_obtained: bg.marks_obtained as number,
        branch_id: bg.branch_id as string,
        title: a?.title || '',
        term: a?.term ?? null,
      })
    }

    const gradeIncluded = () => true
    const gradeBelongsToTerm = (
      term: 1 | 2 | 3,
      assessmentTerm: string | null | undefined,
      assessmentTitle: string | null | undefined
    ): boolean => {
      const resolved = getTermFromAssessment(
        assessmentTitle ?? null,
        assessmentTerm ?? null,
        sequenceIdToNumberMap,
        termCounts
      )
      if (resolved !== null) return resolved === term
      if (assessmentTerm) {
        const normalizedDb = assessmentTerm.toLowerCase()
        if (term === 1 && (normalizedDb.includes('1st') || normalizedDb.includes('first')))
          return true
        if (term === 2 && (normalizedDb.includes('2nd') || normalizedDb.includes('second')))
          return true
        if (term === 3 && (normalizedDb.includes('3rd') || normalizedDb.includes('third')))
          return true
      }
      return false
    }

    const cohortMetrics = buildCohortRankingMetrics({
      studentIds,
      subjects: rankingSubjects,
      gradesByStudentId,
      branchGradesByStudentId,
      branchIdsBySubjectId,
      scope: 'annual',
      yearSummary: true,
      activeTerm: null,
      sequenceIdToNumberMap,
      termSequenceCounts: termCounts,
      totalSequences,
      gradeIncluded,
      gradeBelongsToTerm: (
        term,
        assessmentTerm,
        assessmentTitle,
        _assessmentSubject
      ) => gradeBelongsToTerm(term, assessmentTerm, assessmentTitle),
      includeAllTermsGrades: true,
      academicTermId: 'annual',
    })

    const rankMap = rankCohortByMetrics(cohortMetrics)
    const rows = (students || []).map((s) => {
      const cohort = cohortMetrics.get(s.id)
      return {
        id: s.id,
        name: studentName(s),
        displayAvg: cohort?.weightedAvg ?? 0,
        rank: rankMap.get(s.id) ?? 0,
        hasMarks: cohort?.hasMarks ?? false,
      }
    })

    const ranked = rows.filter((r) => r.hasMarks)
    const rank1Students = ranked.filter((r) => r.rank === 1)
    const duplicateRank1 =
      rank1Students.length > 1 &&
      rank1Students.some((a, i) =>
        rank1Students.slice(i + 1).some((b) => Math.abs(a.displayAvg - b.displayAvg) > 0.001)
      )

    return {
      ...base,
      studentCount: rows.length,
      rankedCount: ranked.length,
      rank1Count: rank1Students.length,
      duplicateRank1WithDifferentAvg: duplicateRank1,
      rank1Students: rank1Students.map((r) => ({
        name: r.name,
        displayAvg: r.displayAvg,
      })),
    }
  } catch (err) {
    return {
      ...base,
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function main() {
  const { data: appCfg } = await supabase
    .from('app_configuration')
    .select('academic_year')
    .maybeSingle()
  const academicYear = appCfg?.academic_year || '2024-2025'

  const { data: seqConfigRow } = await supabase
    .from('sequence_configurations')
    .select('total_sequences, term_sequence_counts')
    .eq('academic_year', academicYear)
    .maybeSingle()

  let termCounts: TermSequenceCounts = { ...DEFAULT_TERM_COUNTS }
  let totalSequences: 5 | 6 = 6
  if (seqConfigRow) {
    totalSequences = (seqConfigRow.total_sequences ?? 6) as 5 | 6
    const raw = seqConfigRow.term_sequence_counts as Partial<Record<string, number>> | null
    if (raw) {
      termCounts = {
        'Term 1': raw['Term 1'] ?? 2,
        'Term 2': raw['Term 2'] ?? 2,
        'Term 3': raw['Term 3'] ?? 2,
      }
    }
  }

  const { data: academicSequences } = await supabase
    .from('academic_sequences')
    .select('id, sequence_number, is_active')
    .eq('academic_year', academicYear)

  const sequenceIdToNumberMap = new Map<string, number>()
  for (const s of academicSequences || []) {
    if (s.is_active !== false) {
      sequenceIdToNumberMap.set(s.id, s.sequence_number)
    }
  }

  const results: ClassAuditResult[] = []
  for (const group of classGroups) {
    const result = await auditClass(
      group,
      academicYear,
      termCounts,
      totalSequences,
      sequenceIdToNumberMap
    )
    results.push(result)
    const flag = result.duplicateRank1WithDifferentAvg ? ' *** DUPLICATE RANK 1 ***' : ''
    console.log(
      `${group.userClassName} (${group.dbSearchName}): ${result.status} ranked=${result.rankedCount} rank1=${result.rank1Count}${flag}`
    )
  }

  const report = {
    generatedAt: new Date().toISOString(),
    academicYear,
    classCount: results.length,
    duplicateRank1Classes: results.filter((r) => r.duplicateRank1WithDifferentAvg),
    notFound: results.filter((r) => r.status === 'not_found'),
    errors: results.filter((r) => r.status === 'error'),
    classes: results,
  }

  const outDir = path.resolve(__dirname, 'output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'audit-annual-class-ranking.json')
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))

  console.log('\nSummary')
  console.log(
    `Duplicate rank-1 with different avg: ${report.duplicateRank1Classes.length} class(es)`
  )
  console.log(`Written: ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
