# Report Card Marks Pipeline

## Overview

Marks flow from Supabase storage through server aggregation (`student-report`) into the admin report card UI and PDF.

## Storage

| Table | Purpose |
|-------|---------|
| `assessments` | One row per class + subject + sequence (`title` = canonical name e.g. "First Sequence") |
| `grades` | Student mark per assessment |
| `branch_assessments` / `branch_grades` | Branched subjects (e.g. CPB) |
| `class_subjects` | Subjects and coefficients on a class bulletin |
| `academic_sequences` | Sequence metadata; UUID may appear in legacy `title` values |

## Canonical assessment key

`(class_id, subject name, sequence global number)` → single assessment with `title` from `getSequenceName(n)` in [`lib/report-card-utils.ts`](../lib/report-card-utils.ts).

Normalize legacy data:

```bash
npm run normalize:assessments        # dry-run
npm run normalize:assessments:apply  # apply title fixes, subject_id backfill, merge duplicates
```

## Term mapping

- School layout: `sequence_configurations` + [`lib/sequence-term-mapping.ts`](../lib/sequence-term-mapping.ts)
- Default 6 sequences: Term1 = seq1–2, Term2 = seq3–4, Term3 = seq5–6
- Title → global sequence: [`lib/report-card-assessment-resolution.ts`](../lib/report-card-assessment-resolution.ts)

## Report generation

1. `GET /api/report-cards/[studentId]?term=1|2|3|annual`
2. [`lib/report-cards/load-report-card-data.ts`](../lib/report-cards/load-report-card-data.ts) → `GET /api/admin/reports/student-report`
3. [`lib/report-card-transform.ts`](../lib/report-card-transform.ts) flattens grouped subjects

### Branch subjects

Branched subjects average marks across branches for the term, then fill sequence columns for that term’s slots with the term average (see [`lib/report-card-subject-marks.ts`](../lib/report-card-subject-marks.ts)).

## Auditing

```bash
npx tsx scripts/verify-sequence-config.ts
npx tsx scripts/audit-report-card-marks.ts
```

Output: `scripts/output/audit-report-card-marks.json` and `.csv`.

## Debugging

Set `DEBUG_REPORT_CARD=1` for verbose server logs in `student-report`.

## Warnings

`student-report` returns `reportWarnings[]` for non-fatal issues (missing assessments, orphan subjects). The report card UI can surface these to admins.
