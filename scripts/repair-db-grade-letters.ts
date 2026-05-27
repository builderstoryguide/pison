/**
 * Repair grades.grade_letter and remarks to match canonical scale.
 * Run: npx tsx scripts/repair-db-grade-letters.ts           (dry-run)
 *      npx tsx scripts/repair-db-grade-letters.ts --apply
 */
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import {
  calculateGradeFromMarks,
  getGradeRemarks,
} from '../lib/grading-utils'

dotenv.config({ path: '.env.local' })

const apply = process.argv.includes('--apply')

async function main() {
  const auditPath = path.resolve(
    __dirname,
    'output/audit-db-grade-letters.json'
  )
  if (!fs.existsSync(auditPath)) {
    console.error('Run audit first: npx tsx scripts/audit-db-grade-letters.ts')
    process.exit(1)
  }

  const { mismatches } = JSON.parse(fs.readFileSync(auditPath, 'utf8')) as {
    mismatches: {
      gradeId: string
      marksObtained: number
      totalMarks: number
      storedLetter: string
      expectedLetter: string
    }[]
  }

  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Rows to repair: ${mismatches.length}`)

  if (!apply) {
    console.log('Pass --apply to update the database.')
    return
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing env vars')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  let updated = 0
  let failed = 0

  const batchSize = 50
  for (let i = 0; i < mismatches.length; i += batchSize) {
    const batch = mismatches.slice(i, i + batchSize)
    await Promise.all(
      batch.map(async (m) => {
        const gradeLetter = calculateGradeFromMarks(
          m.marksObtained,
          m.totalMarks
        )
        const remarks = getGradeRemarks(gradeLetter)
        const { error } = await supabase
          .from('grades')
          .update({ grade_letter: gradeLetter, remarks })
          .eq('id', m.gradeId)
        if (error) {
          failed++
          console.error(`Failed ${m.gradeId}:`, error.message)
        } else {
          updated++
        }
      })
    )
  }

  console.log(`Updated: ${updated}, failed: ${failed}`)
}

main()
