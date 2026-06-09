'use server'

/**
 * Server Actions для модуля «Медиа».
 *
 * ⚠️  ВАЖЛИВО: Cloudflare Workers runtime
 * Поточне локальне зберігання файлів (fs/path) НЕ ПРАЦЮЄ на Cloudflare Workers.
 * Для production потрібна міграція на R2:
 *   https://developers.cloudflare.com/r2/
 *
 * TODO: Замінити saveFileLocally/deleteFileLocally на R2 API.
 * Послідовність міграції:
 *   1. Створити R2 bucket podvarchan-media
 *   2. Додати binding в wrangler.jsonc
 *   3. Замінити saveFileLocally на env.MEDIA_BUCKET.put()
 *   4. Замінити deleteFileLocally на env.MEDIA_BUCKET.delete()
 *
 * Наразі використовується динамічний імпорт (await import('node:path'),
 * await import('node:fs/promises')), щоб модуль не падав при статичному
 * завантаженні в Workers runtime.
 */

import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getActionDb } from './db'
import { ok, okVoid, fail } from './result'
import { withRole, withCanDelete } from './guard'
import * as s from '@/db/schema'
import { writeAuditLog } from '@/lib/audit/log'

/* ── Upload helpers ── */

/**
 * Тимчасове зберігання файлу локально (public/uploads/).
 * Використовує динамічний імпорт fs/path для сумісності з Workers.
 * При появі R2 binding — замінити на env.MEDIA_BUCKET.put().
 */
async function saveFileLocally(
  file: File,
): Promise<{ storageKey: string; publicUrl: string; size: number; originalName: string; fileName: string }> {
  const path = await import('node:path')
  const fs = await import('node:fs/promises')

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = path.extname(file.name) || '.bin'
  const baseName = path.basename(file.name, ext)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const now = new Date()
  const year = now.getFullYear().toString()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const uuid = crypto.randomUUID()
  const fileName = `${baseName}-${uuid.slice(0, 8)}${ext}`
  const storageKey = `${year}/${month}/${fileName}`
  const relativeDir = `uploads/${year}/${month}`
  const absoluteDir = path.join(process.cwd(), 'public', relativeDir)

  await fs.mkdir(absoluteDir, { recursive: true })
  await fs.writeFile(path.join(absoluteDir, fileName), buffer)

  const publicUrl = `/uploads/${storageKey}`

  return { storageKey, publicUrl, size: buffer.length, originalName: file.name, fileName }
}

/**
 * Видалення локального файлу.
 */
async function deleteFileLocally(storageKey: string): Promise<void> {
  try {
    const path = await import('node:path')
    const fs = await import('node:fs/promises')
    const filePath = path.join(process.cwd(), 'public', 'uploads', storageKey)
    await fs.unlink(filePath)
  } catch {
    // Файл може вже не існувати, або ми на Workers — ігноруємо
  }
}

/* ── Actions ── */

export async function getMediaAssets() {
  try {
    const db = getActionDb()
    const items = await db.select().from(s.mediaAssets).orderBy(desc(s.mediaAssets.createdAt))
    return ok(items)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити медіафайли')
  }
}

export async function getMediaAsset(id: string) {
  try {
    const db = getActionDb()
    const [item] = await db.select().from(s.mediaAssets).where(eq(s.mediaAssets.id, id)).limit(1)
    if (!item) return fail('Файл не знайдено')
    return ok(item)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити файл')
  }
}

export const updateMediaMeta = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const data = (args[1] ?? {}) as Record<string, string | undefined>
    const [existing] = await db.select().from(s.mediaAssets).where(eq(s.mediaAssets.id, id)).limit(1)
    if (!existing) return fail('Файл не знайдено')

    await db.update(s.mediaAssets).set(data).where(eq(s.mediaAssets.id, id))
    revalidatePath('/admin/media')
    return okVoid('Метадані оновлено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося оновити метадані')
  }
})

