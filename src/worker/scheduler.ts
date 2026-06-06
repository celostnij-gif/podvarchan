/**
 * Cloudflare Cron Worker -- scheduled content publishing.
 *
 * Runs every 5 minutes (cron expression).
 *
 * 1. Finds blogPosts with status=SCHEDULED and scheduledAt <= now()
 * 2. Publishes them (status->PUBLISHED, publishedAt=now())
 * 3. Finds services with status=SCHEDULED and scheduledAt <= now()
 * 4. Publishes them (status->PUBLISHED, publishedAt=now())
 * 5. Calls /api/revalidate?secret=... to invalidate the cache
 *
 * NOTE: This is a separate Cloudflare Worker. It does NOT call
 * revalidatePath directly - it makes an HTTP POST to /api/revalidate
 * (which belongs to the Next.js app).
 */

import { drizzle } from 'drizzle-orm/d1'
import * as s from '../db/schema'
import { eq, and, lte } from 'drizzle-orm'

interface Env {
  DB: D1Database
  REVALIDATE_SECRET: string
  REVALIDATE_URL: string
}

const scheduler = {
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log('[Scheduler] Starting (cron: ' + event.cron + ')')

    const db = drizzle(env.DB, { schema: s })
    const now = new Date()

    try {
      // 1. Publish scheduled blog posts
      const scheduledPosts = await db
        .select()
        .from(s.blogPosts)
        .where(
          and(
            eq(s.blogPosts.status, 'SCHEDULED'),
            lte(s.blogPosts.scheduledAt, now),
          ),
        )

      if (scheduledPosts.length > 0) {
        console.log('[Scheduler] Publishing ' + scheduledPosts.length + ' posts')

        for (const post of scheduledPosts) {
          await db
            .update(s.blogPosts)
            .set({ status: 'PUBLISHED', publishedAt: now })
            .where(eq(s.blogPosts.id, post.id))

          await db.insert(s.auditLogs).values({
            id: crypto.randomUUID(),
            userId: post.authorId ?? 'scheduler',
            action: 'PUBLISH',
            entityType: 'BLOG_POST',
            entityId: post.id,
            createdAt: now,
          })
        }
      } else {
        console.log('[Scheduler] No scheduled posts found')
      }

      // 2. Publish scheduled services
      const scheduledServices = await db
        .select()
        .from(s.services)
        .where(
          and(
            eq(s.services.status, 'SCHEDULED'),
            lte(s.services.scheduledAt, now),
          ),
        )

      if (scheduledServices.length > 0) {
        console.log('[Scheduler] Publishing ' + scheduledServices.length + ' services')

        for (const service of scheduledServices) {
          await db
            .update(s.services)
            .set({ status: 'PUBLISHED', publishedAt: now })
            .where(eq(s.services.id, service.id))

          await db.insert(s.auditLogs).values({
            id: crypto.randomUUID(),
            userId: 'scheduler',
            action: 'PUBLISH',
            entityType: 'SERVICE',
            entityId: service.id,
            createdAt: now,
          })
        }
      } else {
        console.log('[Scheduler] No scheduled services found')
      }

      // 3. Revalidate cache via HTTP POST
      if (scheduledPosts.length > 0 || scheduledServices.length > 0) {
        const revalidateUrl = env.REVALIDATE_URL
        const secret = env.REVALIDATE_SECRET

        if (revalidateUrl && secret) {
          const url = revalidateUrl + '?secret=' + secret + '&type=both&path=/&tag=all'
          console.log('[Scheduler] Revalidating: ' + url)

          const response = await fetch(url, { method: 'POST' })
          const result = await response.json()
          console.log('[Scheduler] Revalidate result:', result)
        } else {
          console.warn('[Scheduler] REVALIDATE_URL or REVALIDATE_SECRET not configured')
        }
      }

      console.log('[Scheduler] Completed successfully')
    } catch (err) {
      console.error('[Scheduler] Error:', err)
    }
  },
}

export default scheduler
