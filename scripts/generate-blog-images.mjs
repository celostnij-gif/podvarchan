/**
 * Генерирует WEBP-изображения для 12 статей блога.
 * Запуск: node scripts/generate-blog-images.mjs
 *
 * Каждое изображение: 1200×630px (OpenGraph-формат), тёмный градиентный фон,
 * тематическая иконка и текст в стиле дизайн-системы сайта.
 */

import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'src', 'img', 'blog picture')

// Дизайн-токены из tailwind.config
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
  },
  {
    slug: 'kak-rabotaet-gipnoz',
    title: 'Как работает гипноз',
    sub: 'Научное объяснение',
    gradient: ['#0F1B2D', '#1B3A4B'],
    symbol: '🌊',
    accent: COLORS.accentBlue,
  },
  {
    slug: 'trevoga-prichiny-i-simptomy',
    title: 'Тревога',
    sub: 'Причины и симптомы',
    gradient: ['#2D1B1B', '#4A2525'],
    symbol: '💫',
    accent: COLORS.accentRose,
  },
  {
    slug: 'kak-spravitsya-s-trevogoy',
    title: 'Как справиться',
    sub: 'с тревогой',
    gradient: ['#1B2D1B', '#2A4A2A'],
    symbol: '🪷',
    accent: COLORS.accentGreen,
  },
  {
    slug: 'panicheskiye-ataki-chto-delat',
    title: 'Панические атаки',
    sub: 'Первая помощь и лечение',
    gradient: ['#2D1B1B', '#4A2A2A'],
    symbol: '💜',
    accent: COLORS.accentRose,
  },
  {
    slug: 'chto-takoe-samosabotazh',
    title: 'Самосаботаж',
    sub: 'Что это и как проявляется',
    gradient: ['#1B1B2D', '#2A2A4A'],
    symbol: '🧱',
    accent: COLORS.accentPurple,
  },
  {
    slug: 'samosabotazh-prichiny',
    title: 'Причины самосаботажа',
    sub: 'Психология подсознания',
    gradient: ['#1B1B2D', '#3A2A4A'],
    symbol: '🌳',
    accent: COLORS.accentPurple,
  },
  {
    slug: 'emotsionalnoye-vygoraniye-simptomy',
    title: 'Эмоциональное',
    sub: 'выгорание',
    gradient: ['#2D1B10', '#4A2A1A'],
    symbol: '🔥',
    accent: COLORS.accentCoral,
  },
  {
    slug: 'vnutrenniy-kritik',
    title: 'Внутренний критик',
    sub: 'Как приручить',
    gradient: ['#1B2D2D', '#2A4A4A'],
    symbol: '🗣️',
    accent: COLORS.accentTeal,
  },
  {
    slug: 'podavlennyye-emotsii',
    title: 'Подавленные эмоции',
    sub: 'Последствия и освобождение',
    gradient: ['#1B1B2D', '#2A2A4A'],
    symbol: '🌊',
    accent: COLORS.accentBlue,
  },
  {
    slug: 'eksistentsialnyy-krizis',
    title: 'Экзистенциальный',
    sub: 'кризис',
    gradient: ['#1B1B1B', '#2D2D1B'],
    symbol: '♾️',
    accent: COLORS.gold,
  },
  {
    slug: 'gipnoterapiya-onlayn-kak-prokhodit',
    title: 'Онлайн-гипноз',
    sub: 'Как проходят сессии',
    gradient: ['#0F1B2D', '#1B3A4B'],
    symbol: '💻',
    accent: COLORS.accentBlue,
  },
]

function svgContent({ title, sub, gradient, symbol, accent }) {
  // Радиальный градиент
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
    <linearGradient id="line" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0" />
      <stop offset="50%" stop-color="${accent}" stop-opacity="0.6" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#${gradId})" />

  <!-- Subtle glow accent -->
  <rect x="300" y="100" width="600" height="430" rx="215" fill="url(#glow)" />

  <!-- Decorative circles -->
  <circle cx="1050" cy="100" r="150" fill="${accent}" opacity="0.03" />
  <circle cx="100" cy="500" r="100" fill="${accent}" opacity="0.04" />

  <!-- Grid dots pattern -->
  <g opacity="0.04">
    ${Array.from({ length: 40 }, (_, i) => {
      const x = 30 + (i % 10) * 120
      const y = 30 + Math.floor(i / 10) * 150
      return `<circle cx="${x}" cy="${y}" r="2" fill="#ffffff" />`
    }).join('\n      ')}
  </g>

  <!-- Top accent line -->
  <rect x="450" y="0" width="300" height="2" fill="url(#line)" />

  <!-- Symbol (large emoji) -->
  <text x="600" y="220" text-anchor="middle" font-size="80" dominant-baseline="central">
    ${symbol}
  </text>

  <!-- Title -->
  <text x="600" y="340" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="48" font-weight="700" fill="#F0EEE6"
        letter-spacing="1">
    ${title}
  </text>

  <!-- Subtitle -->
  <text x="600" y="390" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="22" fill="#8888A0"
        letter-spacing="2">
    ${sub}
  </text>

  <!-- Decorative underline -->
  <rect x="500" y="420" width="200" height="1" fill="${accent}" opacity="0.4" />

  <!-- Bottom label -->
  <text x="600" y="560" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="13" fill="#555568"
        letter-spacing="3">
    PODVARCHAN.COM
  </text>

  <!-- Bottom accent line -->
  <rect x="450" y="628" width="300" height="2" fill="url(#line)" />
</svg>`
}

async function main() {
  console.log('🎨 Генерация изображений для блога...\n')

  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true })
    console.log(`📁 Создана директория: ${OUT_DIR}`)
  }

  for (const img of IMAGES) {
    const svg = svgContent(img)
    const outPath = join(OUT_DIR, `${img.slug}.webp`)

    try {
      await sharp(Buffer.from(svg))
        .resize(1200, 630)
        .webp({ quality: 85 })
        .toFile(outPath)
      console.log(`  ✅ ${img.slug}.webp — ${img.title}`)
    } catch (err) {
      console.error(`  ❌ ${img.slug}.webp — ОШИБКА: ${err.message}`)
    }
  }

  console.log(`\n✨ Готово! Все изображения сохранены в:\n   ${OUT_DIR}`)
}

main()