export const deleteMediaAsset = withCanDelete(async (session, ...args) => {
  try {
    const db = getActionDb()
    const id = args[0] as string
    const [existing] = await db.select().from(s.mediaAssets).where(eq(s.mediaAssets.id, id)).limit(1)
    if (!existing) return fail('Файл не знайдено')

    // Видаляємо фізичний файл (локально або ігноруємо помилку на Workers)
    await deleteFileLocally(existing.storageKey)

    await db.delete(s.mediaAssets).where(eq(s.mediaAssets.id, id))
    await writeAuditLog({ userId: session.user.id, action: 'DELETE', entityType: 'MEDIA', entityId: id })
    revalidatePath('/admin/media')
    return okVoid('Файл видалено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося видалити файл')
  }
})

/* ── Upload ── */

export const uploadMediaAsset = withRole('EDITOR', async (session, ...args) => {
  try {
    const db = getActionDb()
    const file = args[0] as File

    if (!file || !(file instanceof File)) {
      return fail('Файл не передано')
    }

    // Валідація розміру (max 20 MB)
    const MAX_SIZE = 20 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return fail('Файл занадто великий. Максимальний розмір — 20 MB')
    }

    // Валідація типу
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf', 'application/json']
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      return fail('Недопустимий тип файлу')
    }

    // Зберігаємо файл
    const saved = await saveFileLocally(file)

    // Визначаємо розміри для зображень
    let width: number | null = null
    let height: number | null = null
    if (file.type.startsWith('image/')) {
      try {
        const dimensions = await getImageDimensions(saved.publicUrl)
        width = dimensions.width
        height = dimensions.height
      } catch {
        // Не вдалося визначити розміри — ігноруємо
      }
    }

    // Створюємо запис в БД
    const id = crypto.randomUUID()
    await db.insert(s.mediaAssets).values({
      id,
      fileName: saved.fileName,
      originalName: saved.originalName,
      mimeType: file.type,
      size: saved.size,
      width,
      height,
      storageKey: saved.storageKey,
      publicUrl: saved.publicUrl,
      uploadedById: session.user.id,
    })

    await writeAuditLog({ userId: session.user.id, action: 'UPLOAD', entityType: 'MEDIA', entityId: id })
    revalidatePath('/admin/media')

    const [created] = await db.select().from(s.mediaAssets).where(eq(s.mediaAssets.id, id)).limit(1)
    return ok(created, 'Файл завантажено')
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Не вдалося завантажити файл')
  }
})

/* ── Image dimensions helper ── */

async function getImageDimensions(publicUrl: string): Promise<{ width: number; height: number }> {
  const path = await import('node:path')
  const fs = await import('node:fs/promises')

  const absolutePath = path.join(process.cwd(), 'public', publicUrl)
  const buffer = await fs.readFile(absolutePath)

  // Read a generous header for JPEG scanning (SOF markers can be deep)
  const maxHeaderBytes = Math.min(buffer.length, 65536)
  const header = buffer.subarray(0, maxHeaderBytes)

  // JPEG
  if (header[0] === 0xFF && header[1] === 0xD8) {
    let offset = 2
    while (offset < header.length - 8) {
      if (header[offset] === 0xFF) {
        const marker = header[offset + 1]
        if (marker === 0xC0 || marker === 0xC2) {
          return {
            height: header.readUInt16BE(offset + 5),
            width: header.readUInt16BE(offset + 7),
          }
        }
        offset += 2 + header.readUInt16BE(offset + 2)
        continue
      }
      offset++
    }
  }

  // PNG
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    }
  }

  // GIF
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
    return {
      width: header.readUInt16LE(6),
      height: header.readUInt16LE(8),
    }
  }

  // WEBP
  if (header.slice(0, 4).toString() === 'RIFF' && header.slice(8, 12).toString() === 'WEBP') {
    const vp8Id = header.slice(12, 15).toString()
    if (vp8Id === 'VP8 ') {
      // VP8 simple/lossy
      const raw = header.slice(20, 26)
      return {
        width: raw.readUInt16LE(0) & 0x3FFF,
        height: raw.readUInt16LE(2) & 0x3FFF,
      }
    }
    if (vp8Id === 'VP8L') {
      // VP8L lossless
      const raw = header.readUInt32LE(21)
      return {
        width: (raw & 0x3FFF) + 1,
        height: ((raw >> 14) & 0x3FFF) + 1,
      }
    }
  }

  throw new Error('Не вдалося визначити розміри зображення')
}
