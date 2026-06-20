/**
 * Генерирует WEBP-изображения для 12 статей блога (RU + UK локали).
 * Запуск: node scripts/generate-blog-images.mjs
 *
 * Каждое изображение: 1200×630px (OpenGraph-формат), тёмный градиентный фон,
 * тематическая иконка и текст в стиле дизайн-системы сайта.
 * Для української локалі генеруються файли <slug>-uk.webp.
 */

import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'images', 'blog')

const COLORS = {
  gold: '#C8A96E',
  goldLight: '#E8D5A3',
  darkBg: '#0F0F14',
  darkSurface: '#1A1A24',
  textMuted: '#8888A0',
  accentGreen: '#4A9E7A',
  accentBlue: '#5B8DEF',
  accentPurple: '#8B6FC0',
  accentRose: '#D4748A',
  accentCoral: '#E8845A',
  accentTeal: '#5BA8A0',
}

const IMAGES = [
  {
    slug: 'chto-takoe-gipnoterapiya',
    title: 'Гипнотерапия',
    sub: 'Что это и как работает',
    gradient: ['#1A1A2E', '#2D1B4E'],
    symbol: '🧠',
    accent: COLORS.accentPurple,
    uk: { title: 'Гіпнотерапія', sub: 'Що це і як працює' },
  },
  {
    slug: 'kak-rabotaet-gipnoz',
    title: 'Как работает гипноз',
    sub: 'Научное объяснение',
    gradient: ['#0F1B2D', '#1B3A4B'],
    symbol: '🌊',
    accent: COLORS.accentBlue,
    uk: { title: 'Як працює гіпноз', sub: 'Наукове пояснення' },
  },
  {
    slug: 'trevoga-prichiny-i-simptomy',
    title: 'Тревога',
    sub: 'Причины и симптомы',
    gradient: ['#2D1B1B', '#4A2525'],
    symbol: '💫',
    accent: COLORS.accentRose,
    uk: { title: 'Тривога', sub: 'Причини та симптоми' },
  },
  {
    slug: 'kak-spravitsya-s-trevogoy',
    title: 'Как справиться',
    sub: 'с тревогой',
    gradient: ['#1B2D1B', '#2A4A2A'],
    symbol: '🪷',
    accent: COLORS.accentGreen,
    uk: { title: 'Як впоратися', sub: 'із тривогою' },
  },
  {
    slug: 'panicheskiye-ataki-chto-delat',
    title: 'Панические атаки',
    sub: 'Первая помощь и лечение',
    gradient: ['#2D1B1B', '#4A2A2A'],
    symbol: '💜',
    accent: COLORS.accentRose,
    uk: { title: 'Панічні атаки', sub: 'Перша допомога та лікування' },
  },
  {
    slug: 'chto-takoe-samosabotazh',
    title: 'Самосаботаж',
    sub: 'Что это и как проявляется',
    gradient: ['#1B1B2D', '#2A2A4A'],
    symbol: '🧱',
    accent: COLORS.accentPurple,
    uk: { title: 'Самосаботаж', sub: 'Що це і як проявляється' },
  },
  {
    slug: 'samosabotazh-prichiny',
    title: 'Причины самосаботажа',
    sub: 'Психология подсознания',
    gradient: ['#1B1B2D', '#3A2A4A'],
    symbol: '🌳',
    accent: COLORS.accentPurple,
    uk: { title: 'Причини самосаботажу', sub: 'Психологія підсвідомості' },
  },
  {
    slug: 'emotsionalnoye-vygoraniye-simptomy',
    title: 'Эмоциональное',
    sub: 'выгорание',
    gradient: ['#2D1B10', '#4A2A1A'],
    symbol: '🔥',
    accent: COLORS.accentCoral,
    uk: { title: 'Емоційне', sub: 'вигорання' },
  },
  {
    slug: 'vnutrenniy-kritik',
    title: 'Внутренний критик',
    sub: 'Как приручить',
    gradient: ['#1B2D2D', '#2A4A4A'],
    symbol: '🗣️',
    accent: COLORS.accentTeal,
    uk: { title: 'Внутрішній критик', sub: 'Як приборкати' },
  },
  {
    slug: 'podavlennyye-emotsii',
    title: 'Подавленные эмоции',
    sub: 'Последствия и освобождение',
    gradient: ['#1B1B2D', '#2A2A4A'],
    symbol: '🌊',
    accent: COLORS.accentBlue,
    uk: { title: 'Пригнічені емоції', sub: 'Наслідки та звільнення' },
  },
  {
    slug: 'eksistentsialnyy-krizis',
    title: 'Экзистенциальный',
    sub: 'кризис',
    gradient: ['#1B1B1B', '#2D2D1B'],
    symbol: '♾️',
    accent: COLORS.gold,
    uk: { title: 'Екзистенційна', sub: 'криза' },
  },
  {
    slug: 'gipnoterapiya-onlayn-kak-prokhodit',
    title: 'Онлайн-гипноз',
    sub: 'Как проходят сессии',
    gradient: ['#0F1B2D', '#1B3A4B'],
    symbol: '💻',
    accent: COLORS.accentBlue,
    uk: { title: 'Онлайн-гіпноз', sub: 'Як проходять сесії' },
  },
  {
    slug: 'priznaki-gadzhet-zavisimosti',
    title: 'Признаки',
    sub: 'гаджетозависимости',
    gradient: ['#1B1B2D', '#3A2A4A'],
    symbol: '📱',
    accent: COLORS.accentPurple,
    uk: { title: 'Ознаки', sub: 'гаджетозалежності' },
  },
  {
    slug: 'tsifrovoy-detoks-poshagovoe-rukovodstvo',
    title: 'Цифровой детокс',
    sub: 'Пошаговое руководство',
    gradient: ['#1B2D2D', '#2A4A4A'],
    symbol: '🔋',
    accent: COLORS.accentTeal,
    uk: { title: 'Цифровий детокс', sub: 'Покрокове керівництво' },
  },
  {
    slug: 'detskaya-gadzhet-zavisimost',
    title: 'Детская',
    sub: 'гаджетозависимость',
    gradient: ['#2D1B10', '#4A2A1A'],
    symbol: '👶',
    accent: COLORS.accentCoral,
    uk: { title: 'Дитяча', sub: 'гаджетозалежність' },
  },
  {
    slug: 'vliyanie-pesen-na-podsoznanie',
    title: 'Влияние песен',
    sub: 'на подсознание',
    gradient: ['#1B0F2D', '#2D1B4A'],
    symbol: '🎵',
    accent: COLORS.accentPurple,
    uk: { title: 'Вплив пісень', sub: 'на підсвідомість' },
  },
  {
    slug: 'net-sil-chto-delat',
    title: 'Нет сил —',
    sub: 'что делать?',
    gradient: ['#2D1B10', '#4A2A1A'],
    symbol: '🪫',
    accent: COLORS.accentCoral,
    uk: { title: 'Немає сил —', sub: 'що робити?' },
  },
  {
    slug: 'postoyannaya-ustalost-prichiny',
    title: 'Постоянная',
    sub: 'усталость',
    gradient: ['#1B1B2D', '#3A2A3A'],
    symbol: '😴',
    accent: COLORS.accentTeal,
    uk: { title: 'Постійна', sub: 'втома' },
  },
  {
    slug: 'vliyanie-pesen-na-kachestvo-zhizni',
    title: 'Влияние песен',
    sub: 'на качество жизни',
    gradient: ['#0F1B2D', '#1B3A4B'],
    symbol: '🎶',
    accent: COLORS.accentBlue,
    uk: { title: 'Вплив пісень', sub: 'на якість життя' },
  },
  {
    slug: 'psikhosomatika-chto-eto',
    title: 'Психосоматика',
    sub: 'связь души и тела',
    gradient: ['#1B2D1B', '#2A4A3A'],
    symbol: '🫀',
    accent: COLORS.accentGreen,
    uk: { title: 'Психосоматика', sub: "зв'язок душі та тіла" },
  },
  {
    slug: 'neyverennost-kak-preodolet',
    title: 'Неуверенность',
    sub: 'как обрести уверенность',
    gradient: ['#2D1B2D', '#4A2A4A'],
    symbol: '💪',
    accent: COLORS.accentPurple,
    uk: { title: 'Невпевненість', sub: 'як знайти впевненість' },
  },
]

