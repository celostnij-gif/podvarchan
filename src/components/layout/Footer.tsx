import type { ReactNode } from 'react'
import { getTranslations, getMessages } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { SERVICES } from '@/constants'

/* ── External props types ── */

export interface FooterServiceItem {
  slug: string
  title: string
}

export interface FooterCategoryItem {
  slug: string
  name: string
}

/* ── Local type for blog category data from messages ── */
interface BlogCategoryMsg {
  slug: string
  name: string
}

/* ── Footer Column ── */

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary tracking-wider uppercase mb-4">{title}</h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-text-muted hover:text-gold transition-colors duration-200">
        {children}
      </Link>
    </li>
  )
}

/* ── Footer Component ── */

export default async function Footer({
  locale,
  services,
  blogCategories: propCategories,
}: {
  locale: string
  services?: FooterServiceItem[]
  blogCategories?: FooterCategoryItem[]
}) {
  const t = await getTranslations({ locale, namespace: 'common' })
  const t_services = await getTranslations({ locale, namespace: 'services' })
  const messages = await getMessages()

  // D1 data takes precedence, otherwise fall back to static data
  const displayServices = services ?? SERVICES.slice(0, 5).map(s => ({
    slug: s.slug,
    title: t_services(`${s.slug}.shortTitle` as `${string}.shortTitle`),
  }))
  const displayCategories = propCategories ?? ((messages?.blogCategories as BlogCategoryMsg[]) ?? [])

  return (
    <footer className="relative border-t border-border-base bg-bg-deep overflow-hidden" role="contentinfo">

      <div className="relative z-10 max-w-container mx-auto px-gutter py-12 md:py-16">

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex flex-col leading-tight group">
              <span className="text-lg font-display text-text-primary group-hover:text-gold transition-colors duration-300">
                {t('authorName')}
              </span>
              <span className="text-[11px] text-text-muted tracking-wider uppercase">{t('authorTitle')}</span>
            </Link>
            <p className="mt-4 text-sm text-text-muted leading-relaxed max-w-xs">{t('footerDescription')}</p>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://t.me/SLAVKA_VIP"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-full
                           bg-bg-surface border border-border-base text-text-muted
                           hover:text-gold hover:border-gold-muted hover:bg-bg-elevated
                           transition-all duration-200"
                aria-label="Telegram"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.127.087.507.087.507l-1.397 6.573c-.152.705-.585.772-.968.49l-2.898-2.091-1.265 1.214c-.206.203-.34.314-.518.314-.279 0-.267-.195-.186-.658l.99-4.325.003.001s2.908-2.66 2.989-2.76c.08-.1.041-.166-.08-.124-.192.066-3.742 2.322-3.974 2.465-.16.098-.28.135-.517.014l-2.532-.857c-.325-.12-.503-.19-.453-.4.035-.172.26-.344.723-.52L16.05 7.29c.257-.092.488-.094.584-.076z" />
                </svg>
              </a>
              <a
                href="https://wa.me/380663122069"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-full
                           bg-bg-surface border border-border-base text-text-muted
                           hover:text-gold hover:border-gold-muted hover:bg-bg-elevated
                           transition-all duration-200"
                aria-label="WhatsApp"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <a
                href="mailto:podvarchan@gmail.com"
                className="w-9 h-9 flex items-center justify-center rounded-full
                           bg-bg-surface border border-border-base text-text-muted
                           hover:text-gold hover:border-gold-muted hover:bg-bg-elevated
                           transition-all duration-200"
                aria-label="Email"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <FooterColumn title={t('footerServices')}>
            {displayServices.slice(0, 5).map((s) => (
              <FooterLink key={s.slug} href={`/uslugi/${s.slug}/`}>
                {s.title}
              </FooterLink>
            ))}
            <FooterLink href="/uslugi/">{t('footerAllServices')} <span aria-hidden="true">→</span></FooterLink>
          </FooterColumn>

          {/* Blog */}
          <FooterColumn title={t('footerBlog')}>
            {displayCategories.slice(0, 4).map((cat) => (
              <FooterLink key={cat.slug} href={`/blog/kategoriya/${cat.slug}/`}>
                {cat.name}
              </FooterLink>
            ))}
            <FooterLink href="/blog/">{t('footerAllArticles')} <span aria-hidden="true">→</span></FooterLink>
          </FooterColumn>

          {/* Contacts */}
          <FooterColumn title={t('footerContacts')}>
            <FooterLink href="/kontakty/">{t('cta.booking')}</FooterLink>
            <li>
              <a href="mailto:podvarchan@gmail.com"
                 className="text-sm text-text-muted hover:text-gold transition-colors duration-200">
                podvarchan@gmail.com
              </a>
            </li>
            <FooterLink href="/faq/">FAQ</FooterLink>
            <FooterLink href="/ob-avtore/">{t('nav.about')}</FooterLink>
            <FooterLink href="/metod/">{t('nav.method')}</FooterLink>
            <FooterLink href="/login/">{t('login')}</FooterLink>
          </FooterColumn>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border-base flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">© {new Date().getFullYear()} {t('copyright')}</p>
          <nav className="flex items-center gap-4" aria-label={t('aria.legal')}>
            <Link href="/politika-konfidentsialnosti/"
                  className="text-xs text-text-muted hover:text-gold transition-colors duration-200">
              {t('privacy')}
            </Link>
            <span className="text-xs text-border-light" aria-hidden="true">·</span>
            <Link href="/disclaimer/"
                  className="text-xs text-text-muted hover:text-gold transition-colors duration-200">
              {t('disclaimer')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
