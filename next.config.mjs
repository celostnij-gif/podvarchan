import createNextIntlPlugin from 'next-intl/plugin'


const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },


  /** Image optimization */
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
  },

  /** Security headers */
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        /* AI/GEO readiness — AGENTS.md §6: keep the exact value */
        { key: 'Content-Signal', value: 'ai-train=yes, search=yes, ai-input=yes' },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://challenges.cloudflare.com https://static.cloudflareinsights.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https://www.google-analytics.com",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.google.com https://www.gstatic.com https://challenges.cloudflare.com",
            "frame-src https://www.google.com https://challenges.cloudflare.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; '),
        },
        {
          key: 'Permissions-Policy',
          value: [
            'camera=()',
            'microphone=()',
            'geolocation=()',
            'interest-cohort=()',
          ].join(', '),
        },
      ],
    },
    {
      source: '/images/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/_next/static/media/(.*)',
      headers: [
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      ],
    },
    {
      source: '/fonts/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    /* ── CDN cache for HTML pages (AGENTS.md §3 matrix) ── */
    /* Middleware Cache-Control doesn't propagate to page responses in Cloudflare Workers */
    /* Order matters: later rules override earlier ones for the same header key. */
    /* SOURCE OF TRUTH: src/lib/cache/cache-control-matrix.ts — next.config.mjs
       cannot import TypeScript; keep these values in sync manually. */

    /* Home / Services / FAQ / About / Method / Pricing / Contacts / Privacy / Disclaimer */
    {
      source: '/:locale(ru|uk)/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=604800, stale-while-revalidate=2592000, stale-if-error=604800',
        },
      ],
    },
    /* Blog (list/post/category) — fresher than evergreen pages */
    {
      source: '/:locale(ru|uk)/blog/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800',
        },
      ],
    },
    /* sitemap / robots / llms — short edge TTL (freshness matters for crawlers) */
    {
      source: '/sitemap.xml',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=604800',
        },
      ],
    },
    {
      source: '/robots.txt',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=604800',
        },
      ],
    },
    {
      source: '/llms.txt',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=604800',
        },
      ],
    },
    {
      source: '/llms-full.txt',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=604800',
        },
      ],
    },
    /* Preview — never cache at the edge (draft content must be fresh) */
    {
      source: '/api/preview/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
      ],
    },
  ],

  /** Redirects */
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
