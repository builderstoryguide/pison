/**
 * Sample each class (first student with grades) and summarize how assessments
 * resolve to a term from title / academic_sequences UUID map.
 *
 * Run: npx tsx scripts/verify_term2_report_consistency.ts
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

function extractGlobalSequenceNumber(title: string): number | null {
  if (!title) return null
  const wordBasedPattern = /(First|Second|Third|Fourth|Fifth|Sixth)\s+[Ss]eq(?:uence)?/i
  const wordMatch = title.match(wordBasedPattern)
  if (wordMatch) {
    const word = wordMatch[1].toLowerCase()
    const wordToNum: Record<string, number> = {
      first: 1,
      second: 2,
      third: 3,
      fourth: 4,
      fifth: 5,
      sixth: 6,
    }
    return wordToNum[word] || null
  }
  const patterns = [
    /(\d+)(?:st|nd|rd|th)?\s*[Ss]eq(?:uence)?/i,
    /[Ss]eq(?:uence)?\s*(\d+)/i,
    /[Ss]équence\s*(\d+)/i,
    /(\d+)(?:st|nd|rd|th)?\s*[Ee]val(?:uation)?/i,
  ]
  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num >= 1 && num <= 6) return num
    }
  }
  return null
}

function isUuidString(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim())
}

function globalSequenceToTerm(globalSeq: number): 1 | 2 | 3 | null {
  if (globalSeq >= 1 && globalSeq <= 2) return 1
  if (globalSeq >= 3 && globalSeq <= 4) return 2
  if (globalSeq >= 5 && globalSeq <= 6) return 3
  return null
}

function resolveGlobalSeq(
  title: string,
  map: Map<string, number>
): number | null {
  const t = title.trim()
  if (!t) return null

  if (isUuidString(t) && map.has(t)) {
    const n = map.get(t)!
    if (n >= 1 && n <= 6) return n
    return null
  }

  const lower = t.toLowerCase()
  if (map.has(lower)) {
    const n = map.get(lower)!
    if (n >= 1 && n <= 6) return n
    return null
  }

  return extractGlobalSequenceNumber(t)
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  const { data: cfg } = await supabase
    .from('app_configuration')
    .select('academic_year')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const academicYear =
    cfg?.academic_year ||
    process.env.NEXT_PUBLIC_ACADEMIC_YEAR ||
    '2024-2025'

  const { data: academicSequences } = await supabase
    .from('academic_sequences')
    .select('id, sequence_number, sequence_name')
    .eq('academic_year', academicYear)

  const sequenceIdToNumberMap = new Map<string, number>()
  for (const seq of academicSequences || []) {
    sequenceIdToNumberMap.set(seq.id, seq.sequence_number)
    if (seq.sequence_name) {
      sequenceIdToNumberMap.set(seq.sequence_name.toLowerCase(), seq.sequence_number)
    }
  }

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, class_name')
    .limit(50)

  let classesChecked = 0
  let gradesAnalyzed = 0
  let unknownTermStrict = 0
  const sampleUnknown: string[] = []

  for (const c of classes || []) {
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('class', c.id)
      .limit(1)

    const studentId = students?.[0]?.id
    if (!studentId) continue

    const { data: grades } = await supabase
      .from('grades')
      .select(
        `
        marks_obtained,
        assessment:assessments!inner ( subject, title, class_id )
      `
      )
      .eq('student_id', studentId)
      .eq('assessment.class_id', c.id)

    if (!grades?.length) continue

    classesChecked++
    for (const row of grades) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const a = (row as any).assessment
      const title = (a?.title as string) || ''
      const g = resolveGlobalSeq(title, sequenceIdToNumberMap)
      const term = g !== null ? globalSequenceToTerm(g) : null
      gradesAnalyzed++
      if (term === null) {
        unknownTermStrict++
        if (sampleUnknown.length < 15) {
          sampleUnknown.push(
            `[${c.class_name || c.name}] ${a?.subject}: title="${title.slice(0, 48)}${title.length > 48 ? '…' : ''}"`
          )
        }
      }
    }
  }

  console.log('--- Second-term report data check (sample) ---')
  console.log(`Academic year: ${academicYear}`)
  console.log(`Classes with at least one graded student: ${classesChecked}`)
  console.log(`Grades analyzed: ${gradesAnalyzed}`)
  console.log(
    `Grades with no resolvable term (strict; excluded from per-term reports except Office Practice exception): ${unknownTermStrict}`
  )
  if (sampleUnknown.length) {
    console.log('\nSample ambiguous titles:')
    sampleUnknown.forEach((line) => console.log(' ', line))
  }
  console.log(
    '\nNote: After the student-report fix, term averages use only the two global sequences for that term (e.g. seq3–4 for term 2).'
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
