/**
 * Lightweight HTML-to-Markdown converter optimized for Cloudflare Workers edge runtime.
 * No DOM API required — purely string-based transformation.
 */

/* ── Types ── */

export interface HtmlToMarkdownOptions {
  /** Character used for horizontal rules */
  hr?: string
  /** Character used for bullet lists */
  bulletMarker?: string
  /** Delimiter for inline code */
  codeDelimiter?: string
  /** Delimiter for code fences */
  fence?: string
}

/* ── Helpers ── */

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_m, n: string) => String.fromCharCode(Number(n)))
}

/* ── Main converter ── */

export function htmlToMarkdown(html: string, options: HtmlToMarkdownOptions = {}): string {
  const { hr: hrChar = '---', bulletMarker = '-', fence = '```' } = options

  let text = html

  // ── Strip unwanted elements with their content ──
  const stripBlocks = [
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    /<style\b[^>]*>[\s\S]*?<\/style>/gi,
    /<form\b[^>]*>[\s\S]*?<\/form>/gi,
    /<svg\b[^>]*>[\s\S]*?<\/svg>/gi,
    /<nav\b[^>]*>[\s\S]*?<\/nav>/gi,
  ]

  for (const pattern of stripBlocks) {
    text = text.replace(pattern, '')
  }

  // ── Preserve code blocks (fenced) ──
  // Save them as placeholders to avoid conversion
  const codeBlocks: string[] = []
  text = text.replace(/<pre><code\b[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_match: string, code: string) => {
    const preserved = `${fence}\n${decodeEntities(code.trim())}\n${fence}`
    codeBlocks.push(preserved)
    return `\x00CODE_BLOCK_${codeBlocks.length - 1}\x00`
  })

  // ── Inline code ──
  text = text.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_match: string, code: string) => {
    return `\`${decodeEntities(code)}\``
  })

  // ── Header tags ──
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, (_m: string, content: string) => {
    return `# ${processInline(content)}\n\n`
  })
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_m: string, content: string) => {
    return `## ${processInline(content)}\n\n`
  })
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, (_m: string, content: string) => {
    return `### ${processInline(content)}\n\n`
  })
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, (_m: string, content: string) => {
    return `#### ${processInline(content)}\n\n`
  })
  text = text.replace(/<h5[^>]*>(.*?)<\/h5>/gi, (_m: string, content: string) => {
    return `##### ${processInline(content)}\n\n`
  })
  text = text.replace(/<h6[^>]*>(.*?)<\/h6>/gi, (_m: string, content: string) => {
    return `###### ${processInline(content)}\n\n`
  })

  // ── Blockquotes ──
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m: string, content: string) => {
    const inner = processInline(content.trim())
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')
    return `\n${inner}\n\n`
  })

  // ── Unordered lists ──
  text = text.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m: string, content: string) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi)
    if (!items) return ''
    const list = items
      .map((item) => {
        const inner = item.replace(/<\/?li[^>]*>/gi, '').trim()
        return `${bulletMarker} ${processInline(inner)}`
      })
      .join('\n')
    return `\n${list}\n\n`
  })

  // ── Ordered lists ──
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m: string, content: string) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi)
    if (!items) return ''
    const list = items
      .map((item, index) => {
        const inner = item.replace(/<\/?li[^>]*>/gi, '').trim()
        return `${index + 1}. ${processInline(inner)}`
      })
      .join('\n')
    return `\n${list}\n\n`
  })

  // ── Horizontal rules ──
  text = text.replace(/<hr\s*\/?>/gi, `\n${hrChar}\n\n`)

  // ── Line breaks ──
  text = text.replace(/<br\s*\/?>/gi, '\n')

  // ── Images ──
  text = text.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, (_m: string, src: string, alt: string) => {
    return `![${alt}](${src})`
  })
  text = text.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, (_m: string, src: string) => {
    return `![](${src})`
  })

  // ── Links ──
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (_m: string, href: string, content: string) => {
    const inner = processInline(content)
    return `[${inner}](${decodeEntities(href)})`
  })

  // ── Strong / Bold ──
  text = text.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, (_m: string, content: string) => {
    return `**${processInline(content)}**`
  })

  // ── Emphasis / Italic ──
  text = text.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, (_m: string, content: string) => {
    return `*${processInline(content)}*`
  })

  // ── Paragraph tags ──
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, (_m: string, content: string) => {
    return `${processInline(content)}\n\n`
  })

  // ── Strip remaining HTML tags ──
  text = text.replace(/<[^>]*>/g, '')

  // ── Restore code blocks ──
  text = text.replace(/\x00CODE_BLOCK_(\d+)\x00/g, (_m: string, index: string) => {
    return codeBlocks[Number(index)] ?? ''
  })

  // ── Decode HTML entities ──
  text = decodeEntities(text)

  // ── Normalise whitespace ──
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .trimEnd()

  return text
}

/* ── Inline processing helper ── */

function processInline(text: string): string {
  // Process inline elements inside a piece of text
  let result = text

  // Images
  result = result.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
  result = result.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)')

  // Links
  result = result.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (_m: string, href: string, content: string) => {
    return `[${processInline(content)}](${decodeEntities(href)})`
  })

  // Bold / Strong
  result = result.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**')

  // Italic / Emphasis
  result = result.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*')

  // Inline code
  result = result.replace(/<code\b[^>]*>(.*?)<\/code>/gi, (_m: string, code: string) => {
    return `\`${decodeEntities(code)}\``
  })

  // Line breaks
  result = result.replace(/<br\s*\/?>/gi, '\n')

  // Strip any remaining tags
  result = result.replace(/<[^>]*>/g, '')

  // Decode entities
  result = decodeEntities(result)

  return result.trim()
}
