/**
 * List assessments and grade counts for Accounting 1 (or name match) for
 * Office Practice and English-related subjects. Helps verify seq titles vs term 2.
 *
 * Run: npx tsx scripts/inspect_ac1_second_term_assessments.ts
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

/** Align with verify_term2_report_consistency / student-report: UUID + sequence_name keys, 1–6 validation on map values */
function resolveGlobalSeq(title: string, map: Map<string, number>): number | null {
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

  const { data: classRow } = await supabase
    .from('classes')
    .select('id, name, class_name')
    .or('class_name.ilike.%AC 1%,name.ilike.%AC 1%')
    .limit(1)
    .maybeSingle()

  if (!classRow) {
    console.error('No class matching "AC 1" (class_name or name). Adjust script filter if needed.')
    process.exit(1)
  }

  console.log('Class:', classRow)
  const classId = classRow.id

  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, title, subject')
    .eq('class_id', classId)

  const interesting = (assessments || []).filter((a) => {
    const s = (a.subject || '').toLowerCase()
    return (
      s.includes('office practice') ||
      s.includes('english') ||
      s.includes('language')
    )
  })

  console.log('\n--- Assessments (Office Practice / English / language) ---')
  for (const a of interesting) {
    const title = a.title || ''
    const g = resolveGlobalSeq(title, sequenceIdToNumberMap)
    const term = g !== null ? globalSequenceToTerm(g) : null

    const { count } = await supabase
      .from('grades')
      .select('*', { count: 'exact', head: true })
      .eq('assessment_id', a.id)

    console.log({
      subject: a.subject,
      title: title.slice(0, 60),
      globalSeq: g,
      inferredTerm: term,
      gradeCount: count ?? 0,
    })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
