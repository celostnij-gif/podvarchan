#!/usr/bin/env node
/**
 * Upload all blog cover images from public/images/blog/ to R2 under blog/ prefix.
 * Uses Cloudflare REST API directly for speed.
 */

import { readFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const IMAGES_DIR = resolve(PROJECT_ROOT, 'public/images/blog')

const CF_API = 'https://api.cloudflare.com/client/v4'
const ACCOUNT_ID = 'd2d025682352e4f90336d295deef3fce'
const BUCKET = 'podvarchan-media'
const PREFIX = 'blog'

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
if (!API_TOKEN) {
  console.error('CLOUDFLARE_API_TOKEN not set')
  process.exit(1)
}

async function uploadOne(filename) {
  const filePath = resolve(IMAGES_DIR, filename)
  const key = `${PREFIX}/${filename}`
  const url = `${CF_API}/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${key}`
  const body = readFileSync(filePath)
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'image/webp',
      'Content-Length': String(body.length),
    },
    body,
  })
  const json = await res.json()
  if (!json.success) {
    return { ok: false, filename, errors: json.errors }
  }
  return { ok: true, filename, size: body.length }
}

async function main() {
  const files = readdirSync(IMAGES_DIR).filter(f => f.endsWith('.webp')).sort()
  console.log(`Uploading ${files.length} images to R2 (${PREFIX}/)...`)

  // Process 4 at a time for speed without overwhelming API
  const CONCURRENCY = 4
  let i = 0
  let ok = 0, fail = 0

  async function worker() {
    while (i < files.length) {
      const idx = i++
      const result = await uploadOne(files[idx])
      if (result.ok) {
        ok++
        process.stdout.write('.')
      } else {
        fail++
        process.stdout.write('F')
        console.error(`\nFAILED: ${result.filename}: ${JSON.stringify(result.errors)}`)
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker())
  await Promise.all(workers)

  console.log(`\n\nDone: ${ok} uploaded, ${fail} failed out of ${files.length}`)
}

main().catch(err => { console.error(err); process.exit(1) })
