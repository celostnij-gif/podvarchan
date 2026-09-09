/**
 * Direct-answer block (AGENTS §6 GEO): server-rendered h2 + ≥35-word
 * paragraph so AI crawlers / AI Overviews get a BLUF answer in raw HTML.
 * Visible content — not a hidden SEO gimmick.
 */
interface GeoBlockProps {
  title: string
  text: string
}

export function GeoBlock({ title, text }: GeoBlockProps) {
  return (
    <section className="mt-16 border-t border-white/10 pt-10 pb-16">
      <div className="max-w-3xl mx-auto px-gutter">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-gold-light">{title}</h2>
        <p className="mt-4 text-base md:text-lg leading-relaxed text-text-secondary">{text}</p>
      </div>
    </section>
  )
}
