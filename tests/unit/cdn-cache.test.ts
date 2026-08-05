import { describe, it, expect } from 'vitest'
import {
  CACHE_TAG_PREFIX,
  cdnTagForPath,
  isCacheableResponse,
  isHtmlNavigationRequest,
} from '../../src/lib/cdn-cache'

describe('isHtmlNavigationRequest', () => {
  it('accepts plain GET navigations', () => {
    expect(isHtmlNavigationRequest(new Request('https://podvarchan.com/ru/'))).toBe(true)
    expect(isHtmlNavigationRequest(new Request('https://podvarchan.com/ru/tseny/'))).toBe(true)
    expect(isHtmlNavigationRequest(new Request('https://podvarchan.com/sitemap.xml'))).toBe(true)
  })

  it('rejects non-GET methods', () => {
    expect(
      isHtmlNavigationRequest(new Request('https://podvarchan.com/api/contact', { method: 'POST' })),
    ).toBe(false)
    expect(isHtmlNavigationRequest(new Request('https://podvarchan.com/ru/', { method: 'HEAD' }))).toBe(
      false,
    )
  })

  it('never caches /api/* and /_next/* paths', () => {
    expect(isHtmlNavigationRequest(new Request('https://podvarchan.com/api/preview/'))).toBe(false)
    expect(
      isHtmlNavigationRequest(new Request('https://podvarchan.com/_next/static/abc.css')),
    ).toBe(false)
  })

  it('rejects RSC and router-prefetch requests', () => {
    const rsc = new Request('https://podvarchan.com/ru/', { headers: { rsc: '1' } })
    expect(isHtmlNavigationRequest(rsc)).toBe(false)
    const prefetch = new Request('https://podvarchan.com/ru/', {
      headers: { 'next-router-prefetch': '1' },
    })
    expect(isHtmlNavigationRequest(prefetch)).toBe(false)
    const stateTree = new Request('https://podvarchan.com/ru/', {
      headers: { 'next-router-state-tree': '%5B%22%22%5D' },
    })
    expect(isHtmlNavigationRequest(stateTree)).toBe(false)
  })
})

describe('isCacheableResponse', () => {
  it('accepts 2xx with an explicit s-maxage opt-in', () => {
    const r = new Response('ok', {
      status: 200,
      headers: { 'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
    expect(isCacheableResponse(r)).toBe(true)
  })

  it('rejects responses without an s-maxage opt-in', () => {
    const noStore = new Response('ok', {
      headers: { 'cache-control': 'no-cache, no-store, must-revalidate' },
    })
    expect(isCacheableResponse(noStore)).toBe(false)
    const maxAgeOnly = new Response('ok', { headers: { 'cache-control': 'public, max-age=60' } })
    expect(isCacheableResponse(maxAgeOnly)).toBe(false)
    expect(isCacheableResponse(new Response('ok'))).toBe(false)
  })

  it('rejects non-2xx statuses even with s-maxage', () => {
    const notFound = new Response('nf', {
      status: 404,
      headers: { 'cache-control': 'public, s-maxage=3600' },
    })
    expect(isCacheableResponse(notFound)).toBe(false)
    const redirect = new Response('redir', {
      status: 301,
      headers: { 'cache-control': 'public, s-maxage=3600' },
    })
    expect(isCacheableResponse(redirect)).toBe(false)
    const error = new Response('err', {
      status: 500,
      headers: { 'cache-control': 'public, s-maxage=3600' },
    })
    expect(isCacheableResponse(error)).toBe(false)
  })
})

describe('cdnTagForPath', () => {
  it('normalizes paths to the OpenNext tag format', () => {
    expect(cdnTagForPath('/ru/')).toBe(`${CACHE_TAG_PREFIX}/ru/`)
    expect(cdnTagForPath('ru/')).toBe(`${CACHE_TAG_PREFIX}/ru/`)
    expect(cdnTagForPath('/sitemap.xml')).toBe(`${CACHE_TAG_PREFIX}/sitemap.xml`)
  })
})
