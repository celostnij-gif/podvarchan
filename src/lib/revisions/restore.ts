/**
 * Revision restore — відновлює сутність зі знімка ревізії.
 *
 * Процес:
 * 1. Завантажує dataJson з contentRevisions
 * 2. Визначає тип сутності (entityType)
 * 3. Оновлює відповідну Translation-таблицю
 * 4. Переводить статус у DRAFT (автоматично не публікує)
 * 5. Пише AuditLog
 */

import { and, eq } from 'drizzle-orm'
import { getActionDb } from '@/lib/actions/db'
import { writeAuditLog } from '@/lib/audit/log'
import { okVoid, fail, type ActionResult } from '@/lib/actions/result'
import * as s from '@/db/schema'

/**
 * Відновлює сутність з ревізії.
 * @param revisionId — id ревізії
 * @param userId — id користувача, який виконує відновлення
 * @returns ActionResult — успіх або помилка
 */
export async function restoreRevision(
  revisionId: string,
  userId: string,
): Promise<ActionResult<void>> {
  try {
    const db = getActionDb()

    // 1. Завантажуємо ревізію
    const [revision] = await db
      .select()
      .from(s.contentRevisions)
      .where(eq(s.contentRevisions.id, revisionId))
      .limit(1)

    if (!revision) {
      return fail('Ревізію не знайдено')
    }

    const data = JSON.parse(revision.dataJson) as Record<string, unknown>
    const { entityType, entityId, locale } = revision

    // 2. Відновлюємо залежно від типу сутності
    switch (entityType) {
      case 'SERVICE':
        await restoreServiceTranslation(db, entityId, locale, data)
        break
      case 'BLOG_POST':
        await restoreBlogPostTranslation(db, entityId, locale, data)
        break
      case 'PAGE':
        await restorePageTranslation(db, entityId, locale, data)
        break
      case 'FAQ_ITEM':
        await restoreFaqTranslation(db, entityId, locale, data)
        break
      case 'TESTIMONIAL':
        await restoreTestimonialTranslation(db, entityId, locale, data)
        break
      default:
        return fail(`Відновлення для типу «${entityType}» не підтримується`)
    }

    // 3. Пишемо AuditLog
    await writeAuditLog({
      userId,
      action: 'UPDATE',
      entityType: 'REVISION_RESTORE',
      entityId: entityId,
      after: { restoredFromRevision: revisionId, label: revision.label, entityType },
    })

    return okVoid('Сутність відновлено з ревізії. Статус переведено в DRAFT.')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося відновити ревізію')
  }
}

/* ── Restore helpers ── */

async function restoreServiceTranslation(
  db: ReturnType<typeof getActionDb>,
  entityId: string,
  locale: string | null,
  data: Record<string, unknown>,
): Promise<void> {
  // Оновлюємо serviceTranslation
  if (locale && (locale === 'ru' || locale === 'uk')) {
    await db
      .update(s.serviceTranslations)
      .set({
        title: (data.title as string) ?? '',
        slug: (data.slug as string) ?? '',
        shortTitle: (data.shortTitle as string) ?? null,
        description: (data.description as string) ?? null,
        heroTitle: (data.heroTitle as string) ?? null,
        heroSubtitle: (data.heroSubtitle as string) ?? null,
        symptomsJson: (data.symptomsJson as string) ?? null,
        processJson: (data.processJson as string) ?? null,
        benefitsJson: (data.benefitsJson as string) ?? null,
        faqJson: (data.faqJson as string) ?? null,
        ctaText: (data.ctaText as string) ?? null,
      })
      .where(
        and(
          eq(s.serviceTranslations.serviceId, entityId),
          eq(s.serviceTranslations.locale, locale as 'ru' | 'uk'),
        ),
      )
  }

  // Переводимо послугу в DRAFT
  await db
    .update(s.services)
    .set({ status: 'DRAFT' })
    .where(eq(s.services.id, entityId))
}

async function restoreBlogPostTranslation(
  db: ReturnType<typeof getActionDb>,
  entityId: string,
  locale: string | null,
  data: Record<string, unknown>,
): Promise<void> {
  if (locale && (locale === 'ru' || locale === 'uk')) {
    await db
      .update(s.blogPostTranslations)
      .set({
        title: (data.title as string) ?? '',
        slug: (data.slug as string) ?? '',
        excerpt: (data.excerpt as string) ?? null,
        contentJson: (data.contentJson as string) ?? null,
        contentHtml: (data.contentHtml as string) ?? null,
      })
      .where(
        and(
          eq(s.blogPostTranslations.postId, entityId),
          eq(s.blogPostTranslations.locale, locale as 'ru' | 'uk'),
        ),
      )
  }

  await db
    .update(s.blogPosts)
    .set({ status: 'DRAFT' })
    .where(eq(s.blogPosts.id, entityId))
}

async function restorePageTranslation(
  db: ReturnType<typeof getActionDb>,
  entityId: string,
  locale: string | null,
  data: Record<string, unknown>,
): Promise<void> {
  if (locale && (locale === 'ru' || locale === 'uk')) {
    await db
      .update(s.pageTranslations)
      .set({
        title: (data.title as string) ?? '',
        slug: (data.slug as string) ?? '',
        excerpt: (data.excerpt as string) ?? null,
        contentJson: (data.contentJson as string) ?? null,
      })
      .where(
        and(
          eq(s.pageTranslations.pageId, entityId),
          eq(s.pageTranslations.locale, locale as 'ru' | 'uk'),
        ),
      )
  }

  await db
    .update(s.pages)
    .set({ status: 'DRAFT' })
    .where(eq(s.pages.id, entityId))
}

async function restoreFaqTranslation(
  db: ReturnType<typeof getActionDb>,
  entityId: string,
  locale: string | null,
  data: Record<string, unknown>,
): Promise<void> {
  if (locale && (locale === 'ru' || locale === 'uk')) {
    await db
      .update(s.faqItemTranslations)
      .set({
        question: (data.question as string) ?? '',
        answer: (data.answer as string) ?? '',
      })
      .where(
        and(
          eq(s.faqItemTranslations.faqItemId, entityId),
          eq(s.faqItemTranslations.locale, locale as 'ru' | 'uk'),
        ),
      )
  }

  await db
    .update(s.faqItems)
    .set({ status: 'DRAFT' })
    .where(eq(s.faqItems.id, entityId))
}

async function restoreTestimonialTranslation(
  db: ReturnType<typeof getActionDb>,
  entityId: string,
  locale: string | null,
  data: Record<string, unknown>,
): Promise<void> {
  if (locale && (locale === 'ru' || locale === 'uk')) {
    await db
      .update(s.testimonialTranslations)
      .set({
        text: (data.text as string) ?? '',
        problem: (data.problem as string) ?? null,
        result: (data.result as string) ?? null,
      })
      .where(
        and(
          eq(s.testimonialTranslations.testimonialId, entityId),
          eq(s.testimonialTranslations.locale, locale as 'ru' | 'uk'),
        ),
      )
  }

  await db
    .update(s.testimonials)
    .set({ status: 'DRAFT' })
    .where(eq(s.testimonials.id, entityId))
}
