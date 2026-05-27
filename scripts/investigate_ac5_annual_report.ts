/**
 * AC 5 annual report card investigation.
 * Run: npx tsx scripts/investigate_ac5_annual_report.ts
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { subjectMap, classGroups } from '../lib/class-curriculum'
import {
  DEFAULT_TERM_COUNTS,
  getTermAveragesFromSequenceMarks,
  isAnnualCoefEligible,
  type TermSequenceCounts,
} from '../lib/sequence-term-mapping'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const CLASS_NAME = 'AC 5'
const SAMPLE_STUDENT_SEARCH = 'IHIMBRU'
const AC5_GROUP = classGroups.find((g) => g.dbSearchName === CLASS_NAME)

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim())
}

function extractSeqFromTitle(title: string): number | null {
  if (!title) return null
  const wordMatch = title.match(/(First|Second|Third|Fourth|Fifth|Sixth)\s+[Ss]eq/i)
  if (wordMatch) {
    const m: Record<string, number> = {
      first: 1,
      second: 2,
      third: 3,
      fourth: 4,
      fifth: 5,
      sixth: 6,
    }
    return m[wordMatch[1].toLowerCase()] ?? null
  }
  const m1 = title.match(/(\d+)(?:st|nd|rd|th)?\s*[Ss]eq/i) || title.match(/[Ss]eq\s*(\d+)/i)
  if (m1) return parseInt(m1[1], 10)
  return null
}

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function resolveGlobalSeq(
  title: string,
  seqIdMap: Map<string, { sequence_number: number; term: string }>
): number | null {
  if (isUuid(title) && seqIdMap.has(title)) {
    return seqIdMap.get(title)!.sequence_number
  }
  return extractSeqFromTitle(title)
}

async function main() {
  const report: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    className: CLASS_NAME,
  }

  // Step 1: App config + sequence config
  const { data: appCfg } = await supabase
    .from('app_configuration')
    .select('academic_year')
    .maybeSingle()
  const academicYear = appCfg?.academic_year || '2024-2025'
  report.academicYear = academicYear

  const { data: seqConfigRow } = await supabase
    .from('sequence_configurations')
    .select('total_sequences, term_sequence_counts')
    .eq('academic_year', academicYear)
    .maybeSingle()

  let termCounts: TermSequenceCounts = { ...DEFAULT_TERM_COUNTS }
  let totalSequences = 6
  if (seqConfigRow) {
    totalSequences = seqConfigRow.total_sequences ?? 6
    const raw = seqConfigRow.term_sequence_counts as Partial<Record<string, number>> | null
    if (raw) {
      termCounts = {
        'Term 1': raw['Term 1'] ?? 2,
        'Term 2': raw['Term 2'] ?? 2,
        'Term 3': raw['Term 3'] ?? 2,
      }
    }
  }
  report.sequenceConfig = { totalSequences, termCounts }

  const { data: academicSequences } = await supabase
    .from('academic_sequences')
    .select('id, sequence_number, sequence_name, term, academic_year, is_active')
    .eq('academic_year', academicYear)

  const seqIdMap = new Map<string, { sequence_number: number; term: string }>()
  for (const s of academicSequences || []) {
    if (s.is_active !== false) {
      seqIdMap.set(s.id, { sequence_number: s.sequence_number, term: s.term })
    }
  }
  report.academicSequencesCount = seqIdMap.size

  // Step 1: AC 5 class
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, class_name')
    .ilike('name', CLASS_NAME)

  if (!classes?.length) {
    console.error(`Class "${CLASS_NAME}" not found`)
    process.exit(1)
  }
  const classId = classes[0].id
  report.classId = classId
  report.classRecord = classes[0]

  // Step 1: Sample student
  // Students may store class UUID in `class` (not class_id)
  const { data: students } = await supabase
    .from('students')
    .select('id, student_id, first_name, middle_name, last_name, class, class_id')
    .or(`class_id.eq.${classId},class.eq.${classId},class.ilike.%${CLASS_NAME}%`)

  const allStudents = students || []
  const sampleStudent =
    allStudents.find((s) => {
      const full = [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ')
      return normalizeName(full).includes('ihimbru') && normalizeName(full).includes('miracle')
    }) ||
    allStudents.find((s) => {
      const full = [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ')
      return normalizeName(full).includes('ihimbru')
    }) ||
    allStudents[0]

  if (!sampleStudent) {
    console.error('No AC 5 students found')
    process.exit(1)
  }

  const sampleName = [sampleStudent.first_name, sampleStudent.middle_name, sampleStudent.last_name]
    .filter(Boolean)
    .join(' ')
  report.sampleStudent = {
    id: sampleStudent.id,
    studentId: sampleStudent.student_id,
    name: sampleName,
  }

  const classmates = allStudents
    .filter((s) => s.id !== sampleStudent.id)
    .slice(0, 3)
    .map((s) => ({
      id: s.id,
      name: [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' '),
    }))
  report.classmates = classmates
  report.totalStudentsInClass = allStudents.length

  // Step 2: class_subjects + coefficients
  const { data: classSubjects } = await supabase
    .from('class_subjects')
    .select(`
      subject_id,
      subjects!inner (
        id,
        name,
        code,
        coefficient,
        is_active
      )
    `)
    .eq('class_id', classId)

  const expectedShortNames = AC5_GROUP?.subjects ?? []
  const expectedDbNames = expectedShortNames.map((s) => subjectMap[s] || s)

  const subjectRows = (classSubjects || []).map((cs) => {
    const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects
    return {
      id: subj?.id,
      name: subj?.name,
      code: subj?.code,
      coefficient: subj?.coefficient,
      isActive: subj?.is_active,
    }
  })

  const mappedNames = subjectRows.map((s) => normalizeName(s.name || ''))
  const missingFromClass = expectedDbNames.filter(
    (exp) => !mappedNames.some((m) => m === normalizeName(exp) || m.includes(normalizeName(exp).slice(0, 8)))
  )
  const zeroCoef = subjectRows.filter((s) => !s.coefficient || Number(s.coefficient) <= 0)

  report.classSubjectsAudit = {
    count: subjectRows.length,
    expectedCount: expectedDbNames.length,
    subjects: subjectRows,
    missingFromClass,
    zeroOrNullCoefficients: zeroCoef,
  }

  // Step 3: Assessment coverage for AC 5 (class-wide)
  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, title, subject, class_id')
    .eq('class_id', classId)

  const assessmentBySubjectSeq = new Map<string, Set<number>>()
  for (const a of assessments || []) {
    const seq = resolveGlobalSeq(a.title, seqIdMap)
    const key = normalizeName(a.subject || '')
    if (!assessmentBySubjectSeq.has(key)) assessmentBySubjectSeq.set(key, new Set())
    if (seq !== null) assessmentBySubjectSeq.get(key)!.add(seq)
    else assessmentBySubjectSeq.get(key)!.add(-1) // unmapped title
  }

  report.assessmentCoverage = {
    totalAssessments: assessments?.length ?? 0,
    bySubject: Object.fromEntries(
      [...assessmentBySubjectSeq.entries()].map(([k, v]) => [k, [...v].sort((a, b) => a - b)])
    ),
  }

  // Build marks matrix for students
  async function buildStudentMatrix(studentDbId: string, studentLabel: string) {
    const { data: grades } = await supabase
      .from('grades')
      .select(`
        marks_obtained,
        assessment:assessments (
          title,
          subject,
          class_id
        )
      `)
      .eq('student_id', studentDbId)

    const classGrades = (grades || []).filter((g) => {
      const a = g.assessment as { class_id?: string; subject?: string; title?: string } | null
      return a?.class_id === classId
    })

    const bySubject: Record<
      string,
      {
        seqMarks: Record<string, number | undefined>
        termAvgs: ReturnType<typeof getTermAveragesFromSequenceMarks>
        annualCoefEligible: boolean
        dbCoef: number | null
      }
    > = {}

    for (const row of subjectRows) {
      const subjName = row.name || ''
      const normSubj = normalizeName(subjName)
      const seqMarks: Record<string, number | undefined> = {}

      for (const g of classGrades) {
        const a = g.assessment as { subject?: string; title?: string } | null
        if (!a?.subject) continue
        const assessNorm = normalizeName(a.subject)
        if (assessNorm !== normSubj && !assessNorm.includes(normSubj.slice(0, 10)) && !normSubj.includes(assessNorm.slice(0, 10))) {
          continue
        }
        const seq = resolveGlobalSeq(a.title || '', seqIdMap)
        if (seq !== null && seq >= 1 && seq <= totalSequences) {
          const key = `seq${seq}`
          if (seqMarks[key] === undefined) seqMarks[key] = g.marks_obtained
          else {
            const prev = seqMarks[key]!
            seqMarks[key] = parseFloat(((prev + g.marks_obtained) / 2).toFixed(2))
          }
        }
      }

      const termAvgs = getTermAveragesFromSequenceMarks(seqMarks, termCounts)
      const annualCoefEligible = isAnnualCoefEligible(seqMarks, termCounts)

      bySubject[subjName] = {
        seqMarks,
        termAvgs,
        annualCoefEligible,
        dbCoef: row.coefficient != null ? Number(row.coefficient) : null,
      }
    }

    // Compute history like server
    let histT1 = 0
    let histT2 = 0
    let histT3 = 0
    let t1Coef = 0
    let t2Coef = 0
    let t3Coef = 0

    for (const [, data] of Object.entries(bySubject)) {
      const c = data.dbCoef && data.dbCoef > 0 ? data.dbCoef : 1
      if (data.annualCoefEligible) {
        if (typeof data.termAvgs.term1 === 'number') {
          histT1 += data.termAvgs.term1 * c
          t1Coef += c
        }
        if (typeof data.termAvgs.term2 === 'number') {
          histT2 += data.termAvgs.term2 * c
          t2Coef += c
        }
        if (typeof data.termAvgs.term3 === 'number') {
          histT3 += data.termAvgs.term3 * c
          t3Coef += c
        }
      }
    }

    // Per-term history (proposed fix simulation)
    let perTermHist1 = 0
    let perTermHist1Coef = 0
    for (const [, data] of Object.entries(bySubject)) {
      const c = data.dbCoef && data.dbCoef > 0 ? data.dbCoef : 1
      if (typeof data.termAvgs.term1 === 'number') {
        perTermHist1 += data.termAvgs.term1 * c
        perTermHist1Coef += c
      }
    }

    return {
      studentLabel,
      subjectCount: Object.keys(bySubject).length,
      subjectsWithTerm1: Object.values(bySubject).filter((s) => typeof s.termAvgs.term1 === 'number').length,
      subjectsWithTerm2: Object.values(bySubject).filter((s) => typeof s.termAvgs.term2 === 'number').length,
      subjectsWithTerm3: Object.values(bySubject).filter((s) => typeof s.termAvgs.term3 === 'number').length,
      subjectsAnnualCoefEligible: Object.values(bySubject).filter((s) => s.annualCoefEligible).length,
      computedHistoryStrict: {
        term1: t1Coef > 0 ? parseFloat((histT1 / t1Coef).toFixed(2)) : 0,
        term2: t2Coef > 0 ? parseFloat((histT2 / t2Coef).toFixed(2)) : 0,
        term3: t3Coef > 0 ? parseFloat((histT3 / t3Coef).toFixed(2)) : 0,
      },
      computedHistoryPerTerm1Only: {
        term1: perTermHist1Coef > 0 ? parseFloat((perTermHist1 / perTermHist1Coef).toFixed(2)) : 0,
      },
      matrix: bySubject,
    }
  }

  report.sampleStudentMatrix = await buildStudentMatrix(sampleStudent.id, sampleName)
  report.classmateMatrices = []
  for (const cm of classmates) {
    report.classmateMatrices.push(await buildStudentMatrix(cm.id, cm.name))
  }

  // Term-level grade counts across class
  const termGradeCounts = { term1: 0, term2: 0, term3: 0, unmapped: 0 }
  for (const a of assessments || []) {
    const seq = resolveGlobalSeq(a.title, seqIdMap)
    if (seq === null) {
      termGradeCounts.unmapped++
      continue
    }
    if (seq <= termCounts['Term 1']) termGradeCounts.term1++
    else if (seq <= termCounts['Term 1'] + termCounts['Term 2']) termGradeCounts.term2++
    else termGradeCounts.term3++
  }
  report.assessmentCountsByTerm = termGradeCounts

  // Write output
  const outDir = path.resolve(__dirname, 'output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'investigate-ac5-annual-report.json')
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))

  // Console summary
  console.log('\n=== AC 5 Annual Report Investigation ===\n')
  console.log(`Academic year: ${academicYear}`)
  console.log(`Class: ${CLASS_NAME} (${classId})`)
  console.log(`Sequence config: ${totalSequences} seq, Term counts:`, termCounts)
  console.log(`Sample student: ${sampleName} (${sampleStudent.id})`)
  console.log(`Students in class: ${allStudents.length}`)
  console.log(`\nClass subjects: ${subjectRows.length} (expected ${expectedDbNames.length})`)
  if (missingFromClass.length) console.log(`  Missing: ${missingFromClass.join(', ')}`)
  if (zeroCoef.length) console.log(`  Zero/null coef: ${zeroCoef.map((s) => s.name).join(', ')}`)
  else console.log(`  All subjects have nominal coefficients in DB`)

  console.log(`\nAssessments in AC 5: ${assessments?.length ?? 0}`)
  console.log(`  By term slot: T1=${termGradeCounts.term1}, T2=${termGradeCounts.term2}, T3=${termGradeCounts.term3}, unmapped=${termGradeCounts.unmapped}`)

  const sm = report.sampleStudentMatrix as {
    subjectsWithTerm1: number
    subjectsWithTerm2: number
    subjectsWithTerm3: number
    subjectsAnnualCoefEligible: number
    computedHistoryStrict: { term1: number; term2: number; term3: number }
    computedHistoryPerTerm1Only: { term1: number }
  }
  console.log(`\nSample student marks coverage:`)
  console.log(`  Subjects with Term 1 avg: ${sm.subjectsWithTerm1}`)
  console.log(`  Subjects with Term 2 avg: ${sm.subjectsWithTerm2}`)
  console.log(`  Subjects with Term 3 avg: ${sm.subjectsWithTerm3}`)
  console.log(`  Subjects passing isAnnualCoefEligible: ${sm.subjectsAnnualCoefEligible}`)
  console.log(`  Strict history (current server logic): T1=${sm.computedHistoryStrict.term1}, T2=${sm.computedHistoryStrict.term2}, T3=${sm.computedHistoryStrict.term3}`)
  console.log(`  Per-term history (Term 1 only, proposed): T1=${sm.computedHistoryPerTerm1Only.term1}`)

  console.log(`\nFull report: ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
