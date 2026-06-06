import { describe, it, expect } from 'vitest'
import { ok, okVoid, fail, isOk, isFail, unwrap } from './result'
import type { ActionResult } from './result'

describe('ok()', () => {
  it('creates a success result with data', () => {
    const result = ok({ id: '1', name: 'Test' })
    expect(result).toEqual({ success: true, data: { id: '1', name: 'Test' } })
  })

  it('creates a success result with data and message', () => {
    const result = ok('saved', 'Created successfully')
    expect(result).toEqual({ success: true, data: 'saved', message: 'Created successfully' })
  })

  it('works with primitive values', () => {
    const result = ok(42)
    expect(result).toEqual({ success: true, data: 42 })
  })

  it('works with null data', () => {
    const result = ok(null)
    expect(result).toEqual({ success: true, data: null })
  })
})

describe('okVoid()', () => {
  it('creates a success result with undefined data', () => {
    const result = okVoid()
    expect(result).toEqual({ success: true, data: undefined })
  })

  it('creates a success result with a message', () => {
    const result = okVoid('Deleted')
    expect(result).toEqual({ success: true, data: undefined, message: 'Deleted' })
  })
})

describe('fail()', () => {
  it('creates a failure result with error message', () => {
    const result = fail('Something went wrong')
    expect(result).toEqual({ success: false, error: 'Something went wrong' })
  })

  it('creates a failure result with field errors', () => {
    const result = fail('Validation failed', {
      title: ['Title is required'],
      slug: ['Slug must be unique'],
    })
    expect(result).toEqual({
      success: false,
      error: 'Validation failed',
      fieldErrors: {
        title: ['Title is required'],
        slug: ['Slug must be unique'],
      },
    })
  })

  it('creates a failure result with empty field errors', () => {
    const result = fail('Error', {})
    expect(result).toEqual({ success: false, error: 'Error', fieldErrors: {} })
  })
})

describe('isOk()', () => {
  it('returns true for success results', () => {
    expect(isOk(ok('data'))).toBe(true)
    expect(isOk(okVoid())).toBe(true)
  })

  it('returns false for failure results', () => {
    expect(isOk(fail('error'))).toBe(false)
  })

  it('works as type guard', () => {
    const result: ActionResult<number> = ok(42)
    if (isOk(result)) {
      expect(result.data).toBe(42)
    }
  })
})

describe('isFail()', () => {
  it('returns true for failure results', () => {
    expect(isFail(fail('error'))).toBe(true)
  })

  it('returns false for success results', () => {
    expect(isFail(ok('data'))).toBe(false)
    expect(isFail(okVoid())).toBe(false)
  })

  it('works as type guard', () => {
    const result: ActionResult<never> = fail('Something went wrong')
    if (isFail(result)) {
      expect(result.error).toBe('Something went wrong')
    }
  })
})

describe('unwrap()', () => {
  it('returns data from a success result', () => {
    expect(unwrap(ok('hello'))).toBe('hello')
  })

  it('returns complex data from a success result', () => {
    expect(unwrap(ok({ a: 1, b: 2 }))).toEqual({ a: 1, b: 2 })
  })

  it('throws an error for failure results', () => {
    expect(() => unwrap(fail('Error message'))).toThrow('Error message')
  })

  it('works with void data', () => {
    expect(unwrap(okVoid())).toBeUndefined()
  })
})
