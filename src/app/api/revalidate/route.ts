/**
 * On-demand Revalidation API Route.
 *
 * Використовується Cron Worker для ревалідації кешу Next.js.
 * Cron Worker не може викликати revalidatePath/revalidateTag напряму,
 * тому він робить HTTP POST на цей ендпоінт.
 *
 * POST /api/revalidate?secret=xxx&type=path&path=/ru/uslugi/
 * POST /api/revalidate?secret=xxx&type=tag&tag=blog
 * POST /api/revalidate?secret=xxx&type=both&path=/ru/uslugi/&tag=services
 *
 * Захист: secret збігається з env.REVALIDATE_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    // ── Перевірка secret ──
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const expectedSecret = process.env.REVALIDATE_SECRET

    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'REVALIDATE_SECRET не налаштовано' },
        { status: 500 },
      )
    }

    if (!secret || secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Невірний secret' },
        { status: 401 },
      )
    }

    // ── Параметри ревалідації ──
    const type = searchParams.get('type') ?? 'path'
    const path = searchParams.get('path')
    const tag = searchParams.get('tag')

    const revalidated: string[] = []

    if (type === 'path' || type === 'both') {
      if (path) {
        revalidatePath(path)
        revalidated.push(`path:${path}`)
      }
    }

    if (type === 'tag' || type === 'both') {
      if (tag) {
        revalidateTag(tag)
        revalidated.push(`tag:${tag}`)
      }
    }

    // Якщо не вказано конкретних параметрів — ревалідуємо всі основні шляхи
    if (revalidated.length === 0) {
      revalidatePath('/')
      revalidatePath('/ru')
      revalidatePath('/uk')
      revalidateTag('services')
      revalidateTag('blog')
      revalidateTag('pages')
      revalidated.push('paths:[/,/ru,/uk] tags:[services,blog,pages]')
    }

    return NextResponse.json({
      revalidated: true,
      timestamp: Date.now(),
      items: revalidated,
    })
  } catch (err) {
    console.error('[Revalidate] Помилка:', err)
    return NextResponse.json(
      { error: 'Помилка ревалідації' },
      { status: 500 },
    )
  }
}

/**
 * GET handler — підтримує GET для простоти з Cron Worker.
 */
export async function GET(request: NextRequest) {
  return POST(request)
}
