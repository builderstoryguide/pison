import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sequenceConfigMatchesSaved } from './sequence-config-save-state'
import type { SequenceConfigurationResponse } from '@/hooks/use-sequence-configuration'

const baseCounts = { 'Term 1': 2, 'Term 2': 2, 'Term 3': 2 } as const

function makeLoaded(
  overrides: Partial<SequenceConfigurationResponse> = {}
): SequenceConfigurationResponse {
  return {
    success: true,
    configuration: {
      id: 'cfg-1',
      academic_year: '2025-2026',
      use_fixed_sequences: true,
      default_max_marks: 20,
      total_sequences: 6,
      created_at: '',
      updated_at: '',
    },
    totalSequences: 6,
    termSequenceCounts: { ...baseCounts },
    sequences: [],
    academicYear: '2025-2026',
    ...overrides,
  }
}

describe('sequenceConfigMatchesSaved', () => {
  it('returns false when configuration row is missing (no false positive on max marks)', () => {
    const loaded = makeLoaded({ configuration: null })
    const matches = sequenceConfigMatchesSaved(loaded, 6, { ...baseCounts }, 25)
    assert.equal(matches, false)
  })

  it('returns false when default_max_marks differs from saved', () => {
    const loaded = makeLoaded()
    const matches = sequenceConfigMatchesSaved(loaded, 6, { ...baseCounts }, 25)
    assert.equal(matches, false)
  })

  it('returns true when persisted config matches UI state', () => {
    const loaded = makeLoaded()
    const matches = sequenceConfigMatchesSaved(loaded, 6, { ...baseCounts }, 20)
    assert.equal(matches, true)
  })
})
