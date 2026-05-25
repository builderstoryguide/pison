/**
 * Verify sequence_configurations aligns with academic_sequences and term mapping.
 *
 * Run: npx tsx scripts/verify-sequence-config.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { loadSequenceYearConfig } from '../lib/load-sequence-config-server'
import { validateSequenceConfig } from '../lib/sequence-term-mapping'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing env vars')
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
    cfg?.academic_year || process.env.NEXT_PUBLIC_ACADEMIC_YEAR || '2024-2025'

  const seqConfig = await loadSequenceYearConfig(supabase, academicYear)
  const validation = validateSequenceConfig(
    seqConfig.totalSequences,
    seqConfig.termSequenceCounts
  )

  const { data: sequences } = await supabase
    .from('academic_sequences')
    .select('id, sequence_number, sequence_name, term, is_active')
    .eq('academic_year', academicYear)

  const active = (sequences || []).filter((s) => s.is_active !== false)
  const maxSeq = active.reduce((m, s) => Math.max(m, s.sequence_number), 0)

  console.log('--- Sequence configuration check ---')
  console.log(`Academic year: ${academicYear}`)
  console.log(`Config: ${seqConfig.totalSequences} sequences`, seqConfig.termSequenceCounts)
  console.log(`Validation: ${validation.valid ? 'OK' : validation.error}`)
  console.log(`Active academic_sequences rows: ${active.length}, max sequence_number: ${maxSeq}`)

  if (maxSeq > seqConfig.totalSequences) {
    console.error(
      `MISMATCH: DB has sequence_number up to ${maxSeq} but config expects ${seqConfig.totalSequences}`
    )
    process.exit(1)
  }

  if (!validation.valid) {
    process.exit(1)
  }

  console.log('Sequence config is consistent.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
