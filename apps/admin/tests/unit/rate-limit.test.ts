import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getClientIp, checkLoginRateLimit } from '../../src/lib/rateLimit'

describe('getClientIp', () => {
  it('prefers cf-connecting-ip (Cloudflare-authenticated) over forwarded headers', () => {
    const req = new Request('https://admin.podvarchan.com/admin')
    req.headers.set('cf-connecting-ip', '203.0.113.10')
    req.headers.set('x-forwarded-for', '198.51.100.1, 203.0.113.10')
    expect(getClientIp(req)).toBe('203.0.113.10')
  })

  it('falls back to first x-forwarded-for entry when no cf-connecting-ip', () => {
    const req = new Request('https://admin.podvarchan.com/admin')
    req.headers.set('x-forwarded-for', '198.51.100.1, 198.51.100.2')
    expect(getClientIp(req)).toBe('198.51.100.1')
  })

  it('falls back to x-real-ip', () => {
    const req = new Request('https://admin.podvarchan.com/admin')
    req.headers.set('x-real-ip', '192.0.2.7')
    expect(getClientIp(req)).toBe('192.0.2.7')
  })

  it('defaults to loopback when every header is missing', () => {
    const req = new Request('https://admin.podvarchan.com/admin')
    expect(getClientIp(req)).toBe('127.0.0.1')
  })
})

describe('checkLoginRateLimit (in-memory fallback)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows up to 5 failed attempts per window', async () => {
    const ip = '192.0.2.50'
    for (let i = 0; i < 5; i++) {
      await expect(checkLoginRateLimit(ip)).resolves.toBe(true)
    }
    await expect(checkLoginRateLimit(ip)).resolves.toBe(false)
  })

  it('tracks IPs independently', async () => {
    const ipA = '192.0.2.51'
    const ipB = '192.0.2.52'
    for (let i = 0; i < 5; i++) await checkLoginRateLimit(ipA)
    await expect(checkLoginRateLimit(ipA)).resolves.toBe(false)
    await expect(checkLoginRateLimit(ipB)).resolves.toBe(true)
  })

  it('resets the window after the 15-minute period', async () => {
    const ip = '192.0.2.53'
    for (let i = 0; i < 5; i++) await checkLoginRateLimit(ip)
    await expect(checkLoginRateLimit(ip)).resolves.toBe(false)

    vi.setSystemTime(new Date('2026-01-01T00:15:01Z'))
    await expect(checkLoginRateLimit(ip)).resolves.toBe(true)
  })
})
