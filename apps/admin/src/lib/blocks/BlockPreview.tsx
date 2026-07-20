'use client'

import { getBlockDefinition } from './registry'
import type { FieldDefinition } from './types'

interface BlockPreviewProps {
  sectionType: string
  content: Record<string, unknown>
  locale: 'ru' | 'uk'
}

/**
 * BlockPreview — renders a live preview of how the block will look on the public site.
 *
 * Each block type has its own render function that produces HTML/CSS
 * mimicking the site's Tailwind-based styling.
 */
export function BlockPreview({ sectionType, content, locale }: BlockPreviewProps) {
  const def = getBlockDefinition(sectionType)

  // Try dedicated preview, fall back to generic JSON display
  const preview = renderBlockPreview(sectionType, content, locale)

  return (
    <div className="block-preview bg-zinc-800/50 text-zinc-200 rounded-lg overflow-hidden shadow-sm">
      {/* Preview toolbar */}
      <div className="flex items-center gap-2 border-b border-zinc-700 bg-zinc-800/50 px-3 py-1.5">
        <span className="text-xs text-zinc-500 font-mono">{sectionType}</span>
        <span className="text-xs text-zinc-600">•</span>
        <span className="text-xs text-zinc-500">{def?.label ?? sectionType}</span>
        <div className="flex-1" />
        <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500 font-mono">
          {locale === 'ru' ? 'RU' : 'UK'}
        </span>
      </div>

      {/* Preview content */}
      <div className="p-2">
        {preview || (
          <div className="flex items-center justify-center h-24 text-sm text-zinc-500">
            {locale === 'uk' ? 'Немає даних для попереднього перегляду' : 'Нет данных для предпросмотра'}
          </div>
        )}
      </div>

      {/* Block dimensions info */}
      {(preview as React.ReactElement | null) && (
        <div className="border-t border-zinc-800/50 px-3 py-1 flex items-center gap-3 text-[10px] text-zinc-500">
          <span>{def?.label ?? sectionType}</span>
          <span>•</span>
          <span>{locale === 'ru' ? 'RU' : 'UK'}</span>
        </div>
      )}
    </div>
  )
}

/* ── Block preview render functions ── */

function renderBlockPreview(
  type: string,
  content: Record<string, unknown>,
  locale: 'ru' | 'uk',
): React.ReactNode | null {
  switch (type) {
    case 'hero':
      return <HeroPreview content={content} locale={locale} />
    case 'text-block':
      return <TextBlockPreview content={content} />
    case 'stats':
      return <StatsPreview content={content} locale={locale} />
    case 'cta':
      return <CTAPreview content={content} locale={locale} />
    case 'image-text':
      return <ImageTextPreview content={content} locale={locale} />
    case 'timeline':
      return <TimelinePreview content={content} locale={locale} />
    case 'gallery':
      return <GalleryPreview content={content} />
    case 'video-embed':
      return <VideoPreview content={content} locale={locale} />
    case 'services-grid':
      return <ServicesGridPreview content={content} locale={locale} />
    case 'faq-group-ref':
      return <FaqGroupPreview content={content} locale={locale} />
    case 'testimonials-ref':
      return <TestimonialsRefPreview content={content} locale={locale} />
    case 'contact-form':
      return <ContactFormPreview content={content} locale={locale} />
    default:
      return <GenericPreview content={content} />
  }
}

/* ── Shared helpers ── */

function str(val: unknown, fallback = ''): string {
  if (!val) return fallback
  return String(val)
}

function PreviewContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg ${className}`}>
      {children}
    </div>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return <h3 className="text-lg font-bold text-zinc-200 mb-2 leading-tight">{children}</h3>
}

function Subtitle({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return <p className="text-sm text-zinc-400 mb-3 leading-relaxed">{children}</p>
}

function CTAButton({ text, link }: { text: string; link?: string }) {
  if (!text) return null
  return (
    <div className="mt-3">
      <span className="inline-block rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white shadow-sm">
        {text}
      </span>
      {link && <span className="ml-2 text-xs text-zinc-500">{link}</span>}
    </div>
  )
}

function PlaceholderImage({ alt, className = 'h-24' }: { alt?: string; className?: string }) {
  return (
    <div className={`rounded-lg bg-zinc-700 flex items-center justify-center text-zinc-500 text-xs ${className}`}>
      <span>🖼 {alt || 'Image'}</span>
    </div>
  )
}

/* ── Hero Preview ── */

function HeroPreview({ content, locale }: { content: Record<string, unknown>; locale: string }) {
  const title = str(content.title)
  const subtitle = str(content.subtitle)
  const cta = str(content.cta)

  // Count non-empty fields for dimension info
  const filled = [title, subtitle, cta].filter(Boolean).length

  return (
    <PreviewContainer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 text-center">
      {title && <h2 className="text-2xl font-bold leading-tight mb-3">{title}</h2>}
      {subtitle && <p className="text-sm text-zinc-600 mb-4 max-w-md mx-auto">{subtitle}</p>}
      {cta && (
        <span className="inline-block rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm">
          {cta}
        </span>
      )}
    </PreviewContainer>
  )
}

/* ── Text Block Preview ── */

function TextBlockPreview({ content }: { content: Record<string, unknown> }) {
  const title = str(content.title)
  const body = str(content.body)

  return (
    <PreviewContainer>
      {title && <h3 className="text-xl font-bold text-zinc-200 mb-2">{title}</h3>}
      {body && (
        <div
          className="text-sm text-zinc-300 leading-relaxed [&_p]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      )}
    </PreviewContainer>
  )
}

/* ── Stats Preview ── */

function StatsPreview({ content, locale }: { content: Record<string, unknown>; locale: string }) {
  const title = str(content.title)
  const items = (content.items as { value?: string; label?: string }[]) ?? []

  return (
    <PreviewContainer>
      {title && <h3 className="text-lg font-bold text-zinc-200 mb-3 text-center">{title}</h3>}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, i) => (
            <div key={i} className="text-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <div className="text-2xl font-bold text-amber-600">{item.value || '—'}</div>
              <div className="text-xs text-zinc-500 mt-1">{item.label || ''}</div>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <p className="text-xs text-zinc-500 text-center py-4">
          {locale === 'uk' ? 'Немає елементів статистики' : 'Нет элементов статистики'}
        </p>
      )}
    </PreviewContainer>
  )
}

/* ── CTA Preview ── */

function CTAPreview({ content, locale }: { content: Record<string, unknown>; locale: string }) {
  const title = str(content.title)
  const subtitle = str(content.subtitle)
  const buttonText = str(content.buttonText)
  const buttonLink = str(content.buttonLink)

  if (!title && !subtitle && !buttonText) {
    return <EmptyPlaceholder locale={locale} />
  }

  return (
    <PreviewContainer className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 p-5 text-center">
      {title && <h3 className="text-xl font-bold text-zinc-200 mb-2">{title}</h3>}
      {subtitle && <p className="text-sm text-zinc-400 mb-4">{subtitle}</p>}
      {buttonText && (
        <span className="inline-block rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm">
          {buttonText}
        </span>
      )}
    </PreviewContainer>
  )
}

/* ── Image + Text Preview ── */

function ImageTextPreview({ content, locale }: { content: Record<string, unknown>; locale: string }) {
  const title = str(content.title)
  const body = str(content.body)
  const image = str(content.image)
  const position = str(content.imagePosition, 'left')
  const isLeft = position === 'left'

  return (
    <PreviewContainer>
      {title && <h3 className="text-lg font-bold text-zinc-200 mb-2">{title}</h3>}
      <div className={`flex gap-3 ${isLeft ? '' : 'flex-row-reverse'} items-start`}>
        <div className="flex-1 min-w-0">
          {body && (
            <div
              className="text-sm text-zinc-300 leading-relaxed [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          )}
        </div>
        <div className="w-24 shrink-0">
          {image ? (
            <img
              src={image}
              alt={str(content.imageAlt)}
              className="w-full h-20 object-cover rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <PlaceholderImage className="h-20" />
          )}
        </div>
      </div>
    </PreviewContainer>
  )
}

/* ── Timeline Preview ── */

function TimelinePreview({ content, locale }: { content: Record<string, unknown>; locale: string }) {
  const title = str(content.title)
  const items = (content.items as { year?: string; title?: string; description?: string }[]) ?? []

  return (
    <PreviewContainer>
      {title && <h3 className="text-lg font-bold text-zinc-200 mb-3">{title}</h3>}
      {items.length > 0 ? (
        <div className="space-y-0">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 pb-3 relative">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100 z-10" />
                {i < items.length - 1 && <div className="w-0.5 flex-1 bg-zinc-700 -mt-0.5" />}
              </div>
              {/* Content */}
              <div className="flex-1 pb-2">
                {item.year && <span className="text-xs font-bold text-amber-600">{item.year}</span>}
                {item.title && <h4 className="text-sm font-semibold text-zinc-200">{item.title}</h4>}
                {item.description && <p className="text-xs text-zinc-400 mt-0.5">{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500 text-center py-4">—</p>
      )}
    </PreviewContainer>
  )
}

/* ── Gallery Preview ── */

function GalleryPreview({ content }: { content: Record<string, unknown> }) {
  const title = str(content.title)
  const images = (content.images as { url?: string; alt?: string; caption?: string }[]) ?? []

  return (
    <PreviewContainer>
      {title && <h3 className="text-lg font-bold text-zinc-200 mb-2">{title}</h3>}
      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {images.slice(0, 6).map((img, i) => (
            <div key={i} className="relative group">
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.alt ?? ''}
                  className="w-full h-16 object-cover rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <PlaceholderImage className="h-16" alt={img.alt} />
              )}
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate rounded-b">
                  {img.caption}
                </div>
              )}
            </div>
          ))}
          {images.length > 6 && (
            <div className="flex items-center justify-center h-16 rounded bg-zinc-800/50 text-xs text-zinc-500">
              +{images.length - 6}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-zinc-500 text-center py-4">—</p>
      )}
    </PreviewContainer>
  )
}

/* ── Video Preview ── */

function VideoPreview({ content, locale }: { content: Record<string, unknown>; locale: string }) {
  const title = str(content.title)
  const videoUrl = str(content.videoUrl)
  const caption = str(content.caption)

  // Extract YouTube ID
  let youtubeId: string | null = null
  try {
    const u = new URL(videoUrl)
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      if (u.hostname.includes('youtu.be')) {
        youtubeId = u.pathname.slice(1).split('/')[0] || null
      } else {
        youtubeId = u.searchParams.get('v')
      }
    }
  } catch { /* ignore */ }

  return (
    <PreviewContainer>
      {title && <h3 className="text-lg font-bold text-zinc-200 mb-2">{title}</h3>}
      {youtubeId ? (
        <div className="rounded-lg overflow-hidden bg-zinc-900">
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
            alt=""
            className="w-full h-24 object-cover"
          />
          <div className="flex items-center justify-center py-1.5">
            <span className="text-amber-400 text-xs">▶ {locale === 'uk' ? 'Переглянути' : 'Смотреть'}</span>
          </div>
        </div>
      ) : videoUrl ? (
        <div className="rounded-lg bg-zinc-800/50 p-3 text-center text-xs text-zinc-500">
          🎬 {videoUrl}
        </div>
      ) : (
        <div className="rounded-lg bg-zinc-800/50 p-3 text-center text-xs text-zinc-500">
          🎬 {locale === 'uk' ? 'Вставте посилання на відео' : 'Вставьте ссылку на видео'}
        </div>
      )}
      {caption && <p className="text-xs text-zinc-500 mt-1">{caption}</p>}
    </PreviewContainer>
  )
}

/* ── Services Grid Preview ── */

function ServicesGridPreview({ content, locale }: { content: Record<string, unknown>; locale: string }) {
  const title = str(content.title)
  const subtitle = str(content.subtitle)
  const showFeatured = Boolean(content.showFeatured)
  const maxItems = Number(content.maxItems) || 6

  return (
    <PreviewContainer>
      {title && <h3 className="text-lg font-bold text-zinc-200 mb-2">{title}</h3>}
      {subtitle && <p className="text-sm text-zinc-400 mb-3">{subtitle}</p>}
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: Math.min(4, maxItems) }).map((_, i) => (
          <div key={i} className="rounded-lg border border-zinc-700 p-2.5 bg-zinc-800/50">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs mb-1">⭐</div>
            <div className="h-2.5 w-16 rounded bg-zinc-700" />
          </div>
        ))}
      </div>
      {maxItems > 4 && (
        <p className="text-xs text-zinc-500 mt-1">
          {locale === 'uk' ? `+ ще ${maxItems - 4} послуг` : `+ ещё ${maxItems - 4} услуг`}
        </p>
      )}
    </PreviewContainer>
  )
}

/* ── FAQ Group Preview ── */

function FaqGroupPreview({ content, locale }: { content: Record<string, unknown>; locale: string }) {
  const title = str(content.title)
  const group = str(content.group, 'GENERAL')

  return (
    <PreviewContainer>
      {title && <h3 className="text-lg font-bold text-zinc-200 mb-2">{title}</h3>}
      <div className="space-y-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-700 p-2.5">
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-32 rounded bg-zinc-700" />
              <span className="text-zinc-600 text-xs">▼</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-500">
        <span className="rounded bg-zinc-800/50 px-1.5 py-0.5">{group}</span>
        <span>{locale === 'uk' ? 'група FAQ' : 'группа FAQ'}</span>
      </div>
    </PreviewContainer>
  )
}

/* ── Testimonials Ref Preview ── */

function TestimonialsRefPreview({ content, locale }: { content: Record<string, unknown>; locale: string }) {
  const title = str(content.title)

  return (
    <PreviewContainer>
      {title && <h3 className="text-lg font-bold text-zinc-200 mb-2">{title}</h3>}
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-700 p-3 bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-700">
                {i === 1 ? 'А' : 'М'}
              </div>
              <div className="h-2.5 w-20 rounded bg-zinc-700" />
            </div>
            <div className="h-2 w-full rounded bg-zinc-800/50 mb-1" />
            <div className="h-2 w-3/4 rounded bg-zinc-800/50" />
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-500 mt-1">
        ⚡ {locale === 'uk' ? 'Відгуки завантажуються з CRM' : 'Отзывы загружаются из CRM'}
      </p>
    </PreviewContainer>
  )
}

/* ── Contact Form Preview ── */

function ContactFormPreview({ content, locale }: { content: Record<string, unknown>; locale: string }) {
  const title = str(content.title)
  const subtitle = str(content.subtitle)

  return (
    <PreviewContainer className="bg-zinc-800/50 p-4">
      {title && <h3 className="text-lg font-bold text-zinc-200 mb-1">{title}</h3>}
      {subtitle && <p className="text-sm text-zinc-400 mb-3">{subtitle}</p>}
      <div className="space-y-2">
        <div className="h-8 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 flex items-center text-xs text-zinc-500">
          {locale === 'uk' ? 'Ваше ім\'я' : 'Ваше имя'}
        </div>
        <div className="h-8 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 flex items-center text-xs text-zinc-500">
          {locale === 'uk' ? 'Email або телефон' : 'Email или телефон'}
        </div>
        <div className="h-16 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-500">
          {locale === 'uk' ? 'Ваше повідомлення' : 'Ваше сообщение'}
        </div>
        <div className="h-8 rounded-lg bg-amber-600 flex items-center justify-center text-sm font-medium text-white">
          {locale === 'uk' ? 'Надіслати' : 'Отправить'}
        </div>
      </div>
    </PreviewContainer>
  )
}

/* ── Generic fallback ── */

function GenericPreview({ content }: { content: Record<string, unknown> }) {
  const keys = Object.keys(content)
  return (
    <div className="space-y-1.5">
      {keys.map((key) => (
        <div key={key} className="flex gap-2 text-xs">
          <span className="font-mono text-zinc-500 shrink-0">{key}:</span>
          <span className="text-zinc-300 truncate">{str(content[key])}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyPlaceholder({ locale }: { locale: string }) {
  return (
    <div className="flex items-center justify-center h-16 text-xs text-zinc-500">
      {locale === 'uk' ? 'Заповніть вміст блоку' : 'Заполните содержимое блока'}
    </div>
  )
}
