import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { SITE } from '@/constants'
import { personSchema, medicalBusinessSchema } from '@/lib/schema'
import { buildCanonical } from '@/lib/seo/metadata'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import type { FooterServiceItem, FooterCategoryItem } from '@/components/layout/Footer'
import { getPublishedNavigation, getPublishedServices, getPublishedBlogCategories } from '@/lib/content'

import GoogleAnalytics from '@/components/GoogleAnalytics'
import CookieBanner from '@/components/CookieBanner'
import { ToastProvider } from '@/components/Toast'
import ScrollProgress from '@/components/ui/ScrollProgress'

import { routing } from '@/i18n/routing'
import { DeviceProvider } from '@/providers/DeviceProvider'
import { BreadcrumbsProvider } from '@/providers/BreadcrumbsProvider'
import { PageSchemaRenderer } from './schema-and-breadcrumbs'

/* ── Generate static params for locales ── */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/* ── Metadata ── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })

  return {
    title: {
      default: t('siteTitle'),
      template: `%s | ${t('siteTitle')}`,
    },
    description: t('siteDescription'),
    metadataBase: new URL(SITE.url),
    alternates: {
      canonical: buildCanonical('/', locale),
      languages: {
        ru: `${SITE.url}/ru`,
        uk: `${SITE.url}/uk`,
        'x-default': `${SITE.url}/ru`,
      },
    },
    openGraph: {
      title: t('siteTitle'),
      description: t('siteDescription'),
      url: SITE.url,
      siteName: SITE.fullName,
      locale: locale === 'uk' ? 'uk_UA' : 'ru_RU',
      type: 'website',
    },
  }
}

/* ── Locale Layout ── */



export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()
  const t = await getTranslations({ locale, namespace: 'common' })

  /* ── D1 navigation & footer data ── */
  const [d1Nav, d1Services, d1Categories] = await Promise.all([
    getPublishedNavigation('HEADER', locale),
    getPublishedServices(locale),
    getPublishedBlogCategories(locale),
  ])

  const navItems = d1Nav.length > 0
    ? d1Nav.map(n => ({
        label: n.label,
        href: n.href,
        children: n.children.map(c => ({ label: c.label, href: c.href })),
      }))
    : undefined

  const footerServices: FooterServiceItem[] | undefined = d1Services.length > 0
    ? d1Services.map(s => ({ slug: s.slugBase, title: s.translation.shortTitle ?? s.translation.title }))
    : undefined

  const footerCategories: FooterCategoryItem[] | undefined = d1Categories.length > 0
    ? d1Categories.map(c => ({ slug: c.translation.slug, name: c.translation.name }))
    : undefined

  /* ── JSON-LD Schema ── */
  const jsonLdSchemas = [
    personSchema({ jobTitle: t('authorTitle') }),
    medicalBusinessSchema(),
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.fullName,
      description: SITE.fullName,
      publisher: {
        '@type': 'Person',
        '@id': `${SITE.url}/ob-avtore/#person`,
      },
    },
  ]

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* JSON-LD Schema */}
      {jsonLdSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Skip-to-content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4
                   focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg
                   focus:bg-gold focus:text-bg-deep focus:outline-none
                   focus:text-sm focus:font-medium"
      >
        Перейти до змісту / Перейти к содержанию
      </a>

      <ScrollProgress />

      <DeviceProvider>
        <ToastProvider>
          <Header navItems={navItems} />

          <main id="main-content" className="flex-1">
            <BreadcrumbsProvider>
              <PageSchemaRenderer />
              {children}
            </BreadcrumbsProvider>
          </main>
        </ToastProvider>

        <Footer locale={locale} services={footerServices} blogCategories={footerCategories} />
      </DeviceProvider>

      <GoogleAnalytics />
      <CookieBanner />
    </NextIntlClientProvider>
  )
}
