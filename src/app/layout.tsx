import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import { SITE } from '@/constants'
import Script from 'next/script'
import WebMCP from '@/components/WebMCP'
import './globals.css'

/* ── Fonts ── */

const cormorant = Cormorant_Garamond({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['cyrillic', 'latin'],
  variable: '--font-sans',
  display: 'swap',
})

/* ── Viewport ── */

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: SITE.themeColor,
}

/* ── Icons ── */

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  description: SITE.fullName,
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION ?? '',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
}

/* ── Root Layout ── */

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      className={`${cormorant.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Hero image is CSS background-driven, not the LCP element (H1 text is LCP) — only preload mobile variant */}
        <link rel="preload" as="image" href="/images/hero-bg-mobile.webp" media="(max-width: 768px)" fetchPriority="high" />
        {/* ── Critical inline CSS for above-the-fold content (FCP/LCP optimization) ── */}
        <style>{`
          :root {
            --color-bg-base: #0A0A12;
            --color-bg-deep: #050508;
            --color-gold: #C9A96E;
            --color-gold-light: #E3C47A;
            --color-gold-dark: #A8874A;
            --color-text-primary: #ECEBF2;
            --color-text-secondary: #B0AEBF;
            --color-text-muted: #7C7A8F;
            --color-border-base: #1E1E30;
            --color-border-light: #2A2A42;
            --color-green: #2D6A4F;
            --color-green-light: #40916C;
            --font-serif: 'Cormorant Garamond', Georgia, serif;
            --font-sans: 'Inter', system-ui, sans-serif;
            --container-max: 75rem;
            --gutter: 1.5rem;
          }
          html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
          body {
            margin: 0; background-color: #0A0A12; color: #ECEBF2;
            font-family: var(--font-sans); line-height: 1.75;
            overflow-x: hidden;
          }
          section[aria-label], .hero-section { min-height: 90vh; }
          @media (min-width: 768px) { section[aria-label] { min-height: 100vh; } }
        `}</style>
      <body
        className="bg-bg-base text-text-primary font-body antialiased flex flex-col min-h-screen"
        suppressHydrationWarning
      >
        <Script
          id="cleanup-extension-attributes"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  document.querySelectorAll('[bis_skin_checked]').forEach(function(el){
                    el.removeAttribute('bis_skin_checked');
                  });
                  new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var el = mutations[i].target;
                      if (el.removeAttribute) el.removeAttribute('bis_skin_checked');
                    }
                  }).observe(document.documentElement, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: ['bis_skin_checked']
                  });
                } catch(e) {}
              })();
            `,
          }}
        />
        <WebMCP />
        {children}
      </body>
    </html>
  )
}
