import { describe, expect, it } from 'vitest'
import { cloudflarePurgeSucceeded } from './revalidation-status'

describe('cloudflarePurgeSucceeded', () => {
  it('requires HTTP success and success true', () => {
    expect(cloudflarePurgeSucceeded(true, { success: true })).toBe(true)
    expect(cloudflarePurgeSucceeded(false, { success: true })).toBe(false)
    expect(cloudflarePurgeSucceeded(true, { success: false })).toBe(false)
  })
  it('rejects malformed bodies', () => {
    expect(cloudflarePurgeSucceeded(true, null)).toBe(false)
    expect(cloudflarePurgeSucceeded(true, 'success')).toBe(false)
  })
})
