import { LLMS_CONTENT } from '@/lib/static/llms'

/** GET /llms.txt — AI/GEO readiness (AGENTS.md §6). Route, not static asset. */
export function GET() {
  return new Response(LLMS_CONTENT, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
