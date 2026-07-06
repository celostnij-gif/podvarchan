/**
 * Seed script — переносить весь існуючий контент у D1.
 *
 * Запуск: npm run db:seed
 * Джерела: messages/*.json, src/constants/index.ts, src/content/blog/*
 *
 * Ідемпотентний: upsert за ключем.
 *
 * Працює в двох режимах:
 *   1. Node.js (tsx):  better-sqlite3 → local D1 .sqlite
 *   2. Workers (API):  getDB() → D1 binding
 */

import { readFileSync, statSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { globSync } from 'glob'
import bcrypt from 'bcryptjs'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import type { Service, BlogCategory, NavItem, BlogPost } from '@/types'

let db: BetterSQLite3Database | DrizzleD1Database

function isNode(): boolean {
  return typeof process !== 'undefined' && process.versions?.node !== undefined
}

/* ── DB init ── */

async function initNodeDB(): Promise<BetterSQLite3Database> {
  const { default: Database } = await import('better-sqlite3')
  const { drizzle } = await import('drizzle-orm/better-sqlite3')
  // Find local D1 SQLite file
  const patterns = [
    '.wrangler/state/v3/d1/**/*.sqlite',
    '.wrangler/state/d1/**/*.sqlite',
  ]
  let dbPath: string | undefined
  for (const pattern of patterns) {
    const files = globSync(pattern, { cwd: process.cwd() })
    if (files.length > 0) {
      // Prefer the one with most recent mtime
      files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
      dbPath = resolve(files[0])
      break
    }
  }
  if (!dbPath) {
    throw new Error('Local D1 SQLite not found. Run: npx wrangler d1 migrations apply DB --local')
  }
  const sqliteDb = new Database(dbPath)
  sqliteDb.pragma('journal_mode = WAL')
  sqliteDb.pragma('foreign_keys = ON')
  return drizzle({ client: sqliteDb })
}

async function initWorkerDB(): Promise<DrizzleD1Database> {
  const { getDB } = await import('@/db')
  return getDB() as unknown as DrizzleD1Database
}

/* ── Data types ── */

interface ServiceMsg {
  slug: string
  title: string
  shortTitle: string
  description: string
  metaDescription: string
  keywords: string[]
  cta: string
  heroTitle?: string
  heroSubtitle?: string
}

interface FaqMsg {
  question: string
  answer: string
}

interface BlogCategoryMsg {
  slug: string
  name: string
  description: string
  metaDescription: string
  keywords: string[]
  serviceSlug?: string
}

/* ── Logger ── */

const log = {
  info: (msg: string) => console.log(`  ℹ️  ${msg}`),
  ok: (msg: string) => console.log(`  ✅ ${msg}`),
  skip: (msg: string) => console.log(`  ⏭️  ${msg}`),
  err: (msg: string) => console.error(`  ❌ ${msg}`),
}

interface SeedReport {
  users: number
  services: number
  serviceTranslations: number
  blogCategories: number
  blogCategoryTranslations: number
  blogPosts: number
  blogPostTranslations: number
  faqItems: number
  faqItemTranslations: number
  testimonials: number
  pages: number
  pageTranslations: number
  navItems: number
  contactChannels: number
}

function now(): string {
  return new Date().toISOString()
}

function id(): string {
  return randomUUID()
}

function loadMessagesJson(path: string): Record<string, unknown> {
  const content = readFileSync(path, 'utf-8')
  return JSON.parse(content)
}

/* ── Main seed ── */

export async function seed(forceDB?: typeof db): Promise<SeedReport> {
  if (forceDB) {
    db = forceDB
  } else if (!db) {
    db = isNode() ? await initNodeDB() : await initWorkerDB()
  }

  const report: SeedReport = {
    users: 0, services: 0, serviceTranslations: 0,
    blogCategories: 0, blogCategoryTranslations: 0,
    blogPosts: 0, blogPostTranslations: 0,
    faqItems: 0, faqItemTranslations: 0, testimonials: 0,
    pages: 0, pageTranslations: 0, navItems: 0, contactChannels: 0,
  }

  const ru = loadMessagesJson('messages/ru.json') as Record<string, unknown>
  const uk = loadMessagesJson('messages/uk.json') as Record<string, unknown>

  // Lazily import to avoid build errors when these files aren't available
  let SERVICES: Service[] = []
  let BLOG_CATEGORIES: BlogCategory[] = []
  let MAIN_NAV: NavItem[] = []
  let SERVICE_ICONS: Record<string, string> = {}
  let BLOG_POSTS: BlogPost[] = []
  let BLOG_POSTS_UK: BlogPost[] = []

  try {
    const constants = await import('@/constants')
    SERVICES = constants.SERVICES
    BLOG_CATEGORIES = constants.BLOG_CATEGORIES
    MAIN_NAV = constants.MAIN_NAV
    SERVICE_ICONS = constants.SERVICE_ICONS ?? {}
  } catch {
    log.err('Cannot import @/constants — seed needs full project build')
  }

  try {
    const blog = await import('@/content/blog/index')
    BLOG_POSTS = blog.BLOG_POSTS
  } catch { /* not critical in Node — will be empty */ }

  try {
    const blogUk = await import('@/content/blog/index-uk')
    BLOG_POSTS_UK = blogUk.BLOG_POSTS_UK
  } catch { /* not critical */ }

  // ── DB helpers ──
  const tables = await import('@/db/schema/index')
  const { eq } = await import('drizzle-orm')
  type UserRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'

  async function insert(table: SQLiteTable, values: Record<string, unknown>) {
    await (db as BetterSQLite3Database).insert(table).values(values).onConflictDoNothing()
  }

  console.log('\n📦 Seeding database...\n')

  /* ═══════════════════════════════════
     1. USERS
     ═══════════════════════════════════ */
  const adminEmail = process.env.ADMIN_SEED_EMAIL
  const adminPassword = process.env.ADMIN_SEED_PASSWORD
  if (adminEmail && adminPassword) {
    const existing = await (db as BetterSQLite3Database).select().from(tables.users)
      .where(eq(tables.users.email, adminEmail)).all()
    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 12)
      await insert(tables.users, {
        id: id(), email: adminEmail, passwordHash,
        name: 'Владелец', role: 'OWNER' as UserRole,
        isActive: true, createdAt: now(), updatedAt: now(),
      })
      report.users++
      log.ok(`OWNER user: ${adminEmail}`)
    } else {
      log.skip(`OWNER user exists: ${adminEmail}`)
    }
  } else {
    log.err('ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not set — skipping user')
  }

  /* ═══════════════════════════════════
     2. SERVICES + TRANSLATIONS
     ═══════════════════════════════════ */
  const ruServicesData = (ru.servicesData ?? []) as ServiceMsg[]
  const ukServicesData = (uk.servicesData ?? []) as ServiceMsg[]
  const ruServiceFaqs = ru.serviceFaqs as Record<string, FaqMsg[]> ?? {}
  const ukServiceFaqs = uk.serviceFaqs as Record<string, FaqMsg[]> ?? {}
  const ruServiceSymptoms = ru.serviceSymptoms as Record<string, unknown[]> ?? {}
  const ukServiceSymptoms = uk.serviceSymptoms as Record<string, unknown[]> ?? {}

  for (const svc of SERVICES) {
    const existing = await (db as BetterSQLite3Database).select().from(tables.services)
      .where(eq(tables.services.slugBase, svc.slug)).all()
    const serviceId = existing.length > 0 ? existing[0].id : id()

    if (existing.length === 0) {
      await insert(tables.services, {
        id: serviceId, slugBase: svc.slug,
        icon: SERVICE_ICONS[svc.slug] ?? svc.icon,
        category: svc.category, priority: svc.priority,
        status: 'PUBLISHED', featured: false,
        sortOrder: SERVICES.indexOf(svc),
        createdAt: now(), updatedAt: now(),
      })
      report.services++
    }

    // RU
    const ruData = ruServicesData.find(s => s.slug === svc.slug)
    if (ruData) {
      const existingRu = await (db as BetterSQLite3Database).select().from(tables.serviceTranslations)
        .where(eq(tables.serviceTranslations.slug, ruData.slug)).all()
      if (existingRu.length === 0) {
        await insert(tables.serviceTranslations, {
          id: id(), serviceId, locale: 'ru',
          slug: ruData.slug, title: ruData.title,
          shortTitle: ruData.shortTitle,
          description: ruData.description,
          heroTitle: ruData.heroTitle ?? ruData.title,
          heroSubtitle: ruData.heroSubtitle ?? '',
          symptomsJson: ruServiceSymptoms[ruData.slug] ? JSON.stringify(ruServiceSymptoms[ruData.slug]) : null,
          faqJson: ruServiceFaqs[ruData.slug] ? JSON.stringify(ruServiceFaqs[ruData.slug]) : null,
          ctaText: ruData.cta,
        })
        report.serviceTranslations++
      }
    }

    // UK
    const ukData = ukServicesData.find(s => s.slug === svc.slug)
    if (ukData) {
      const existingUk = await (db as BetterSQLite3Database).select().from(tables.serviceTranslations)
        .where(eq(tables.serviceTranslations.slug, ukData.slug)).all()
      if (existingUk.length === 0) {
        await insert(tables.serviceTranslations, {
          id: id(), serviceId, locale: 'uk',
          slug: ukData.slug, title: ukData.title,
          shortTitle: ukData.shortTitle,
          description: ukData.description,
          heroTitle: ukData.heroTitle ?? ukData.title,
          heroSubtitle: ukData.heroSubtitle ?? '',
          symptomsJson: ukServiceSymptoms[ukData.slug] ? JSON.stringify(ukServiceSymptoms[ukData.slug]) : null,
          faqJson: ukServiceFaqs[ukData.slug] ? JSON.stringify(ukServiceFaqs[ukData.slug]) : null,
          ctaText: ukData.cta,
        })
        report.serviceTranslations++
      }
    }
  }
  log.ok(`${report.services} services, ${report.serviceTranslations} translations`)

  /* ═══════════════════════════════════
     3. FAQ
     ═══════════════════════════════════ */
  const ruFaqData = (ru.faqData ?? []) as FaqMsg[]
  const ukFaqData = (uk.faqData ?? []) as FaqMsg[]

  for (const [idx, faq] of ruFaqData.entries()) {
    const faqId = id()
    await insert(tables.faqItems, {
      id: faqId, group: 'GENERAL', status: 'PUBLISHED', sortOrder: idx,
    })
    report.faqItems++
    await insert(tables.faqItemTranslations, {
      id: id(), faqItemId: faqId, locale: 'ru',
      question: faq.question, answer: faq.answer,
    })
    report.faqItemTranslations++

    const ukFaq = ukFaqData[idx]
    if (ukFaq) {
      await insert(tables.faqItemTranslations, {
        id: id(), faqItemId: faqId, locale: 'uk',
        question: ukFaq.question, answer: ukFaq.answer,
      })
      report.faqItemTranslations++
    }
  }
  log.ok(`${report.faqItems} FAQ items, ${report.faqItemTranslations} translations`)

  /* ═══════════════════════════════════
     4. BLOG CATEGORIES
     ═══════════════════════════════════ */
  const ruBlogCategories = (ru.blogCategories ?? []) as BlogCategoryMsg[]
  const ukBlogCategories = (uk.blogCategories ?? []) as BlogCategoryMsg[]

  for (const cat of BLOG_CATEGORIES) {
    const existing = await (db as BetterSQLite3Database).select().from(tables.blogCategories)
      .where(eq(tables.blogCategories.slugBase, cat.slug)).all()
    const catId = existing.length > 0 ? existing[0].id : id()

    if (existing.length === 0) {
      await insert(tables.blogCategories, {
        id: catId, slugBase: cat.slug,
        sortOrder: BLOG_CATEGORIES.indexOf(cat), status: 'PUBLISHED',
      })
      report.blogCategories++
    }

    const ruCat = ruBlogCategories.find(c => c.slug === cat.slug)
    if (ruCat) {
      await insert(tables.blogCategoryTranslations, {
        id: id(), categoryId: catId, locale: 'ru',
        slug: cat.slug, name: ruCat.name, description: ruCat.description,
      })
      report.blogCategoryTranslations++
    }
    const ukCat = ukBlogCategories.find(c => c.slug === cat.slug)
    if (ukCat) {
      await insert(tables.blogCategoryTranslations, {
        id: id(), categoryId: catId, locale: 'uk',
        slug: cat.slug, name: ukCat.name, description: ukCat.description,
      })
      report.blogCategoryTranslations++
    }
  }
  log.ok(`${report.blogCategories} blog categories`)

  /* ═══════════════════════════════════
     5. BLOG POSTS
     ═══════════════════════════════════ */
  for (const post of BLOG_POSTS) {
    const postId = id()
    const cat = BLOG_CATEGORIES.find(c => c.slug === post.categorySlug)
    const catResult = cat ? (await (db as BetterSQLite3Database).select().from(tables.blogCategories)
      .where(eq(tables.blogCategories.slugBase, cat.slug)).all()) : []
    await insert(tables.blogPosts, {
      id: postId,
      categoryId: catResult[0]?.id ?? null,
      status: 'PUBLISHED',
      publishedAt: post.datePublished ?? now(),
      createdAt: now(), updatedAt: now(),
    })
    report.blogPosts++

    await insert(tables.blogPostTranslations, {
      id: id(), postId, locale: 'ru',
      slug: post.slug, title: post.title,
      excerpt: post.description ?? null,
      contentJson: post.body ?? null,
    })
    report.blogPostTranslations++

    const ukPost = BLOG_POSTS_UK.find(p => p.slug === post.slug)
    if (ukPost) {
      await insert(tables.blogPostTranslations, {
        id: id(), postId, locale: 'uk',
        slug: ukPost.slug, title: ukPost.title,
        excerpt: ukPost.description ?? null,
        contentJson: ukPost.body ?? null,
      })
      report.blogPostTranslations++
    }
  }
  log.ok(`${report.blogPosts} blog posts, ${report.blogPostTranslations} translations`)

  /* ═══════════════════════════════════
     6. PAGES
     ═══════════════════════════════════ */
  const pageTypes = [
    { type: 'HOME' as const, slug: '', pagesKey: 'home' },
    { type: 'METHOD' as const, slug: 'metod', pagesKey: 'metod' },
    { type: 'ABOUT' as const, slug: 'ob-avtore', pagesKey: 'about' },
    { type: 'FAQ' as const, slug: 'faq', pagesKey: 'faq' },
    { type: 'CONTACTS' as const, slug: 'kontakty', pagesKey: 'contacts' },
    { type: 'PRIVACY' as const, slug: 'politika-konfidentsialnosti', pagesKey: 'privacy' },
    { type: 'DISCLAIMER' as const, slug: 'disclaimer', pagesKey: 'disclaimer' },
  ]

  const ruPages = ru.pages as Record<string, Record<string, string>> ?? {}
  const ukPages = uk.pages as Record<string, Record<string, string>> ?? {}

  for (const pt of pageTypes) {
    const existing = await (db as BetterSQLite3Database).select().from(tables.pages)
      .where(eq(tables.pages.type, pt.type)).all()
    const pageId = existing.length > 0 ? existing[0].id : id()

    if (existing.length === 0) {
      await insert(tables.pages, {
        id: pageId, type: pt.type,
        slugPattern: pt.slug || '/', status: 'PUBLISHED',
        sortOrder: pageTypes.indexOf(pt),
        createdAt: now(), updatedAt: now(),
      })
      report.pages++
    }

    const ruTitle = ruPages[pt.pagesKey]?.pageTitle ?? (ru.blog as Record<string, string> | undefined)?.['pageTitle'] ?? ''
    await insert(tables.pageTranslations, {
      id: id(), pageId, locale: 'ru',
      slug: pt.slug || '/', title: ruTitle,
    })
    report.pageTranslations++

    const ukTitle = ukPages[pt.pagesKey]?.pageTitle ?? (uk.blog as Record<string, string> | undefined)?.['pageTitle'] ?? ''
    await insert(tables.pageTranslations, {
      id: id(), pageId, locale: 'uk',
      slug: pt.slug || '/', title: ukTitle,
    })
    report.pageTranslations++
  }
  log.ok(`${report.pages} pages, ${report.pageTranslations} translations`)

  /* ═══════════════════════════════════
     7. NAVIGATION
     ═══════════════════════════════════ */
  for (const [idx, nav] of MAIN_NAV.entries()) {
    await insert(tables.navigationItems, {
      id: id(), location: 'HEADER',
      href: nav.href, labelRu: nav.label, labelUk: nav.label,
      isEnabled: true, sortOrder: idx,
    })
    report.navItems++
  }
  log.ok(`${report.navItems} nav items`)

  /* ═══════════════════════════════════
     8. CONTACT CHANNELS
     ═══════════════════════════════════ */
  const channels = [
    { type: 'EMAIL' as const, label: 'Email', value: 'podvarchan@gmail.com', url: 'mailto:podvarchan@gmail.com', isPrimary: true },
    { type: 'TELEGRAM' as const, label: 'Telegram', value: '@podvarchan', url: 'https://t.me/podvarchan', isPrimary: false },
    { type: 'WHATSAPP' as const, label: 'WhatsApp', value: '', url: '#', isPrimary: false },
  ]

  for (const ch of channels) {
    await insert(tables.contactChannels, {
      id: id(), ...ch, sortOrder: channels.indexOf(ch),
    })
    report.contactChannels++
  }
  log.ok(`${report.contactChannels} contact channels`)

  /* ═══════════════════════════════════
     REPORT
     ═══════════════════════════════════ */
  console.log('\n📊 Seed report:\n')
  for (const [key, value] of Object.entries(report)) {
    console.log(`  ${key}: ${value}`)
  }
  console.log('')

  return report
}

/* ── CLI runner ── */
async function main() {
  try {
    await seed()
    process.exit(0)
  } catch (err) {
    console.error('\n❌ Seed failed:', err)
    process.exit(1)
  }
}

main()
