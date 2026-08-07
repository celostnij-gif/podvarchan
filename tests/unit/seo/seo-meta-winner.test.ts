import { describe, it, expect } from 'vitest'
import { pickSeoMetaWinner } from '@/lib/db/public'

describe('pickSeoMetaWinner', () => {
  it('returns null for an empty list', () => {
    expect(pickSeoMetaWinner([])).toBeNull()
  })

  it('returns the only row when there is a single one', () => {
    const row = { id: 'a', createdAt: '2026-07-21T12:00:00.000Z' }
    expect(pickSeoMetaWinner([row])).toEqual(row)
  })

  it('picks the oldest created_at among duplicate rows (determinism)', () => {
    const rows = [
      { id: 'junk-seed', createdAt: '2026-07-30T13:09:54.568Z' },
      { id: 'curated', createdAt: '2026-07-21T12:00:00.000Z' },
      { id: 'null-title', createdAt: '2026-07-24T09:49:04.576Z' },
    ]
    expect(pickSeoMetaWinner(rows)?.id).toBe('curated')
  })

  it('stays stable when created_at ties (first in order wins)', () => {
    const rows = [
      { id: 'first', createdAt: '2026-07-30T13:09:54.568Z' },
      { id: 'second', createdAt: '2026-07-30T13:09:54.568Z' },
    ]
    expect(pickSeoMetaWinner(rows)?.id).toBe('first')
  })
})
