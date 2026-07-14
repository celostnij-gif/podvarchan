import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { SITE } from '@/constants'
import { personSchema, practiceSchema } from '@/lib/schema'
import { buildCanonical } from '@/lib/seo/metadata'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

import { getCloudflareContext } from '@opennextjs/cloudflare'

const GoogleAnalytics = dynamic(() => import('@/components/GoogleAnalytics'))
const CookieBanner = dynamic(() => import('@/components/CookieBanner'))
const MobileStickyCTA = dynamic(() => import('@/components/layout/MobileStickyCTA'))
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
      images: [
        {
          url: `${SITE.url}${SITE.defaultOgImage}`,
          width: 1200,
          height: 630,
          alt: t('siteTitle'),
        },
      ],
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

  // GA ID із Cloudflare Worker env (Server Component runtime)
  // try/catch для безпеки при статичній генерації (build time)
  let gaId: string | undefined
  try {
    const { env } = getCloudflareContext()
    gaId = env.NEXT_PUBLIC_GA_ID as string | undefined
  } catch {
    gaId = process.env.NEXT_PUBLIC_GA_ID
  }

  /* ── JSON-LD Schema ── */
  const jsonLdSchemas = [
    personSchema({ jobTitle: t('authorTitle'), locale }),
    practiceSchema(locale),
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
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${SITE.url}/#breadcrumb`,
      itemListElement: [{
        '@type': 'ListItem',
        position: 1,
        name: t('siteName'),
        url: `${SITE.url}/${locale}/`,
      }],
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
        {t('skipToContent')}
      </a>

      <ScrollProgress />

      <DeviceProvider>
        <ToastProvider>
          <Header />

          <main id="main-content" className="flex-1 min-h-[calc(100vh-4rem)]">
            <BreadcrumbsProvider>
              <PageSchemaRenderer />
              {children}
            </BreadcrumbsProvider>
          </main>
        </ToastProvider>

        <Footer locale={locale} />
      </DeviceProvider>

      <GoogleAnalytics gaId={gaId} />
      <CookieBanner />
      <MobileStickyCTA />

    </NextIntlClientProvider>
  )
}
