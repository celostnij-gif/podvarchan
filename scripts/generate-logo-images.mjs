/**
 * generate-logo-images.mjs
 *
 * Генерує webp + avif версії logo.png в різних розмірах.
 * Запуск: node scripts/generate-logo-images.mjs
 *
 * Підтримувані розміри (відповідають відображенню в Header):
 *   32×32 — 1x mobile  (w-8)
 *   48×48 — 1.5x mobile
 *   64×64 — 2x mobile / ~1.8x desktop (md:w-9 = 36px → 2x = 72, близько)
 *   96×96 — 3x mobile
 *  128×128 — вищий DPI
 *  192×192 — оригінал (макс.)
 */

import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

const SOURCE = join(PROJECT_ROOT, 'public', 'logo.png')
const OUTPUT_DIR = join(PROJECT_ROOT, 'public', 'images', 'logo')

const SIZES = [32, 48, 64, 96, 128, 192]

const FORMATS = [
  { ext: 'webp', format: 'webp', options: { quality: 85, effort: 6, alphaQuality: 85 } },
  { ext: 'avif', format: 'avif', options: { quality: 70, effort: 6, chromaSubsampling: '4:4:4' } },
]

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`❌ Source not found: ${SOURCE}`)
    process.exit(1)
  }

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const metadata = await sharp(SOURCE).metadata()
  console.log(`📐 Source: ${metadata.width}×${metadata.height}, ${metadata.format}`)

  for (const size of SIZES) {
    for (const { ext, format, options } of FORMATS) {
      const outputPath = join(OUTPUT_DIR, `logo-${size}.${ext}`)

      await sharp(SOURCE)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFormat(format, options)
        .toFile(outputPath)

      const outMeta = await sharp(outputPath).metadata()
      const kb = (outMeta.size / 1024).toFixed(1)
      console.log(`  ✅ ${size}×${size}.${ext} → ${kb} KB`)
    }
  }

  // Also copy original PNG to same dir for fallback
  const pngOutputPath = join(OUTPUT_DIR, 'logo-192.png')
  await sharp(SOURCE)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(pngOutputPath)
  const pngMeta = await sharp(pngOutputPath).metadata()
  console.log(`  ✅ 192×192.png (fallback) → ${(pngMeta.size / 1024).toFixed(1)} KB`)

  console.log('\n🎉 Done! Generated all logo variants.')
  console.log(`📁 ${OUTPUT_DIR}`)
}

main().catch((err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})
