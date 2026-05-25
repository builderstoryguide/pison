/**
 * Normalize assessment titles to canonical sequence names and backfill subject_id.
 *
 * Run (dry-run): npx tsx scripts/normalize-assessments.ts
 * Run (apply):    npx tsx scripts/normalize-assessments.ts --apply
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { getSequenceName } from '../lib/report-card-utils'
import {
  extractGlobalSequenceNumber,
  isUuidString,
} from '../lib/report-card-assessment-resolution'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const APPLY = process.argv.includes('--apply')

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

  const { data: sequences } = await supabase
    .from('academic_sequences')
    .select('id, sequence_number')
    .eq('academic_year', academicYear)

  const uuidToSeq = new Map<string, number>()
  for (const s of sequences || []) {
    uuidToSeq.set(s.id, s.sequence_number)
  }

  const { data: subjects } = await supabase.from('subjects').select('id, name')
  const subjectNameToId = new Map<string, string>()
  for (const s of subjects || []) {
    if (s.name) subjectNameToId.set(s.name.trim().toLowerCase(), s.id)
  }

  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('id, title, subject, subject_id, class_id')
    .limit(5000)

  if (error) {
    console.error(error)
    process.exit(1)
  }

  let titleUpdates = 0
  let subjectIdUpdates = 0
  const mergeGroups = new Map<string, { canonicalId: string; duplicateIds: string[] }>()

  for (const a of assessments || []) {
    const title = (a.title || '').trim()
    let seqNum: number | null = null

    if (isUuidString(title) && uuidToSeq.has(title)) {
      seqNum = uuidToSeq.get(title)!
    } else {
      seqNum = extractGlobalSequenceNumber(title)
    }

    const canonicalTitle = seqNum ? getSequenceName(seqNum) : title

    if (canonicalTitle !== title && seqNum) {
      console.log(`[title] ${a.id}: "${title}" -> "${canonicalTitle}"`)
      titleUpdates++
      if (APPLY) {
        await supabase.from('assessments').update({ title: canonicalTitle }).eq('id', a.id)
      }
    }

    const subjectKey = (a.subject || '').trim().toLowerCase()
    const subjectId = subjectNameToId.get(subjectKey)
    if (subjectId && !a.subject_id) {
      subjectIdUpdates++
      if (APPLY) {
        await supabase.from('assessments').update({ subject_id: subjectId }).eq('id', a.id)
      }
    }

    if (seqNum && a.class_id && a.subject) {
      const groupKey = `${a.class_id}|${subjectKey}|${seqNum}`
      const existing = mergeGroups.get(groupKey)
      if (!existing) {
        mergeGroups.set(groupKey, { canonicalId: a.id, duplicateIds: [] })
      } else if (existing.canonicalId !== a.id) {
        existing.duplicateIds.push(a.id)
      }
    }
  }

  let merges = 0
  for (const [, group] of mergeGroups) {
    if (group.duplicateIds.length === 0) continue
    merges += group.duplicateIds.length
    console.log(
      `[merge] canonical ${group.canonicalId}, duplicates: ${group.duplicateIds.join(', ')}`
    )
    if (APPLY) {
      for (const dupId of group.duplicateIds) {
        await supabase
          .from('grades')
          .update({ assessment_id: group.canonicalId })
          .eq('assessment_id', dupId)
        await supabase.from('assessments').delete().eq('id', dupId)
      }
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Title updates: ${titleUpdates}`)
  console.log(`subject_id backfills: ${subjectIdUpdates}`)
  console.log(`Duplicate assessments to merge: ${merges}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
