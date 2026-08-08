import { describe, expect, it } from 'vitest'
import { serviceIndexPath, servicePath } from './locale-paths'

describe('service locale paths', () => {
  it('uses locale-specific segments', () => {
    expect(serviceIndexPath('ru')).toBe('/ru/uslugi/')
    expect(serviceIndexPath('uk')).toBe('/uk/poslugy/')
  })
  it('normalizes slug slashes', () => {
    expect(servicePath('ru', '/therapy/')).toBe('/ru/uslugi/therapy/')
    expect(servicePath('uk', '/therapy/')).toBe('/uk/poslugy/therapy/')
  })
})
