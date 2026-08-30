const FORBIDDEN_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base',
  'form', 'input', 'button', 'textarea', 'select', 'option', 'optgroup',
  'svg', 'math', 'frame', 'frameset', 'applet', 'noscript', 'template',
  'slot', 'dialog', 'audio', 'video', 'source', 'track', 'picture', 'canvas',
  'map', 'xmp', 'plaintext', 'title', 'head', 'body', 'html', 'marquee', 'portal',
])

const SAFE_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'width', 'height', 'rel', 'target',
  'colspan', 'rowspan', 'start', 'type', 'loading',
])

const TAG_NAME_RE = /^[a-zA-Z][a-zA-Z0-9]*$/

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed === '') return true
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('#') || lower.startsWith('/') || lower.startsWith('.')) return true
  const schemeEnd = lower.indexOf(':')
  if (schemeEnd === -1) return true
  const scheme = lower.slice(0, schemeEnd)
  return scheme === 'http' || scheme === 'https' || scheme === 'mailto' || scheme === 'tel'
}

function parseAttrs(src: string): string[] {
  const result: string[] = []
  const re = /([a-zA-Z_][a-zA-Z0-9_:-]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'/>]+))?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    const name = m[1].toLowerCase()
    if (name.startsWith('on')) continue
    if (!SAFE_ATTRS.has(name)) continue
    let value = m[2] ?? ''
    if (
      value.length >= 2 &&
      ((value[0] === '"' && value[value.length - 1] === '"') ||
        (value[0] === "'" && value[value.length - 1] === "'"))
    ) {
      value = value.slice(1, -1)
    }
    if ((name === 'href' || name === 'src') && !isSafeUrl(value)) continue
    result.push(`${name}="${value.replace(/"/g, '&quot;')}"`)
  }
  return result
}

/**
 * Defense-in-depth HTML scrubber for the Workers runtime (no DOM, no deps).
 * Blocks execute-able tags, event handlers and dangerous URL schemes while
 * preserving the rich-text subset produced by the TipTap editors.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''
  let out = ''
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (ch !== '<') {
      out += ch
      i++
      continue
    }
    if (input.startsWith('<!--', i)) {
      const end = input.indexOf('-->', i)
      if (end === -1) break
      i = end + 3
      continue
    }
    const gt = input.indexOf('>', i)
    if (gt === -1) {
      out += '&lt;'
      i++
      continue
    }
    const raw = input.slice(i + 1, gt)
    i = gt + 1

    if (raw.startsWith('/')) {
      const tag = raw.slice(1).trim().toLowerCase()
      if (!FORBIDDEN_TAGS.has(tag) && TAG_NAME_RE.test(tag)) out += `</${tag}>`
      continue
    }

    const trimmed = raw.trim()
    const selfClose = trimmed.endsWith('/')
    const body = selfClose ? trimmed.slice(0, -1).trim() : trimmed
    const m = body.match(/^([a-zA-Z][a-zA-Z0-9]*)([\s\S]*)$/)
    if (!m) {
      out += '&lt;' + raw + '&gt;'
      continue
    }
    const tag = m[1].toLowerCase()
    if (FORBIDDEN_TAGS.has(tag)) {
      const closeRe = new RegExp(`</${tag}[^>]*>`, 'i')
      const rest = input.slice(gt + 1)
      const closing = rest.match(closeRe)
      if (closing) {
        i += closing.index! + closing[0].length
      } else {
        i = input.length
      }
      continue
    }
    const attrs = parseAttrs(m[2]).join(' ')
    out += `<${tag}${attrs ? ' ' + attrs : ''}${selfClose ? ' /' : ''}>`
  }
  return out
}