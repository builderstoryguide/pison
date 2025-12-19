import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Helper functions for report card operations
 */

/**
 * Maps sequence number to sequence name
 * @param sequenceNumber - Sequence number (1, 2, 3, etc.)
 * @returns Sequence name (e.g., "First Sequence", "Second Sequence")
 */
export function getSequenceName(sequenceNumber: number): string {
  const SEQUENCE_NAMES: Record<number, string> = {
    1: 'First Sequence',
    2: 'Second Sequence',
    3: 'Third Sequence',
    4: 'Fourth Sequence',
    5: 'Fifth Sequence',
    6: 'Sixth Sequence',
  }
  return SEQUENCE_NAMES[sequenceNumber] || `Sequence ${sequenceNumber}`
}

/**
 * Maps sequence key (seq1, seq2, etc.) to sequence number
 * @param sequenceKey - Sequence key (seq1, seq2, etc.)
 * @returns Sequence number (1, 2, etc.)
 */
export function getSequenceNumberFromKey(sequenceKey: string): number | null {
  const match = sequenceKey.match(/^seq(\d+)$/i)
  if (match) {
    return parseInt(match[1], 10)
  }
  return null
}

/**
 * Checks if a subject has branches
 * @param supabase - Supabase client
 * @param subjectId - Subject ID
 * @returns True if subject has branches, false otherwise
 */
export async function isBranchSubject(
  supabase: SupabaseClient,
  subjectId: string
): Promise<boolean> {
  try {
    // Check both branch tables
    const [oldBranches, newBranches] = await Promise.all([
      supabase
        .from('subject_sub_branches')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .limit(1),
      supabase
        .from('subject_branches')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .limit(1),
    ])

    if (oldBranches.error || newBranches.error) {
      // console.error('Error checking branches:', oldBranches.error || newBranches.error)
      return false
    }

    const hasOldBranches = oldBranches.data && oldBranches.data.length > 0
    const hasNewBranches = newBranches.data && newBranches.data.length > 0

    return hasOldBranches || hasNewBranches  } catch (_error) {
    // console.error('Error checking if subject has branches:', error)
    return false
  }
}
