import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolveSequenceYearConfig, hasPersistedTermCounts } from './resolve-sequence-year-config'

describe('resolveSequenceYearConfig', () => {
  it('prefers saved term_sequence_counts over stale academic_sequences', () => {
    const config = {
      total_sequences: 5,
      term_sequence_counts: { 'Term 1': 2, 'Term 2': 2, 'Term 3': 1 },
    }
    const sequences = [
      { term: 'Term 1', sequence_number: 1, is_active: true },
      { term: 'Term 1', sequence_number: 2, is_active: true },
      { term: 'Term 2', sequence_number: 3, is_active: true },
      { term: 'Term 2', sequence_number: 4, is_active: true },
      { term: 'Term 3', sequence_number: 5, is_active: true },
      { term: 'Term 3', sequence_number: 6, is_active: true },
    ]

    const result = resolveSequenceYearConfig(config, sequences)
    assert.equal(result.totalSequences, 5)
    assert.deepEqual(result.termSequenceCounts, {
      'Term 1': 2,
      'Term 2': 2,
      'Term 3': 1,
    })
  })

  it('derives from sequences when config has no term_sequence_counts', () => {
    const config = { total_sequences: 6, term_sequence_counts: null }
    const sequences = [
      { term: 'Term 1', sequence_number: 1, is_active: true },
      { term: 'Term 1', sequence_number: 2, is_active: true },
      { term: 'Term 2', sequence_number: 3, is_active: true },
      { term: 'Term 2', sequence_number: 4, is_active: true },
      { term: 'Term 3', sequence_number: 5, is_active: true },
      { term: 'Term 3', sequence_number: 6, is_active: true },
    ]

    const result = resolveSequenceYearConfig(config, sequences)
    assert.equal(result.totalSequences, 6)
    assert.deepEqual(result.termSequenceCounts, {
      'Term 1': 2,
      'Term 2': 2,
      'Term 3': 2,
    })
  })

  it('returns defaults when config and sequences are empty', () => {
    const result = resolveSequenceYearConfig(null, [])
    assert.equal(result.totalSequences, 6)
    assert.deepEqual(result.termSequenceCounts, {
      'Term 1': 2,
      'Term 2': 2,
      'Term 3': 2,
    })
  })

  it('hasPersistedTermCounts is false for null counts', () => {
    assert.equal(hasPersistedTermCounts({ term_sequence_counts: null }), false)
    assert.equal(
      hasPersistedTermCounts({
        term_sequence_counts: { 'Term 1': 1, 'Term 2': 1, 'Term 3': 1 },
      }),
      true
    )
  })
})
