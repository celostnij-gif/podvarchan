import { ImageResponse } from 'next/og'
import { getMessages } from 'next-intl/server'
import { loadInterFonts, OGDecorations, OG_STYLES, SITE_URL_LABEL } from '@/lib/og/layout'
import { SERVICES } from '@/constants'

export const revalidate = 604800 // 7 days — service pages rarely change

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface ServiceMsg {
  slug: string
  title: string
  description: string
}

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export default async function ServiceOGImage({ params }: Props) {
  const { locale, slug } = await params

  const messages = await getMessages({ locale })
  const servicesData = (messages.servicesData as ServiceMsg[]) ?? []
  const service = servicesData.find((s) => s.slug === slug)
  const constantService = SERVICES.find((s) => s.slug === slug)

  const { regular, bold, all: fonts } = await loadInterFonts()
  const ff = regular ? 'Inter' : 'sans-serif'
  const ffBold = bold ? 'Inter' : 'sans-serif'

  const isUk = locale === 'uk'
  const title = service?.title ?? (isUk ? 'Послуга' : 'Услуга')
  const description = service?.description ?? ''
  const icon = constantService?.icon ?? '✨'
  const labelText = isUk ? 'Послуга' : 'Услуга'

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
        {/* Метка + иконка */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <span style={{ fontSize: '32px', lineHeight: 1 }}>{icon}</span>
          <div style={{ width: '2px', height: '24px', background: 'rgba(201,169,110,0.3)' }} />
          <span style={OG_STYLES.label(bold ? 'Inter' : 'sans-serif')}>{labelText}</span>
        </div>

        {/* Заголовок */}
        <h1 style={{
          fontFamily: ffBold,
          fontSize: '52px',
          fontWeight: 700,
          color: '#F0EDE8',
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
          margin: 0,
          maxWidth: '850px',
        }}>
          {title}
        </h1>

        {/* Описание */}
        {description && (
          <p style={{
            fontFamily: ff,
            fontSize: '20px',
            fontWeight: 400,
            color: 'rgba(240,237,232,0.55)',
            margin: '16px 0 0 0',
            lineHeight: 1.4,
            maxWidth: '650px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {description}
          </p>
        )}
      </div>

      <div style={OG_STYLES.urlLabel(ff)}>{SITE_URL_LABEL}</div>
    </div>,
    { width: 1200, height: 630, fonts: fonts.length > 0 ? fonts : undefined }
  )

  // Edge caching (Cloudflare Workers + standard CDN)
  image.headers.set('Cache-Control', 'public, max-age=604800, s-maxage=604800, immutable')

  return image
}
