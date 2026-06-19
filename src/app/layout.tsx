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
      <body
        className="bg-bg-base text-text-primary font-body antialiased flex flex-col min-h-screen"
        suppressHydrationWarning
      >
        <Script
          id="cleanup-extension-attributes"
          strategy="beforeInteractive"
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
