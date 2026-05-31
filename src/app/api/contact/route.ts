import { NextRequest, NextResponse } from 'next/server'
import { verifyTurnstileToken } from '@/lib/verifyTurnstile'
import { sendContactNotification, sendAutoReply } from '@/lib/email'
import type { SendContactEmailParams } from '@/lib/email'

/* ── Types ── */

interface ValidationError {
  field: string
  error: string
}

/* ── Rate limiting (in-memory) ── */

const RATE_LIMIT = new Map<string, { count: number; resetTime: number }>()
const MAX_REQUESTS = 3
const WINDOW_MS = 15 * 60 * 1000

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = RATE_LIMIT.get(ip)

  if (!entry || entry.resetTime < now) {
    RATE_LIMIT.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_REQUESTS) return false

  entry.count++
  return true
}

/* ── Validation ── */

function validate(body: unknown): { data?: SendContactEmailParams; errors?: ValidationError[] } {
  if (!body || typeof body !== 'object') {
    return { errors: [{ field: 'form', error: 'Некорректные данные формы.' }] }
  }

  const d = body as Record<string, unknown>
  const errors: ValidationError[] = []

  // name
  if (!d.name || typeof d.name !== 'string' || d.name.trim().length < 2 || d.name.length > 100) {
    errors.push({ field: 'name', error: 'Введите имя (минимум 2 символа).' })
  }

  // email
  if (!d.email || typeof d.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
    errors.push({ field: 'email', error: 'Введите корректный email.' })
  }

  // phone (optional)
  if (d.phone && typeof d.phone === 'string' && d.phone.trim().length > 0) {
    if (!/^[\d\s+\-()]+$/.test(d.phone.trim())) {
      errors.push({ field: 'phone', error: 'Введите корректный номер телефона.' })
    }
  }

  // message
  if (!d.message || typeof d.message !== 'string' || d.message.trim().length < 10 || d.message.length > 2000) {
    errors.push({ field: 'message', error: 'Введите сообщение (минимум 10 символов).' })
  }

  if (errors.length > 0) return { errors }

  const phone = typeof d.phone === 'string' ? d.phone.trim() : undefined

  return {
    data: {
      name: (d.name as string).trim(),
      email: (d.email as string).trim(),
      message: (d.message as string).trim(),
      ...(phone ? { phone } : {}),
    },
  }
}

/* ── Helpers ── */

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  return `${local[0]}***@${domain}`
}

/* ── POST handler ── */

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting ──
    const ip = getClientIp(request)
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Попробуйте позже.', field: 'form' },
        { status: 429 },
      )
    }

    // ── Parse ──
    const body: unknown = await request.json()

    // ── Validate ──
    const result = validate(body)
    if (result.errors) {
      return NextResponse.json(
        { error: result.errors[0].error, field: result.errors[0].field, errors: result.errors },
        { status: 400 },
      )
    }

    const { name, email, message, phone } = result.data!

    // ── Turnstile CAPTCHA (пропускаем на localhost — для разработки) ──
    const host = request.headers.get('host') ?? ''
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')

    if (!isLocalhost) {
      const turnstileToken = (body as Record<string, unknown>).turnstileToken as string | null | undefined
      const turnstileResult = await verifyTurnstileToken(turnstileToken, ip)

      if (!turnstileResult.success) {
        return NextResponse.json(
          { error: 'Подтвердите, что вы не робот.', field: 'form' },
          { status: 400 },
        )
      }
    }

    // ── Log ──
    console.log(`[Contact API] ${new Date().toISOString()} | ${name} | ${maskEmail(email)}`)

    // ── В dev-режиме — если нет API ключа, только логируем ──
    if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
      console.log('[Contact API] Dev mode — RESEND_API_KEY not set, logging instead of sending email.')
      console.log('[Contact API] Form data:', { name, email, message, phone })
      return NextResponse.json(
        { success: true, message: 'Заявка отправлена! (dev mode)' },
        { status: 200 },
      )
    }

    // ── Send notification to owner ──
    const notificationResult = await sendContactNotification({ name, email, message, phone })

    if (!notificationResult.success) {
      console.error('[Contact API] Notification send failed:', notificationResult.error)
      return NextResponse.json(
        { error: 'Не удалось отправить сообщение. Попробуйте позже или напишите в Telegram.', field: 'form' },
        { status: 500 },
      )
    }

    // ── Send auto-reply to client (non-critical — если упадёт, всё равно вернём 200) ──
    const autoReplyResult = await sendAutoReply({ name, email, message })

    if (!autoReplyResult.success) {
      console.warn('[Contact API] Auto-reply failed (non-critical):', autoReplyResult.error)
    }

    return NextResponse.json(
      { success: true, message: 'Заявка отправлена! Я отвечу вам в ближайшее время.' },
      { status: 200 },
    )
  } catch (err) {
    console.error('[Contact API] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Произошла ошибка. Попробуйте позже или напишите в Telegram.', field: 'form' },
      { status: 500 },
    )
  }
}
