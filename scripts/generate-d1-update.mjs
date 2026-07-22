/**
 * generate-d1-update.mjs
 * 
 * Reads the expanded blog bodies from index-uk.ts and generates
 * SQL UPDATE statements for D1 blog_post_translations.
 * 
 * Usage:
 *   node scripts/generate-d1-update.mjs > scripts/update-9-articles.sql
 *   npx wrangler d1 execute podvarchan --file=scripts/update-9-articles.sql --remote
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const SLUGS = [
  'psikhosomatika-golovokruzheniya',
  'psikhosomatika-boli-v-shee',
  'psikhosomatika-davleniya',
  'kak-perestat-boyatsya-budushchego',
  'postoyannoe-vnutrennee-napryazhenie',
  'strakh-smerti-bez-prichiny',
  'pochemu-voznikaet-panika-nochyu',
  'kom-v-gorle-pri-trevoge',
  'neyverennost-kak-preodolet',
]

const filePath = join(process.cwd(), 'src', 'content', 'blog', 'index-uk.ts')
const content = readFileSync(filePath, 'utf-8')

// Split into individual blog post blocks by looking for slug patterns
// Each post has: slug: 'xxx', ... body: `...`.trim(),
const lines = content.split('\n')

const updates = []

for (const slug of SLUGS) {
  // Find the line with this slug
  const slugLineIdx = lines.findIndex(l => l.includes(`slug: '${slug}'`))
  if (slugLineIdx === -1) {
    console.error(`WARNING: slug '${slug}' not found in index-uk.ts`)
    continue
  }
  
  // Find body: ` line after slug
  let bodyStartIdx = -1
  for (let i = slugLineIdx; i < lines.length; i++) {
    if (lines[i].trim().startsWith('body: `') || lines[i].trim() === 'body: `') {
      bodyStartIdx = i
      break
    }
  }
  if (bodyStartIdx === -1) {
    console.error(`WARNING: body start not found for slug '${slug}'`)
    continue
  }
  
  // Find the closing `.trim(),` — look for it after body start
  let bodyEndIdx = -1
  for (let i = bodyStartIdx + 1; i < lines.length; i++) {
    if (lines[i].includes('`.trim()')) {
      bodyEndIdx = i
      break
    }
  }
  if (bodyEndIdx === -1) {
    console.error(`WARNING: body end not found for slug '${slug}'`)
    continue
  }
  
  // Extract body: everything between body: ` and `.trim(),
  // First line after "body: \`" is the actual HTML content start
  const bodyLines = lines.slice(bodyStartIdx + 1, bodyEndIdx)
  let body = bodyLines.join('\n').trim()
  
  // Escape single quotes for SQL
  const escaped = body.replace(/'/g, "''")
  
  updates.push({ slug, body: escaped, charCount: body.length })
}

// Generate SQL
console.log(`-- Update D1 blog_post_translations.content_html for 9 expanded UK articles`)
console.log(`-- Generated from index-uk.ts expanded bodies`)
console.log(`-- Run: npx wrangler d1 execute podvarchan --file=scripts/update-9-articles.sql --remote\n`)

for (const { slug, body, charCount } of updates) {
  console.log(`-- ${slug} (${charCount} chars)`)
  console.log(`UPDATE blog_post_translations SET content_html = '${body}' WHERE locale = 'uk' AND slug = '${slug}';`)
  console.log()
}

console.error(`\nGenerated ${updates.length} UPDATE statements`)
console.error(`Total chars: ${updates.reduce((s, u) => s + u.charCount, 0)}`)