function svgContent({ title, sub, gradient, symbol, accent }) {
  const gradId = 'bg'
  const accentHex = accent.replace('#', '')

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="${gradId}" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="${gradient[0]}" />
      <stop offset="100%" stop-color="${gradient[1]}" />
    </radialGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.15" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.06" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#${gradId})" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <rect width="1200" height="630" fill="url(#shine)" />

  <!-- Decorative border -->
  <rect x="16" y="16" width="1168" height="598" rx="20" fill="none" stroke="${COLORS.gold}" stroke-opacity="0.12" stroke-width="0.5" />

  <!-- Accent line -->
  <rect x="96" y="200" width="160" height="2" rx="1" fill="${accent}" opacity="0.5" />

  <!-- Symbol -->
  <text x="96" y="280" font-size="56" font-family="sans-serif">${symbol}</text>

  <!-- Title -->
  <text x="96" y="370" font-size="48" font-weight="700" font-family="system-ui, sans-serif" fill="${COLORS.goldLight}">
    <tspan x="96" dy="0">${title.replace(/</g, '&lt;')}</tspan>
  </text>

  <!-- Subtitle -->
  <text x="96" y="430" font-size="28" font-weight="400" font-family="system-ui, sans-serif" fill="${COLORS.textMuted}">
    <tspan x="96" dy="0">${sub.replace(/</g, '&lt;')}</tspan>
  </text>

  <!-- Domain watermark -->
  <text x="1096" y="590" font-size="14" font-weight="400" font-family="system-ui, sans-serif" fill="${COLORS.textMuted}" opacity="0.4" text-anchor="end">podvarchan.com</text>
</svg>`
}

async function generateImage(img, outPath, locale) {
  const svg = svgContent({
    title: locale === 'uk' && img.uk ? img.uk.title : img.title,
    sub: locale === 'uk' && img.uk ? img.uk.sub : img.sub,
    gradient: img.gradient,
    symbol: img.symbol,
    accent: img.accent,
  })

  try {
    await sharp(Buffer.from(svg))
      .resize(1200, 630)
      .webp({ quality: 85 })
      .toFile(outPath)
    console.log(`  ✅ ${outPath.split(/[/\\]/).pop()} — ${locale === 'uk' ? img.uk?.title : img.title}`)
  } catch (err) {
    console.error(`  ❌ ${outPath.split(/[/\\]/).pop()} — ОШИБКА: ${err.message}`)
  }
}

async function main() {
  console.log('🎨 Генерація зображень для блогу...\n')

  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true })
    console.log(`📁 Створена директорія: ${OUT_DIR}`)
  }

  for (const img of IMAGES) {
    // RU: <slug>.webp
    await generateImage(img, join(OUT_DIR, `${img.slug}.webp`), 'ru')
    // UK: <slug>-uk.webp
    await generateImage(img, join(OUT_DIR, `${img.slug}-uk.webp`), 'uk')
  }

  console.log(`\n✨ Готово! Всі зображення збережено в:\n   ${OUT_DIR}`)
}

main()
