import { renderJsonLd } from '@/lib/schema'

/**
 * Server-side JSON-LD renderer (HP-1/HP-2 fix).
 *
 * Page-specific schemas are built in server components and rendered directly
 * into raw HTML — no client-side useEffect registration, so Google/AI
 * crawlers see the structured data without executing JavaScript.
 *
 * Escaping is handled by renderJsonLd (the single serializer, AGENTS.md §5).
 */
export function JsonLd({ schema }: { schema: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: renderJsonLd(schema) }} />
}
