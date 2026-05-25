/**
 * Resolve assessment titles to global sequence numbers (1–6) for report cards.
 */

export function isUuidString(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim())
}

export function extractGlobalSequenceNumber(title: string): number | null {
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
    return wordToNum[word] ?? null
  }

  const patterns = [
    /(\d+)(?:st|nd|rd|th)?\s*[Ss]eq(?:uence)?/i,
    /[Ss]eq(?:uence)?\s*(\d+)/i,
    /[Ss]équence\s*(\d+)/i,
    /(\d+)(?:st|nd|rd|th)?\s*[Ee]val(?:uation)?/i,
    /^seq(\d+)$/i,
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

/** Global sequence 1–6 from title text or academic_sequences UUID / name map */
export function resolveGlobalSequenceFromTitle(
  title: string | null | undefined,
  sequenceIdToNumberMap: Map<string, number>
): number | null {
  if (!title) return null
  const t = title.trim()

  if (isUuidString(t) && sequenceIdToNumberMap.has(t)) {
    const n = sequenceIdToNumberMap.get(t)
    if (n !== undefined && n >= 1 && n <= 6) return n
  }

  const lower = t.toLowerCase()
  if (sequenceIdToNumberMap.has(lower)) {
    const n = sequenceIdToNumberMap.get(lower)!
    if (n >= 1 && n <= 6) return n
  }

  return extractGlobalSequenceNumber(t)
}

export function getTermNumber(termStr: string): 1 | 2 | 3 {
  const lower = termStr.toLowerCase()
  if (lower.includes('first') || lower.includes('1st') || lower === '1') return 1
  if (lower.includes('second') || lower.includes('2nd') || lower === '2') return 2
  if (lower.includes('third') || lower.includes('3rd') || lower === '3') return 3
  return 1
}

export type AcademicReportTermMode =
  | { mode: 'per_term'; term: 1 | 2 | 3 }
  | { mode: 'annual' }

export function parseAcademicTermMode(academicTermId: string): AcademicReportTermMode {
  const lower = academicTermId.toLowerCase()
  if (lower === 'annual' || lower.includes('annual')) {
    return { mode: 'annual' }
  }
  return { mode: 'per_term', term: getTermNumber(academicTermId) as 1 | 2 | 3 }
}
