/**
 * Spot-check: sample active students per class and summarize grade coverage by term.
 *
 * Run: npx tsx scripts/spot-check-report-cards.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { loadSequenceYearConfig } from '../lib/load-sequence-config-server'
import { resolveGlobalSequenceFromTitle, parseAcademicTermMode } from '../lib/report-card-assessment-resolution'
import { globalToTerm } from '../lib/sequence-term-mapping'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const TERMS = ['first', 'second', 'third'] as const

async function resolveClassId(
  supabase: ReturnType<typeof createClient>,
  studentClass: string
): Promise<{ id: string; name: string } | null> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentClass)
  if (isUUID) {
    const { data } = await supabase.from('classes').select('id, class_name, name').eq('id', studentClass).maybeSingle()
    return data ? { id: data.id, name: data.class_name || data.name || data.id } : { id: studentClass, name: studentClass }
  }
  const { data: c } = await supabase
    .from('classes')
    .select('id, class_name, name')
    .or(`class_name.eq.${studentClass},name.eq.${studentClass}`)
    .maybeSingle()
  return c ? { id: c.id, name: c.class_name || c.name || c.id } : null
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing env')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const { data: cfg } = await supabase
    .from('app_configuration')
    .select('academic_year')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const academicYear = cfg?.academic_year || '2025-2026'
  const seqConfig = await loadSequenceYearConfig(supabase, academicYear)
  const { data: sequences } = await supabase
    .from('academic_sequences')
    .select('id, sequence_number, sequence_name')
    .eq('academic_year', academicYear)

  const map = new Map<string, number>()
  for (const s of sequences || []) {
    map.set(s.id, s.sequence_number)
    if (s.sequence_name) map.set(s.sequence_name.toLowerCase(), s.sequence_number)
  }

  const { data: classes } = await supabase.from('classes').select('id, class_name, name').order('class_name')
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, class')
    .eq('status', 'active')

  console.log(`Spot check — ${academicYear}, ${seqConfig.totalSequences} sequences\n`)

  for (const cls of classes || []) {
    const inClass = []
    for (const st of students || []) {
      const resolved = await resolveClassId(supabase, st.class || '')
      if (resolved?.id === cls.id) inClass.push(st)
    }
    if (inClass.length === 0) continue

    const sample = inClass[0]
    const { data: grades } = await supabase
      .from('grades')
      .select('marks_obtained, assessment:assessments!inner(subject, title)')
      .eq('student_id', sample.id)
      .eq('assessment.class_id', cls.id)

    const byTerm: Record<string, number> = { first: 0, second: 0, third: 0, unmapped: 0 }
    for (const g of grades || []) {
      const title = (g as { assessment?: { title?: string } }).assessment?.title || ''
      const globalSeq = resolveGlobalSequenceFromTitle(title, map)
      if (globalSeq === null) {
        byTerm.unmapped++
        continue
      }
      const t = globalToTerm(globalSeq, seqConfig.termSequenceCounts)
      if (t?.termNumber === 1) byTerm.first++
      else if (t?.termNumber === 2) byTerm.second++
      else if (t?.termNumber === 3) byTerm.third++
    }

    const label = cls.class_name || cls.name
    console.log(
      `${label}: ${inClass.length} students | sample ${sample.first_name} ${sample.last_name} | grades T1=${byTerm.first} T2=${byTerm.second} T3=${byTerm.third} unmapped=${byTerm.unmapped}`
    )
  }

  console.log('\nOpen report cards in admin for the sample students above (terms 1–3 and annual).')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
