import { ImageResponse } from 'next/og'
import { loadInterFonts, OGDecorations, OG_STYLES, SITE_URL_LABEL } from '@/lib/og/layout'

export const revalidate = 604800 // 7 days — locale pages rarely change

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Props {
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return [{ locale: 'ru' }, { locale: 'uk' }]
}

export default async function LocaleOGImage({ params }: Props) {
  const { locale } = await params
  const { regular, bold, all: fonts } = await loadInterFonts()
  const ff = regular ? 'Inter' : 'sans-serif'
  const ffBold = bold ? 'Inter' : 'sans-serif'

  const isUk = locale === 'uk'
  const title = isUk ? "В'ячеслав Подварчан" : 'Вячеслав Подварчан'
  const subtitle = isUk
    ? 'Сертифікований гіпнотерапевт онлайн. Робота з тривогою, підсвідомістю та самосаботажем.'
    : 'Сертифицированный гипнотерапевт онлайн. Работа с тревогой, подсознанием и самосаботажем.'
  const labelText = isUk ? 'Гіпнотерапія онлайн' : 'Гипнотерапия онлайн'

  const image = new ImageResponse(
    <div style={OG_STYLES.container}>
      <OGDecorations />

      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '32px', height: '2px', background: 'rgba(201,169,110,0.5)' }} />
          <span style={{ ...OG_STYLES.label(ff), fontSize: '14px', letterSpacing: '4px' }}>
            {labelText}
          </span>
        </div>

        <h1 style={{
          fontFamily: ffBold,
          fontSize: '64px',
          fontWeight: 700,
          color: '#F0EDE8',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <span>{title.split(' ')[0]}</span>
          <span>{title.split(' ').slice(1).join(' ') || ''}</span>
        </h1>

        <p style={{
          fontFamily: ff,
          fontSize: '22px',
          fontWeight: 400,
          color: 'rgba(240,237,232,0.6)',
          margin: '16px 0 0 0',
          lineHeight: 1.4,
          maxWidth: '550px',
        }}>
          {subtitle}
        </p>
      </div>

      <div style={OG_STYLES.urlLabel(ff)}>{SITE_URL_LABEL}</div>
    </div>,
    { width: 1200, height: 630, fonts: fonts.length > 0 ? fonts : undefined }
  )

  // Edge caching (Cloudflare Workers + standard CDN)
  image.headers.set('Cache-Control', 'public, max-age=604800, s-maxage=604800, immutable')

  return image
}
