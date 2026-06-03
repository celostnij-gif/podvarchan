import { ImageResponse } from 'next/og'
import { loadInterFonts, OGDecorations, OG_STYLES, SITE_URL_LABEL } from '@/lib/og/layout'
import { getBlogPost } from '@/lib/content'

export const revalidate = 86400 // 24 hours — blog posts rarely change after publication

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export default async function BlogOGImage({ params }: Props) {
  const { locale, slug } = await params
  const post = getBlogPost(slug)
  const { regular, semiBold, bold, all: fonts } = await loadInterFonts()
  const ff = regular ? 'Inter' : 'sans-serif'
  const ffSemi = semiBold ? 'Inter' : 'sans-serif'
  const ffBold = bold ? 'Inter' : 'sans-serif'

  const isUk = locale === 'uk'
  const categoryLabel = post?.categoryName ?? ''
  const title = post?.title ?? (isUk ? 'Стаття' : 'Статья')
  const author = post?.author ?? 'Вячеслав Подварчан'
  const date = post?.datePublished
    ? new Date(post.datePublished).toLocaleDateString(isUk ? 'uk-UA' : 'ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  const image = new ImageResponse(
    <div style={OG_STYLES.container}>
      <OGDecorations />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: 1,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Категория */}
        {categoryLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={OG_STYLES.labelLine} />
            <span style={OG_STYLES.label(ffSemi)}>{categoryLabel}</span>
          </div>
        )}

        {/* Заголовок */}
        <h1 style={{
          fontFamily: ffBold,
          fontSize: '44px',
          fontWeight: 700,
          color: '#F0EDE8',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          margin: 0,
          maxWidth: '800px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}>
          {title}
        </h1>

        {/* Мета-информация */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '28px' }}>
          <span style={{
            fontFamily: ff,
            fontSize: '16px',
            fontWeight: 400,
            color: 'rgba(240,237,232,0.5)',
          }}>
            {author}
          </span>
          {date && (
            <>
              <div style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'rgba(240,237,232,0.25)',
              }} />
              <span style={{
                fontFamily: ff,
                fontSize: '16px',
                fontWeight: 400,
                color: 'rgba(240,237,232,0.5)',
              }}>
                {date}
              </span>
            </>
          )}
        </div>
      </div>

      <div style={OG_STYLES.urlLabel(ff)}>{SITE_URL_LABEL}</div>
    </div>,
    { width: 1200, height: 630, fonts: fonts.length > 0 ? fonts : undefined }
  )

  // Edge caching (Cloudflare Workers + standard CDN)
  image.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400')

  return image
}
