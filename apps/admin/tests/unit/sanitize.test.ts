import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '../../src/lib/sanitize'

describe('sanitizeHtml', () => {
  it('removes script tags entirely', () => {
    expect(sanitizeHtml('<p>hi</p><script>alert(1)</script>')).toBe('<p>hi</p>')
  })

  it('removes inline event handlers', () => {
    const input = '<a href="/ru/" onclick="alert(1)">link</a>'
    expect(sanitizeHtml(input)).toBe('<a href="/ru/">link</a>')
  })

  it('strips javascript: URLs from href', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>')
    expect(sanitizeHtml('<a href="JaVaScRiPt:alert(1)">x</a>')).toBe('<a>x</a>')
  })

  it('strips data: URLs from img src', () => {
    expect(sanitizeHtml('<img src="data:text/html;base64,PHNjcmlwdD4=">')).toBe('<img>')
  })

  it('removes iframe, style, object, embed', () => {
    const input = '<iframe src="https://evil.example"></iframe><style>*{x:y}</style><object data="x"></object><embed src="y">'
    expect(sanitizeHtml(input)).toBe('')
  })

  it('removes HTML comments (SSI injection vector)', () => {
    expect(sanitizeHtml('<p>a</p><!--#exec cmd="evil"--><p>b</p>')).toBe('<p>a</p><p>b</p>')
  })

  it('preserves safe rich-text structure', () => {
    const input = '<h2>Title</h2><ul><li><strong>bold</strong></li></ul><blockquote><p>quote</p></blockquote><pre><code>x</code></pre>'
    expect(sanitizeHtml(input)).toBe(
      '<h2>Title</h2><ul><li><strong>bold</strong></li></ul><blockquote><p>quote</p></blockquote><pre><code>x</code></pre>',
    )
  })

  it('keeps safe attributes and drops others', () => {
    expect(sanitizeHtml('<p style="color:red" data-x="1">t</p>')).toBe('<p>t</p>')
    expect(sanitizeHtml('<img src="/media/img.webp" alt="pic" width="1200">')).toBe(
      '<img src="/media/img.webp" alt="pic" width="1200">',
    )
  })

  it('keeps https/mailto/tel links', () => {
    expect(sanitizeHtml('<a href="https://podvarchan.com">s</a><a href="mailto:a@b.c">m</a><a href="tel:+380">t</a>')).toBe(
      '<a href="https://podvarchan.com">s</a><a href="mailto:a@b.c">m</a><a href="tel:+380">t</a>',
    )
  })

  it('handles stray angle brackets and entities in text', () => {
    expect(sanitizeHtml('<p>1 &lt; 2</p>')).toBe('<p>1 &lt; 2</p>')
    expect(sanitizeHtml('<p>1 < 2</p>')).toBe('<p>1 &lt; 2</p&gt;')
  })

  it('handles empty input', () => {
    expect(sanitizeHtml('')).toBe('')
    expect(sanitizeHtml(null as unknown as string)).toBe('')
  })
})