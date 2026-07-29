#!/usr/bin/env npx tsx
/**
 * Seed скрипт для перенесення статей блогу зі статичних файлів у D1.
 *
 * Динамічно імпортує дані з src/content/blog/index.ts (RU) та index-uk.ts (UK).
 * Використання:
 *   npx tsx scripts/seed-blog.ts                          → вивід SQL в консоль
 *   npx tsx scripts/seed-blog.ts | wrangler d1 execute podvarchan --remote
 *   npx tsx scripts/seed-blog.ts > scripts/seed-blog-output.sql
 */

import { randomUUID } from 'crypto'
import { BLOG_POSTS, BLOG_POSTS_UK } from '../src/content/blog/index'
import type { BlogPost } from '../src/types'

// ── Category UUIDs (must match existing DB) ──
const CATEGORIES: Record<string, string> = {
  'gipnoterapiya': '83253037-5f33-4c76-9f00-511225131426',
  'trevoga': '9e46b05c-83c0-45b3-b45b-4e14eea8319d',
  'samosabotazh': 'c3bf4ef4-53fc-4395-890f-1bc8af88d114',
  'vygoraniye': '11111111-1111-1111-1111-111111111001',
  'podsoznanie': '889596c9-9768-4493-a357-31f6df43f607',
  'krizis': '11111111-1111-1111-1111-111111111002',
  'tsifrovoy-detoks': '0a038302-e133-43bf-8520-8a3924a262fa',
  'psikhosomatika': '9e46b05c-83c0-45b3-b45b-4e14eea8319d',
  'ptsr': '11111111-1111-1111-1111-111111111003',
}

// ── Helpers ──
const esc = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return 'NULL'
  return "'" + String(v).replace(/'/g, "''") + "'"
}

const now = (): string => new Date().toISOString()

// ── Generate SQL ──
const lines: string[] = []

// Safety: disable FK checks during seed
lines.push('PRAGMA foreign_keys = OFF;')
lines.push('')

for (const ruPost of BLOG_POSTS) {
  const postId = randomUUID()
  const ts = now()
  const catId = CATEGORIES[ruPost.categorySlug] || null

  // Find matching UK post
  const ukPost: BlogPost | undefined = BLOG_POSTS_UK.find(p => p.slug === ruPost.slug)
  if (!ukPost) {
    console.warn(`⚠️  UK post not found for slug: ${ruPost.slug} — falling back to RU content`)
  }

  // Normalise body: ensure it's a string
  const ruBody = ruPost.body || ''
  const ukBody = ukPost?.body || ''

  // ── blog_posts row ──
  lines.push(
    `INSERT INTO blog_posts ` +
    `(id, category_id, author_id, status, cover_image_id, reading_minutes, published_at, scheduled_at, created_at, updated_at) ` +
    `VALUES (${esc(postId)}, ${esc(catId)}, NULL, 'PUBLISHED', NULL, ` +
    `${ruPost.readingTime}, ` +
    `${esc(ruPost.datePublished + 'T00:00:00.000Z')}, NULL, ${esc(ts)}, ${esc(ts)});`
  )

  // ── RU translation ──
  lines.push(
    `INSERT INTO blog_post_translations ` +
    `(id, post_id, locale, slug, title, excerpt, content_json, content_html, table_of_contents_json, faq_json, seo_meta_id) ` +
    `VALUES (${esc(randomUUID())}, ${esc(postId)}, 'ru', ` +
    `${esc(ruPost.slug)}, ${esc(ruPost.title)}, ${esc(ruPost.description)}, ` +
    `NULL, ${esc(ruBody)}, NULL, NULL, NULL);`
  )

  // ── UK translation ──
  lines.push(
    `INSERT INTO blog_post_translations ` +
    `(id, post_id, locale, slug, title, excerpt, content_json, content_html, table_of_contents_json, faq_json, seo_meta_id) ` +
    `VALUES (${esc(randomUUID())}, ${esc(postId)}, 'uk', ` +
    `${esc(ukPost?.slug || ruPost.slug)}, ` +
    `${esc(ukPost?.title || ruPost.title)}, ` +
    `${esc(ukPost?.description || ruPost.description)}, ` +
    `NULL, ${esc(ukBody || ruBody)}, NULL, NULL, NULL);`
  )
}

// ── Output ──
console.log('-- === SEED: Blog Posts (dynamic from static files) ===')
console.log(`-- Posts: ${BLOG_POSTS.length}, Generated: ${new Date().toISOString()}`)
console.log('')
console.log(lines.join('\n'))
console.log('')
console.log('-- Done.')
