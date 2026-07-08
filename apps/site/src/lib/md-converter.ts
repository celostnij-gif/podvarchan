/**
 * Lightweight HTML → Markdown converter for agent content negotiation.
 * Runs on Cloudflare Workers edge runtime.
 *
 * Strips layout chrome (nav, footer, header, scripts, styles),
 * extracts <meta> metadata, converts content to clean markdown.
 */

/* ── Metadata extraction ── */

type PageMeta = {
  title?: string
  description?: string
  image?: string
}

function extractMeta(html: string): PageMeta {
  const meta: PageMeta = {}

  // title from <meta name="title"> or <meta property="og:title">
  const titleStandard = html.match(
    /<meta\s+name=["']title["'][^>]*content=["']([^"']*)["']/i,
  )
  const titleOg = html.match(
    /<meta\s+property=["']og:title["'][^>]*content=["']([^"']*)["']/i,
  )
  meta.title = titleStandard?.[1] || titleOg?.[1] || undefined

  // description from <meta name="description"> or <meta property="og:description">
  const descStandard = html.match(
    /<meta\s+name=["']description["'][^>]*content=["']([^"']*)["']/i,
  )
  const descOg = html.match(
    /<meta\s+property=["']og:description["'][^>]*content=["']([^"']*)["']/i,
  )
  meta.description = descStandard?.[1] || descOg?.[1] || undefined

  // image from <meta property="og:image">
  const img = html.match(
    /<meta\s+property=["']og:image["'][^>]*content=["']([^"']*)["']/i,
  )
  meta.image = img?.[1] || undefined

  return meta
}

/* ── JSON-LD extraction ── */

function extractJsonLd(html: string): string[] {
  const blocks: string[] = []
  const regex =
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    const content = match[1].trim()
    if (content) blocks.push(content)
  }
  return blocks
}

/* ── HTML stripping helpers ── */

function stripTags(raw: string, tags: string[]): string {
  let result = raw
  for (const tag of tags) {
    // Strip opening + content + closing
    const openTag = `<${tag}[^>]*>`
    const closeTag = `</${tag}>`
    const selfClose = `<${tag}[^>]*\\/>`
    const blockRe = new RegExp(
      `${openTag}[\\s\\S]*?${closeTag}|${selfClose}`,
      'gi',
    )
    result = result.replace(blockRe, '')
    // Also strip any remaining standalone tags
    result = result.replace(new RegExp(`<\\/?${tag}[^>]*>`, 'gi'), '')
  }
  return result
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

/* ── Block-level conversion ── */

function convertHeadings(html: string): string {
  return html
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '###### $1\n\n')
}

function convertParagraphs(html: string): string {
  return html.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
}

function convertLists(html: string): string {
  // Unordered lists
  let result = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, content) => {
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n') + '\n'
  })
  // Ordered lists
  let counter = 1
  result = result.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, content) => {
    const list = content.replace(
      /<li[^>]*>([\s\S]*?)<\/li>/gi,
      () => `${counter++}. $1\n`,
    )
    counter = 1
    return list + '\n'
  })
  return result
}

function convertBlockquotes(html: string): string {
  return html.replace(
    /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
    (_m, content) => {
      const lines = content.trim().split('\n')
      return lines.map((l: string) => `> ${l.trim()}`).join('\n') + '\n\n'
    },
  )
}

function convertCodeBlocks(html: string): string {
  return html.replace(
    /<pre[^>]*>[\s\S]*?<code[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi,
    (_m, code) => '```\n' + decodeEntities(code.trim()) + '\n```\n\n',
  )
}

/* ── Inline conversion ── */

function convertInline(html: string): string {
  let result = html
  // Preserve code inside backticks
  result = result.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
  // Bold
  result = result.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
  result = result.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
  // Italic
  result = result.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
  result = result.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
  // Links
  result = result.replace(
    /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
    '[$2]($1)',
  )
  // Images
  result = result.replace(
    /<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi,
    '![$2]($1)',
  )
  // Bare images without alt
  result = result.replace(
    /<img[^>]*src=["']([^"']*)["'][^>]*\/?>/gi,
    '![]($1)',
  )
  // Horizontal rules
  result = result.replace(/<hr[^>]*\/?>/gi, '\n---\n\n')
  // Line breaks
  result = result.replace(/<br[^>]*\/?>/gi, '\n')
  // Remove remaining HTML tags
  result = result.replace(/<[^>]*>/g, '')
  // Decode entities
  result = decodeEntities(result)
  return result
}

/* ── Main conversion ── */

/**
 * Convert an HTML page to clean Markdown.
 * Strips layout chrome, extracts metadata, and preserves JSON-LD.
 */
export function htmlToMarkdown(html: string): {
  body: string
  meta: PageMeta
  jsonLd: string[]
  tokenCount: number
} {
  const meta = extractMeta(html)
  const jsonLd = extractJsonLd(html)

  // Strip layout chrome — remove before content extraction
  let clean = stripTags(html, [
    'script',
    'style',
    'nav',
    'footer',
    'header',
    'aside',
    'form',
    'button',
    'noscript',
    'iframe',
  ])

  // Try to extract <main> content; fallback to <body>
  const mainMatch = clean.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  if (mainMatch) {
    clean = mainMatch[1]
  } else {
    const bodyMatch = clean.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) clean = bodyMatch[1]
  }

  // Remove inline event handlers, class/id attributes for cleaner text
  clean = clean.replace(/\son\w+="[^"]*"/gi, '')
  clean = clean.replace(/\s(?:class|id|style)="[^"]*"/gi, '')

  // Order matters: block-level first, then inline
  clean = convertCodeBlocks(clean)
  clean = convertHeadings(clean)
  clean = convertLists(clean)
  clean = convertBlockquotes(clean)
  clean = convertParagraphs(clean)
  clean = convertInline(clean)

  // Collapse multiple blank lines
  clean = clean.replace(/\n{3,}/g, '\n\n').trim()

  // Count tokens (approximate: words + punctuation; similar to GPT tokenizer)
  const tokenCount = Math.round(clean.split(/\s+/).length * 1.3)

  return { body: clean, meta, jsonLd, tokenCount }
}

/**
 * Build a complete Markdown document from HTML with YAML frontmatter.
 */
export function buildMarkdownDocument(html: string): {
  markdown: string
  tokenCount: number
} {
  const { body, meta, jsonLd, tokenCount } = htmlToMarkdown(html)

  const parts: string[] = []

  // YAML frontmatter
  const frontmatter: string[] = []
  if (meta.title) frontmatter.push(`title: ${meta.title}`)
  if (meta.description) frontmatter.push(`description: ${meta.description}`)
  if (meta.image) frontmatter.push(`image: ${meta.image}`)

  if (frontmatter.length > 0) {
    parts.push('---')
    parts.push(frontmatter.join('\n'))
    parts.push('---')
    parts.push('')
  }

  // Body
  parts.push(body)

  // JSON-LD
  if (jsonLd.length > 0) {
    parts.push('')
    parts.push('```json')
    parts.push(jsonLd.join('\n'))
    parts.push('```')
  }

  return { markdown: parts.join('\n').trim() + '\n', tokenCount }
}
