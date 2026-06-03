import { loadGoogleFont } from './fonts'
import { SITE } from '@/constants'

/* ── Типы для фрейма шрифта ── */

interface FontFrame {
  name: string
  data: ArrayBuffer
  weight: 400 | 500 | 600 | 700
  style: 'normal'
}

/* ── Результат загрузки шрифтов ── */

export interface LoadedFonts {
  regular: FontFrame | null
  semiBold: FontFrame | null
  bold: FontFrame | null
  all: FontFrame[]
}

/* ── Загружает шрифты Inter ── */

export async function loadInterFonts(): Promise<LoadedFonts> {
  let regular: ArrayBuffer | null = null
  let semiBold: ArrayBuffer | null = null
  let bold: ArrayBuffer | null = null

  try {
    ;[regular, semiBold, bold] = await Promise.all([
      loadGoogleFont('Inter', 400).catch(() => null),
      loadGoogleFont('Inter', 600).catch(() => null),
      loadGoogleFont('Inter', 700).catch(() => null),
    ])
  } catch {
    // fallback — встроенный шрифт Satori
  }

  const fonts: FontFrame[] = []
  const make = (
    data: ArrayBuffer | null,
    weight: 400 | 500 | 600 | 700
  ): FontFrame | null =>
    data ? { name: 'Inter', data, weight, style: 'normal' as const } : null

  const r = make(regular, 400)
  const s = make(semiBold, 600)
  const b = make(bold, 700)

  if (r) fonts.push(r)
  if (s) fonts.push(s)
  if (b) fonts.push(b)

  return { regular: r, semiBold: s, bold: b, all: fonts }
}

/* ── Стили для декоративных элементов ── */

export const OG_STYLES = {
  /* Тёмный градиентный фон */
  container: {
    width: 1200,
    height: 630,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '80px 100px',
    background:
      'linear-gradient(135deg, #0A0A12 0%, #0F0F1A 40%, #14141F 70%, #0A0A12 100%)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },

  /* Верхняя акцентная линия */
  topLine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    background:
      'linear-gradient(90deg, transparent, rgba(201,169,110,0.6), transparent)',
  },

  /* Правый верхний шар */
  glowTopRight: {
    position: 'absolute' as const,
    top: '-120px',
    right: '-100px',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 70%)',
  },

  /* Левый нижний шар */
  glowBottomLeft: {
    position: 'absolute' as const,
    bottom: '-150px',
    left: '-80px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)',
  },

  /* URL в правом нижнем углу */
  urlLabel: (fontFamily: string): React.CSSProperties => ({
    position: 'absolute' as const,
    bottom: '40px',
    right: '80px',
    fontFamily,
    fontSize: '14px',
    fontWeight: 400,
    color: 'rgba(240,237,232,0.25)',
    letterSpacing: '2px',
  }),

  /* Метка-категория (золотая, uppercase) */
  label: (fontFamily: string): React.CSSProperties => ({
    fontFamily,
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '3px',
    textTransform: 'uppercase' as const,
    color: 'rgba(201,169,110,0.85)',
  }),

  /* Золотая линия перед меткой */
  labelLine: {
    width: '24px',
    height: '2px',
    background: 'rgba(201,169,110,0.5)',
  },
}

/* ── URL для OG изображений ── */

export const SITE_URL_LABEL = SITE.url.replace('https://', '')

/* ── Фоновые декоративные элементы (рендерятся внутри контейнера) ── */

export function OGDecorations() {
  return (
    <>
      <div style={OG_STYLES.glowTopRight} />
      <div style={OG_STYLES.glowBottomLeft} />
      <div style={OG_STYLES.topLine} />
    </>
  )
}
