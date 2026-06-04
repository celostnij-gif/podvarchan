/**
 * Seed-скрипт для Cloudflare D1.
 *
 * Заповнює базу даних початковими даними з messages/, src/constants/ та src/content/blog/.
 * ІДЕМПОТЕНТНИЙ — можна запускати багаторазово без дублювання даних.
 *
 * Запуск:
 *   npm run db:seed
 *
 * Для локальної розробки:
 *   npx wrangler d1 execute DB --local --command="$(cat drizzle/migrations/0000_serious_diamondback.sql)"
 *   npx wrangler d1 execute DB --local --file=seed.sql
 *
 * Використовує env-змінні для створення OWNER-користувача:
 *   ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD
 */

import { drizzle } from 'drizzle-orm/d1'
import { eq, and, sql } from 'drizzle-orm'
import * as schema from './schema'

/* ── Source data ── */

import { SITE, MAIN_NAV, SERVICES, BLOG_CATEGORIES, AUTHOR, STATIC_PAGES, SERVICE_ICONS } from '@/constants'
import { BLOG_POSTS } from '@/content/blog'

import ruMessages from '../../messages/ru.json' with { type: 'json' }
import ukMessages from '../../messages/uk.json' with { type: 'json' }

/* ── Helpers ── */

function uuid(): string {
  return crypto.randomUUID()
}

function parseMessages(messages: Record<string, unknown>) {
  const m = messages as Record<string, unknown>
  const testimonials = m.testimonials as Record<string, unknown> | undefined
  return {
    servicesData: (m.servicesData as Array<Record<string, unknown>>) ?? [],
    blogCategories: (m.blogCategories as Array<Record<string, unknown>>) ?? [],
    faqData: (m.faqData as Array<Record<string, unknown>>) ?? [],
    testimonialsItems: (testimonials?.items as Array<Record<string, unknown>>) ?? [],
  }
}

const PAGE_TYPE_MAP: Record<string, schema.Page['type']> = {
  '': 'HOME',
  'uslugi/': 'CUSTOM',
  'ob-avtore/': 'ABOUT',
  'metod/': 'METHOD',
  'blog/': 'CUSTOM',
  'faq/': 'FAQ',
  'kontakty/': 'CONTACTS',
  'politika-konfidentsialnosti/': 'PRIVACY',
  'disclaimer/': 'DISCLAIMER',
  'tseny/': 'PRICING',
}

/* ── Seed ── */

