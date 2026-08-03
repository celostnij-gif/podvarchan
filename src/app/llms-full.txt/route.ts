import { LLMS_FULL_CONTENT } from '@/lib/static/llms'

/** GET /llms-full.txt — AI/GEO readiness (AGENTS.md §6). Route, not static asset. */
export function GET() {
  return new Response(LLMS_FULL_CONTENT, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
