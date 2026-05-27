/**
 * @deprecated Use scripts/fix_missing_term_marks.ts --bc-only
 * Backfill missing BC sequence marks (seq 2–5).
 *
 * Run (dry-run): npx tsx scripts/fix_bc_missing_term_marks.ts
 * Run (apply):    npx tsx scripts/fix_bc_missing_term_marks.ts --apply
 */
import { spawnSync } from 'child_process'
import path from 'path'

const args = process.argv.slice(2)
if (!args.includes('--bc-only')) args.unshift('--bc-only')

const script = path.join(__dirname, 'fix_missing_term_marks.ts')
const result = spawnSync('npx', ['tsx', script, ...args], {
  stdio: 'inherit',
  shell: true,
})
process.exit(result.status ?? 1)