export async function seedDatabase(binding: D1Database): Promise<void> {
  const db = drizzle(binding, { schema })
  const now = new Date()

  console.log('[Seed] Початок заливання даних...')

  /* 1. OWNER користувач */
  const adminEmail = process.env.ADMIN_SEED_EMAIL
  const adminPassword = process.env.ADMIN_SEED_PASSWORD

  if (adminEmail && adminPassword) {
    const existingAdmin = await db.select().from(schema.users).where(eq(schema.users.email, adminEmail)).limit(1)
    if (existingAdmin.length === 0) {
      const bcrypt = await import('bcryptjs')
      const passwordHash = await bcrypt.hash(adminPassword, 12)
      await db.insert(schema.users).values({
        id: uuid(), email: adminEmail, passwordHash, name: 'Администратор',
        role: 'OWNER', isActive: true, createdAt: now, updatedAt: now,
      })
      console.log(`[Seed] Створено OWNER: ${adminEmail}`)
    } else {
      console.log('[Seed] OWNER вже існує')
    }
  }

  const ru = parseMessages(ruMessages as Record<string, unknown>)
  const uk = parseMessages(ukMessages as Record<string, unknown>)

  /* 2. Послуги */
  for (const svc of SERVICES) {
    const [existing] = await db.select().from(schema.services).where(eq(schema.services.slugBase, svc.slug)).limit(1)
    const serviceId = existing?.id ?? uuid()

    if (!existing) {
      await db.insert(schema.services).values({
        id: serviceId, slugBase: svc.slug,
        icon: svc.icon ?? SERVICE_ICONS[svc.slug],
        category: svc.category, priority: svc.priority,
        featured: false, status: 'PUBLISHED', sortOrder: svc.priority * 10,
        publishedAt: now, createdAt: now, updatedAt: now,
      })
    }

    for (const locale of ['ru', 'uk'] as const) {
      const src = locale === 'ru' ? ru : uk
      const data = src.servicesData.find((s) => s.slug === svc.slug)
      if (!data) continue

      const [existingT] = await db.select().from(schema.serviceTranslations)
        .where(and(eq(schema.serviceTranslations.serviceId, serviceId), eq(schema.serviceTranslations.locale, locale)))
        .limit(1)
      if (!existingT) {
        await db.insert(schema.serviceTranslations).values({
          id: uuid(), serviceId, locale,
          slug: data.slug as string, title: data.title as string,
          shortTitle: (data.shortTitle as string) ?? null,
          description: (data.description as string) ?? null,
          ctaText: (data.cta as string) ?? null,
        })
      }
    }
  }

  /* 3. Категорії блогу */
  for (const cat of BLOG_CATEGORIES) {
    const [existing] = await db.select().from(schema.blogCategories).where(eq(schema.blogCategories.slugBase, cat.slug)).limit(1)
    const categoryId = existing?.id ?? uuid()

    if (!existing) {
      await db.insert(schema.blogCategories).values({ id: categoryId, slugBase: cat.slug, sortOrder: 0, status: 'PUBLISHED' })
    }

    for (const locale of ['ru', 'uk'] as const) {
      const src = locale === 'ru' ? ru : uk
      const data = src.blogCategories.find((c) => c.slug === cat.slug)
      if (!data) continue

      const [existingT] = await db.select().from(schema.blogCategoryTranslations)
        .where(and(eq(schema.blogCategoryTranslations.categoryId, categoryId), eq(schema.blogCategoryTranslations.locale, locale)))
        .limit(1)
      if (!existingT) {
        await db.insert(schema.blogCategoryTranslations).values({
          id: uuid(), categoryId, locale,
          slug: data.slug as string, name: data.name as string,
          description: (data.description as string) ?? null,
        })
      }
    }
  }

  /* 4. Статті блогу */
  for (const post of BLOG_POSTS) {
    const [catRow] = await db.select().from(schema.blogCategories)
      .where(eq(schema.blogCategories.slugBase, post.categorySlug)).limit(1)

    // Перевіряємо за перекладом (slug унікальний в межах locale)
    const [existingT] = await db.select().from(schema.blogPostTranslations)
      .where(and(
        eq(schema.blogPostTranslations.slug, post.slug),
        eq(schema.blogPostTranslations.locale, 'ru'),
      )).limit(1)

    if (!existingT) {
      const postId = uuid()
      await db.insert(schema.blogPosts).values({
        id: postId, categoryId: catRow?.id ?? null,
        status: 'PUBLISHED', readingMinutes: post.readingTime,
        publishedAt: new Date(post.datePublished), createdAt: now, updatedAt: now,
      })
      await db.insert(schema.blogPostTranslations).values({
        id: uuid(), postId, locale: 'ru', slug: post.slug,
        title: post.title, excerpt: post.description,
        contentHtml: post.body ?? null, contentJson: null,
      })
      console.log(`[Seed] Створено статтю: ${post.slug}`)
    }
  }

  /* 5. FAQ */
  for (let i = 0; i < ru.faqData.length; i++) {
    const ruFaq = ru.faqData[i]
    if (!ruFaq) continue

    const [existing] = await db.select().from(schema.faqItemTranslations)
      .where(eq(schema.faqItemTranslations.question, ruFaq.question as string)).limit(1)
    if (existing) continue

    const faqId = uuid()
    await db.insert(schema.faqItems).values({ id: faqId, group: 'GENERAL', status: 'PUBLISHED', sortOrder: (i + 1) * 10 })
    await db.insert(schema.faqItemTranslations).values({ id: uuid(), faqItemId: faqId, locale: 'ru', question: ruFaq.question as string, answer: ruFaq.answer as string })

    const ukFaq = uk.faqData[i]
    if (ukFaq) {
      await db.insert(schema.faqItemTranslations).values({ id: uuid(), faqItemId: faqId, locale: 'uk', question: ukFaq.question as string, answer: ukFaq.answer as string })
    }
  }

  /* 6. Відгуки */
  for (let i = 0; i < ru.testimonialsItems.length; i++) {
    const t = ru.testimonialsItems[i]
    if (!t) continue

    const [existing] = await db.select().from(schema.testimonials)
      .where(eq(schema.testimonials.clientName, t.name as string)).limit(1)
    if (existing) continue

    const testimonialId = uuid()
    await db.insert(schema.testimonials).values({
      id: testimonialId, status: 'PUBLISHED', clientName: t.name as string,
      consentConfirmed: true, publishedAt: now, sortOrder: (i + 1) * 10, createdAt: now,
    })
    await db.insert(schema.testimonialTranslations).values({
      id: uuid(), testimonialId, locale: 'ru', text: t.text as string, result: (t.result as string) ?? null,
    })
  }

  /* 7. Статичні сторінки */
  for (const sp of STATIC_PAGES) {
    const pageType = PAGE_TYPE_MAP[sp.slug]
    if (!pageType) continue

    const [existing] = await db.select().from(schema.pages).where(eq(schema.pages.type, pageType)).limit(1)
    if (existing) continue

    await db.insert(schema.pages).values({
      id: uuid(), type: pageType, status: 'PUBLISHED',
      sortOrder: Math.round(sp.priority * 10), publishedAt: now,
      createdAt: now, updatedAt: now,
    })
  }

  /* 8. Навігація (HEADER + FOOTER + MOBILE) */
  const existingNav = await db.select().from(schema.navigationItems).limit(1)
  if (existingNav.length === 0 && MAIN_NAV.length > 0) {
    // ── HEADER (основне меню) ──
    for (const [idx, item] of MAIN_NAV.entries()) {
      const navId = uuid()
      await db.insert(schema.navigationItems).values({
        id: navId, location: 'HEADER', href: item.href,
        labelRu: item.label, labelUk: item.label,
        isEnabled: true, sortOrder: idx * 10,
      })
      if (item.children) {
        for (const [cidx, child] of item.children.entries()) {
          await db.insert(schema.navigationItems).values({
            id: uuid(), location: 'HEADER', parentId: navId, href: child.href,
            labelRu: child.label, labelUk: child.label,
            isEnabled: true, sortOrder: cidx * 10,
          })
        }
      }
    }

    // ── FOOTER (скорочене меню: послуги, блог, контакти, юридичне) ──
    const footerItems = [
      { label: 'Услуги', href: '/uslugi/' },
      { label: 'Блог', href: '/blog/' },
      { label: 'Контакты', href: '/kontakty/' },
      { label: 'Политика конфиденциальности', href: '/politika-konfidentsialnosti/' },
      { label: 'Дисклеймер', href: '/disclaimer/' },
    ]
    for (const [idx, item] of footerItems.entries()) {
      await db.insert(schema.navigationItems).values({
        id: uuid(), location: 'FOOTER', href: item.href,
        labelRu: item.label, labelUk: item.label,
        isEnabled: true, sortOrder: idx * 10,
      })
    }

    // ── MOBILE (повний список, плоский — без підменю) ──
    const flatItems: Array<{ label: string; href: string }> = []
    for (const item of MAIN_NAV) {
      flatItems.push({ label: item.label, href: item.href })
      if (item.children) {
        for (const child of item.children) {
          flatItems.push({ label: child.label, href: child.href })
        }
      }
    }
    for (const [idx, item] of flatItems.entries()) {
      await db.insert(schema.navigationItems).values({
        id: uuid(), location: 'MOBILE', href: item.href,
        labelRu: item.label, labelUk: item.label,
        isEnabled: true, sortOrder: idx * 10,
      })
    }

    console.log('[Seed] Створено навігацію: HEADER + FOOTER + MOBILE')
  }

  /* 9. Контактні канали */
  const existingCh = await db.select().from(schema.contactChannels).limit(1)
  if (existingCh.length === 0) {
    await db.insert(schema.contactChannels).values([
      { id: uuid(), type: 'TELEGRAM', label: 'Telegram', value: '@SLAVKA_VIP', url: 'https://t.me/SLAVKA_VIP', isPrimary: true, isEnabled: true, sortOrder: 10 },
      { id: uuid(), type: 'WHATSAPP', label: 'WhatsApp', value: '+380663122069', url: 'https://wa.me/380663122069', isPrimary: false, isEnabled: true, sortOrder: 20 },
      { id: uuid(), type: 'EMAIL', label: 'Email', value: 'podvarchan@gmail.com', url: 'mailto:podvarchan@gmail.com', isPrimary: true, isEnabled: true, sortOrder: 30 },
    ])
    console.log('[Seed] Створено контактні канали')
  }

  /* 10. Налаштування сайту */
  const siteInfo: Record<string, unknown> = {
    siteName: SITE.name, siteFullName: SITE.fullName, siteUrl: SITE.url,
    defaultLocale: 'ru', localeRu: 'ru_RU', localeUk: 'uk_UA',
    defaultOgImage: SITE.defaultOgImage, themeColor: SITE.themeColor,
    authorName: AUTHOR.name, authorGivenName: AUTHOR.givenName,
    authorFamilyName: AUTHOR.familyName, authorJobTitle: AUTHOR.jobTitle,
    authorDescription: AUTHOR.description, authorImage: AUTHOR.image,
  }

  for (const [key, value] of Object.entries(siteInfo)) {
    const [existing] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, key)).limit(1)
    if (!existing) {
      await db.insert(schema.siteSettings).values({ key, valueJson: JSON.stringify(value), updatedAt: now })
    }
  }

  /* 11. Секції головної сторінки (PageSection для HOME) */
  const [homePage] = await db.select().from(schema.pages).where(eq(schema.pages.type, 'HOME')).limit(1)
  if (homePage) {
    const existingSection = await db.select().from(schema.pageSections).where(eq(schema.pageSections.pageId, homePage.id)).limit(1)
    if (existingSection.length === 0) {
      const sections = [
        { key: 'hero', type: 'hero' },
        { key: 'problems', type: 'problems' },
        { key: 'method', type: 'method' },
        { key: 'services', type: 'services' },
        { key: 'author', type: 'author' },
        { key: 'testimonials', type: 'testimonials' },
        { key: 'faq', type: 'faq' },
        { key: 'finalCta', type: 'final_cta' },
      ]

      for (const [idx, section] of sections.entries()) {
        await db.insert(schema.pageSections).values({
          id: uuid(),
          pageId: homePage.id,
          key: section.key,
          type: section.type,
          enabled: true,
          sortOrder: (idx + 1) * 10,
          settingsJson: JSON.stringify({ background: 'default', alignment: 'center', itemCount: 6, showCta: true }),
        })
      }
      console.log('[Seed] Створено секції головної сторінки')
    }
  }

  /* ── ЗВІТ ── */
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.users)
  const [serviceCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.services)
  const [serviceTrCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.serviceTranslations)
  const [blogPostCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.blogPosts)
  const [blogPostTrCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.blogPostTranslations)
  const [faqCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.faqItemTranslations)
  const [testimonialCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.testimonials)
  const [pageCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.pages)
  const [sectionCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.pageSections)
  const [navCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.navigationItems)
  const [channelCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.contactChannels)
  const [settingCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.siteSettings)

  console.log('')
  console.log('═══════════════════════════════════════')
  console.log('📊  ЗВІТ ПРО ЗАЛИВАННЯ ДАНИХ')
  console.log('═══════════════════════════════════════')
  console.log(`  👤  Користувачів:          ${userCount.count}`)
  console.log(`  🛠️  Послуг:                ${serviceCount.count}`)
  console.log(`  🌐  Перекладів послуг:     ${serviceTrCount.count}`)
  console.log(`  📝  Статей блогу:          ${blogPostCount.count}`)
  console.log(`  🌐  Перекладів статей:     ${blogPostTrCount.count}`)
  console.log(`  ❓  FAQ перекладів:        ${faqCount.count}`)
  console.log(`  ⭐  Відгуків:              ${testimonialCount.count}`)
  console.log(`  📄  Сторінок:              ${pageCount.count}`)
  console.log(`  🧩  Секцій сторінок:       ${sectionCount.count}`)
  console.log(`  🧭  Пунктів навігації:     ${navCount.count}`)
  console.log(`  📞  Контактних каналів:    ${channelCount.count}`)
  console.log(`  ⚙️  Налаштувань:           ${settingCount.count}`)
  console.log('═══════════════════════════════════════')
  console.log(`✅ Заливання даних завершено успішно!`)
}

/* ── CLI entry point ── */

async function main(): Promise<void> {
  const binding = (process.env as Record<string, unknown>).DB as D1Database | undefined
  if (!binding) {
    console.error('[Seed] D1 binding не знайдено. Запустіть через wrangler.')
    process.exit(1)
  }
  await seedDatabase(binding)
}

main().catch((err: unknown) => {
  console.error('[Seed] Помилка:', err)
  process.exit(1)
})
