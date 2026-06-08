/**
 * NextAuth API Route Handler.
 *
 * ВАЖНО: Використовує getAuthHandler() замість прямого імпорту { handlers }
 * та деструктуризації на рівні модуля. Це необхідно, щоб NextAuth
 * ініціалізувався ліниво — тільки при першому запиті, а не під час
 * `next build` (коли Cloudflare Worker контекст недоступний).
 *
 * У NextAuth v4, NextAuth(config) повертає функцію (req, context) => Promise<Response>.
 * Для App Router передаємо context з params.nextauth (catch-all сегмент).
 */

import { getAuthHandler } from '@/auth'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> }
): Promise<Response> {
  const handler = getAuthHandler()
  return await handler(request, { params: await params })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> }
): Promise<Response> {
  const handler = getAuthHandler()
  return await handler(request, { params: await params })
}
