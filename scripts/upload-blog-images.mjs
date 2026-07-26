#!/usr/bin/env node
/**
 * Upload all blog cover images from public/images/blog/ to Cloudflare R2,
 * create media_assets records in D1, and update blog_posts.cover_image_id.
 *
 * Usage: node scripts/upload-blog-images.mjs
 *
 * Prerequisites:
 *   - CLOUDFLARE_API_TOKEN env var with R2 write permissions
 *   - wrangler CLI authenticated
 *
 * The script reads blog_posts from D1, uploads each unique static image to R2,
 * inserts a media_assets record, and batches UPDATE blog_posts SQL.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const IMAGES_DIR = resolve(PROJECT_ROOT, 'public/images/blog')

const CF_API = 'https://api.cloudflare.com/client/v4'
const ACCOUNT_ID = 'd2d025682352e4f90336d295deef3fce'
const BUCKET = 'podvarchan-media'

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
if (!API_TOKEN) {
  console.error('❌ CLOUDFLARE_API_TOKEN not set')
  process.exit(1)
}

// ── Mapping from D1: post_id → cover_image_id (static paths only) ──

const POST_IMAGES = [
  { id: 'post-chto-takoe-eriksonovskiy-gipnoz', path: '/images/blog/chto-takoe-eriksonovskiy-gipnoz-uk.webp' },
  { id: '7b810c33-3400-4e1d-8b37-b166df658911', path: '/images/blog/chto-takoe-gipnoterapiya.webp' },
  { id: '7d739c4f-1c89-448e-bae6-5b87a95cf5d1', path: '/images/blog/chto-takoe-samosabotazh.webp' },
  { id: '4027e9e4-53bc-4e86-b812-1b9972eb0f4f', path: '/images/blog/detskaya-gadzhet-zavisimost.webp' },
  { id: 'post-effektivna-li-gipnoterapiya-onlajn', path: '/images/blog/effektivna-li-gipnoterapiya-onlajn-uk.webp' },
  { id: '484a6b59-8fa7-414a-add2-dcc89f9bcc10', path: '/images/blog/eksistentsialnyy-krizis.webp' },
  { id: '1e29b3c0-b2a4-450d-a0b1-1ef189bb036e', path: '/images/blog/emotsionalnoye-vygoraniye-simptomy.webp' },
  { id: '65ed12a3-8c74-48d4-a32d-0d5aba7e34a6', path: '/images/blog/gipnoterapiya-onlayn-kak-prokhodit.webp' },
  { id: 'post-kak-ostanovit-panicheskuyu-ataku', path: '/images/blog/kak-ostanovit-panicheskuyu-ataku-uk.webp' },
  { id: '6ab3c40a-b05c-43ab-a1e2-b94dae307e66', path: '/images/blog/kak-perestat-boyatsya-budushchego.webp' },
  { id: 'ac0f9918-8cbc-410f-bb83-28de53a19b19', path: '/images/blog/kak-rabotaet-gipnoz.webp' },
  { id: '2f76aa20-9ec2-41a0-b23b-b5dd9575c1ec', path: '/images/blog/kak-spravitsya-s-trevogoy.webp' },
  { id: '4229ef24-d4dd-4f46-81ed-cb463c7f72d0', path: '/images/blog/kom-v-gorle-pri-trevoge.webp' },
  { id: 'post-kulturnyy-shok', path: '/images/blog/kulturnyy-shok-uk.webp' },
  { id: 'c1fbed4b-e44e-489f-a636-bf0c54165eeb', path: '/images/blog/net-sil-chto-delat.webp' },
  { id: 'd41a0d42-1188-450a-90ec-fe6520f8ead9', path: '/images/blog/neyverennost-kak-preodolet.webp' },
  { id: 'post-nostalgiya-po-rodine', path: '/images/blog/nostalgiya-po-rodine-uk.webp' },
  { id: 'post-odinochestvo-v-emigracii', path: '/images/blog/odinochestvo-v-emigracii-uk.webp' },
  { id: 'faabc33c-0bae-4feb-9dea-49f71607e087', path: '/images/blog/panicheskiye-ataki-chto-delat.webp' },
  { id: '29908177-25f9-492e-b11e-b0b6666b9b82', path: '/images/blog/pochemu-trevoga-ne-prokhodit-godami.webp' },
  { id: '3d8076d3-7bc0-420b-bfa0-01950d2ff82f', path: '/images/blog/pochemu-voznikaet-panika-nochyu.webp' },
  { id: 'b351a396-5f93-4b37-948e-31eb0bd9cdc0', path: '/images/blog/podavlennyye-emotsii.webp' },
  { id: 'post-postoyannaya-trevoga-bez-prichiny', path: '/images/blog/postoyannaya-trevoga-bez-prichiny-uk.webp' },
  { id: 'cb08cbb3-54ce-4bd4-96e3-b482fbdc9999', path: '/images/blog/postoyannaya-ustalost-prichiny.webp' },
  { id: '2fb0b6dc-0030-4617-be08-0da527d17dec', path: '/images/blog/postoyannoe-vnutrennee-napryazhenie.webp' },
  { id: 'd3af1247-6f1d-46c1-acbd-b4f7cc026886', path: '/images/blog/priznaki-gadzhet-zavisimosti.webp' },
  { id: 'c17eb39d-9eed-4d8f-a086-03761e0fae64', path: '/images/blog/psikhosomatika-boli-v-shee.webp' },
  { id: '06b4915e-4fec-49cf-8d8c-f2784c1114c6', path: '/images/blog/psikhosomatika-chto-eto.webp' },
  { id: '4ceb0520-d83e-48be-9456-428e46b12679', path: '/images/blog/psikhosomatika-davleniya.webp' },
  { id: 'e7767025-6c9c-46ec-918d-e9d60d92a4c1', path: '/images/blog/psikhosomatika-golovokruzheniya.webp' },
  { id: '608b859b-4eee-4382-9489-63376f5b81ff', path: '/images/blog/ptsr-u-veteranov-simptomy-i-pomoshch.webp' },
  { id: '9bf1eaff-caa2-4400-94a9-cb3fe040b0ff', path: '/images/blog/samosabotazh-prichiny.webp' },
  { id: 'b475ffe9-6773-40ae-8659-59b7305b8c8a', path: '/images/blog/strakh-smerti-bez-prichiny.webp' },
  { id: 'post-trevoga-posle-pereezda', path: '/images/blog/trevoga-posle-pereezda-uk.webp' },
  { id: '18166f1c-4cfc-4140-b9b2-e4cf36bc1486', path: '/images/blog/trevoga-prichiny-i-simptomy.webp' },
  { id: '03132a6b-7a00-4554-b926-3230d9872d69', path: '/images/blog/tsifrovoy-detoks-poshagovoe-rukovodstvo.webp' },
  { id: 'd1d2d191-216d-4b85-8bf4-175b93079102', path: '/images/blog/vliyanie-pesen-na-kachestvo-zhizni.webp' },
  { id: '16b6bbd3-ecfa-4adb-917e-36ff91a9181e', path: '/images/blog/vliyanie-pesen-na-podsoznanie.webp' },
  { id: 'e12677b6-0580-4383-ab34-b491f9a2d2a7', path: '/images/blog/vnutrenniy-kritik.webp' },
]

// ── Deduplicate by image path (multiple posts may share the same image) ──

const imageToPosts = new Map()
for (const { id, path } of POST_IMAGES) {
  if (!imageToPosts.has(path)) imageToPosts.set(path, [])
  imageToPosts.get(path).push(id)
}

// ── Helpers ──

function run(cmd) {
  return execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
}

function generateUUID() {
  return crypto.randomUUID()
}

async function uploadToR2(filename, filePath) {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const uuid = generateUUID()
  const storageKey = `media/${yyyy}/${mm}/${uuid}.webp`
  const publicUrl = `/api/media/${storageKey}`
  const url = `${CF_API}/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${storageKey}`

  const fileBuffer = readFileSync(filePath)
  const size = fileBuffer.length

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'image/webp',
      'Content-Length': String(size),
    },
    body: fileBuffer,
  })

  const result = await response.json()
  if (!result.success) {
    throw new Error(`R2 upload failed for ${filename}: ${JSON.stringify(result.errors)}`)
  }

  return { uuid, storageKey, publicUrl, size }
}

async function main() {
  console.log(`📸 Blog images to process: ${imageToPosts.size} unique images for ${POST_IMAGES.length} posts\n`)

  const mediaRecords = [] // { uuid, storageKey, publicUrl, fileName, size }
  const updateSQL = []    // UPDATE blog_posts SET cover_image_id = uuid WHERE id = 'post-id'

  let successCount = 0
  let skipCount = 0
  let failCount = 0

  for (const [imagePath, postIds] of imageToPosts.entries()) {
    // Extract filename from path: /images/blog/foo.webp → foo.webp
    const filename = imagePath.replace('/images/blog/', '')
    const filePath = resolve(IMAGES_DIR, filename)
    const displayName = filename

    if (!existsSync(filePath)) {
      console.warn(`  ⚠️  File not found: ${filePath} (referenced by ${postIds.join(', ')})`)
      failCount++
      continue
    }

    try {
      const { uuid, storageKey, publicUrl, size } = await uploadToR2(displayName, filePath)
      mediaRecords.push({ uuid, storageKey, publicUrl, fileName: displayName, size })

      for (const postId of postIds) {
        updateSQL.push({
          postId,
          uuid,
          sql: `UPDATE blog_posts SET cover_image_id = '${uuid}' WHERE id = '${postId}';`,
        })
      }

      successCount++
      console.log(`  ✅ ${displayName} → ${publicUrl} (${(size / 1024).toFixed(1)} KB)`)
    } catch (err) {
      console.error(`  ❌ ${displayName}: ${err.message}`)
      failCount++
    }
  }

  console.log(`\n📊 Results: ${successCount} uploaded, ${skipCount} skipped, ${failCount} failed`)
  console.log(`📝 Media records to insert: ${mediaRecords.length}`)
  console.log(`📝 Blog post updates: ${updateSQL.length}`)

  if (mediaRecords.length === 0) {
    console.log('\n✨ Nothing to do.')
    return
  }

  // ── Generate SQL file ──

  const now = new Date().toISOString()
  const sqlLines = ['-- Generated by upload-blog-images.mjs']
  sqlLines.push(`-- Date: ${now}`)
  sqlLines.push('')

  // INSERT media_assets
  for (const rec of mediaRecords) {
    const escapedName = rec.fileName.replace(/'/g, "''")
    sqlLines.push(
      `INSERT INTO media_assets (id, file_name, original_name, mime_type, size, storage_key, public_url, created_at) ` +
      `VALUES ('${rec.uuid}', '${escapedName}', '${escapedName}', 'image/webp', ${rec.size}, ` +
      `'${rec.storageKey}', '${rec.publicUrl}', '${now}');`
    )
  }

  sqlLines.push('')

  // UPDATE blog_posts
  for (const { sql } of updateSQL) {
    sqlLines.push(sql)
  }

  const sqlContent = sqlLines.join('\n')

  // Write SQL file
  const sqlPath = resolve(PROJECT_ROOT, 'TEMP/seo-content/upload-blog-images.sql')
  const fs = await import('fs')
  fs.writeFileSync(sqlPath, sqlContent, 'utf-8')
  console.log(`\n📄 SQL written to: TEMP/seo-content/upload-blog-images.sql`)

  // ── Execute via wrangler ──
  console.log('\n🚀 Executing D1 SQL...')
  try {
    const output = run(`npx wrangler d1 execute podvarchan --remote --file="${sqlPath}"`)
    console.log(output)
    console.log('\n✅ All D1 operations completed!')
  } catch (err) {
    console.error('\n❌ D1 execution error:', err.message)
    console.log('You can manually run: npx wrangler d1 execute podvarchan --remote --file="TEMP/seo-content/upload-blog-images.sql"')
  }

  console.log('\n🎉 Done!')
}

main().catch(console.error)
