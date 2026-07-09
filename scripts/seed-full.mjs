#!/usr/bin/env node

/**
 * seed-full.mjs — Full migration script
 * 
 * Reads blog post data from static TS source files, generates SQL INSERT statements.
 * 
 * Usage:
 *   node scripts/seed-full.mjs | npx wrangler d1 execute podvarchan --remote
 */

import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'

function esc(v) {
  if (v === null || v === undefined) return 'NULL'
  return "'" + String(v).replace(/'/g, "''") + "'"
}

function uuid() { return randomUUID() }
function now() { return Math.floor(Date.now() / 1000) }

// ── Blog category IDs ──
const CATEGORIES = {
  'gipnoterapiya':        '83253037-5f33-4c76-9f00-511225131426',
  'trevoga':              '9e46b05c-83c0-45b3-b45b-4e14eea8319d',
  'samosabotazh':         'c3bf4ef4-53fc-4395-890f-1bc8af88d114',
  'vygoraniye':           '11111111-1111-1111-1111-111111111001',
  'podsoznanie':          '889596c9-9768-4493-a357-31f6df43f607',
  'krizis':               '11111111-1111-1111-1111-111111111002',
  'tsifrovoy-detoks':     '0a038302-e133-43bf-8520-8a3924a262fa',
  'psikhosomatika':       'd3951d31-592b-45cc-b3e7-d834d7a0c271',
  'neyverennost':         'eb40696f-c4e8-44bf-b3ac-0bff61575d55',
  'ptsr':                 'fb40696f-c4e8-44bf-b3ac-0bff61575d56',
}

// ── Read source content ──
function load(path) {
  try { return readFileSync(path, 'utf-8') } catch { return '' }
}

// ── Extract blog posts from a TS source array ──
// The TS file exports an array: export const NAME = [ { ... }, { ... }, ]
// Each object is separated by a comma and newline.
function extractPosts(source) {
  if (!source) return []
  
  const posts = []
  
  // Find the start of the array (after "[" or "= [")
  let start = source.indexOf('[')
  if (start < 0) return []
  
  // Find the end of the array (the closing "]" after all objects)
  // We do this by tracking braces and brackets
  let braceDepth = 0
  let inArray = false
  let objectStart = -1
  let i = start
  
  while (i < source.length) {
    const ch = source[i]
    
    // Find the start of objects within the array
    if (!inArray && ch === '{') {
      objectStart = i
      braceDepth = 1
      inArray = true
      i++
      continue
    }
    
    if (inArray) {
      // Track string literals and template literals
      if (ch === "'" || ch === '"') {
        const quote = ch
        i++
        while (i < source.length && source[i] !== quote) {
          if (source[i] === '\\') i++ // skip escaped char
          i++
        }
        i++
        continue
      }
      
      // Template literal
      if (ch === '`') {
        i++
        while (i < source.length) {
          if (source[i] === '\\' && i + 1 < source.length) {
            i += 2 // skip escaped char
            continue
          }
          if (source[i] === '`') break
          // Skip template expressions ${...}
          if (source[i] === '$' && i + 1 < source.length && source[i + 1] === '{') {
            let exprDepth = 1
            i += 2
            while (i < source.length && exprDepth > 0) {
              if (source[i] === '{') exprDepth++
              if (source[i] === '}') exprDepth--
              i++
            }
            continue
          }
          i++
        }
        i++
        continue
      }
      
      if (ch === '{') braceDepth++
      if (ch === '}') braceDepth--
      
      if (braceDepth === 0) {
        // End of object
        const objStr = source.substring(objectStart, i + 1)
        const post = parsePost(objStr)
        if (post) posts.push(post)
        inArray = false
        i++
        continue
      }
    }
    
    i++
  }
  
  return posts
}

function parsePost(objStr) {
  // Extract fields using regex
  const slug = extractStrField(objStr, 'slug')
  if (!slug) return null
  
  const title = extractStrField(objStr, 'title')
  if (!title) return null
  
  const description = extractStrField(objStr, 'description')
  const metaDescription = extractStrField(objStr, 'metaDescription') || description
  const categorySlug = extractStrField(objStr, 'categorySlug')
  const categoryName = extractStrField(objStr, 'categoryName')
  const datePublished = extractStrField(objStr, 'datePublished')
  const dateModified = extractStrField(objStr, 'dateModified')
  const author = extractStrField(objStr, 'author') || 'Вячеслав Подварчан'
  const readingTime = extractNumField(objStr, 'readingTime') || 5
  
  // Keywords array
  const kwMatch = objStr.match(/keywords:\s*\[([^\]]*?)\]/)
  let keywords = []
  if (kwMatch) {
    keywords = kwMatch[1].match(/'([^']+)'/g)?.map(k => k.replace(/'/g, '')) || []
  }
  
  // Image path
  const image = extractStrField(objStr, 'image')
  
  // Body template literal
  const body = extractBody(objStr)
  
  return { slug, title, description, metaDescription, keywords, categorySlug, categoryName, datePublished, dateModified, author, readingTime, image, body }
}

function extractStrField(objStr, fieldName) {
  // Match: fieldName: 'value' — handling escaped quotes inside
  const re = new RegExp(`${fieldName}:\\s*'((?:[^'\\\\]|\\\\.)*)'`)
  const m = objStr.match(re)
  if (!m) return ''
  // Unescape
  return m[1].replace(/\\(['\\])/g, '$1')
}

function extractNumField(objStr, fieldName) {
  const re = new RegExp(`${fieldName}:\\s*(\\d+)`)
  const m = objStr.match(re)
  return m ? parseInt(m[1]) : null
}

function extractBody(objStr) {
  // Find the body field's template literal
  const idx = objStr.indexOf('body:')
  if (idx < 0) return ''
  
  const afterBody = objStr.substring(idx + 5) // after "body:"
  const backtickStart = afterBody.indexOf('`')
  if (backtickStart < 0) return ''
  
  let body = ''
  let i = backtickStart + 1
  
  while (i < afterBody.length) {
    const ch = afterBody[i]
    
    if (ch === '\\' && i + 1 < afterBody.length && afterBody[i + 1] === '`') {
      body += '`'
      i += 2
      continue
    }
    
    if (ch === '`') {
      // Found closing backtick
      break
    }
    
    // Skip template expressions ${...}
    if (ch === '$' && i + 1 < afterBody.length && afterBody[i + 1] === '{') {
      let depth = 1
      i += 2
      while (i < afterBody.length && depth > 0) {
        if (afterBody[i] === '{') depth++
        if (afterBody[i] === '}') depth--
        i++
      }
      body += '${...}'
      continue
    }
    
    body += ch
    i++
  }
  
  // Clean up: remove .trim() suffix if present
  if (body.endsWith('.trim()')) {
    body = body.substring(0, body.length - 7)
  }
  
  return body.trim()
}

// ── Testimonials data ──
const testimonialsData = [
  { n: 'Анна, 34', tRu: 'Я просыпалась уже уставшей. Внутри постоянно было ощущение тревоги. После нескольких сеансов я впервые за долгое время почувствовала внутреннюю тишину. Особенно сильно на меня повлиял голос и сама атмосфера работы.', tUk: 'Я прокидалася вже втомленою. Всередині постійно було відчуття тривоги. Після кількох сеансів я вперше за довгий час відчула внутрішню тишу. Особливо сильно на мене вплинув голос і сама атмосфера роботи.', r: 'Постоянная тревога и внутреннее напряжение — появилась внутренняя тишина и спокойствие', rUk: 'Постійна тривога та внутрішнє напруження — з\'явилася внутрішня тиша та спокій', rate: 5 },
  { n: 'Максим, 41', tRu: 'Годами откладывал запуск своего проекта. Во время работы начали всплывать старые установки и страхи. Отдельно хочу отметить песню, созданную специально под мой запрос.', tUk: 'Роками відкладав запуск свого проєкту. Під час роботи почали спливати старі установки та страхи. Окремо хочу відзначити пісню, створену спеціально під мій запит.', r: 'Самосаботаж и страх реализации — запуск проекта, внутренняя перестройка', rUk: 'Самосаботаж і страх реалізації — запуск проєкту, внутрішня перебудова', rate: 5 },
  { n: 'Елена, 29', tRu: 'Я потеряла вкус к жизни. После общения с Вячеславом появилось ощущение, что я снова начинаю чувствовать себя живой. Музыка и голос действовали очень глубоко.', tUk: 'Я втратила смак до життя. Після спілкування з В\'ячеславом з\'явилося відчуття, що я знову починаю відчувати себе живою. Музика та голос діяли дуже глибоко.', r: 'Эмоциональное выгорание — возвращение вкуса к жизни, энергии и спокойствия', rUk: 'Емоційне вигорання — повернення смаку до життя, енергії та спокою', rate: 5 },
  { n: 'Дмитрий, 38', tRu: 'Внутри постоянно звучал голос, что я недостаточно хорош. Сеансы помогли увидеть, насколько сильно мною управляли старые эмоциональные сценарии.', tUk: 'Всередині постійно звучав голос, що я недостатньо хороший. Сеанси допомогли побачити, наскільки сильно мною керували старі емоційні сценарії.', r: 'Внутренний критик и чувство вины — принятие себя, снижение самокритики', rUk: 'Внутрішній критик і почуття провини — прийняття себе, зниження самокритики', rate: 5 },
  { n: 'Наталья, 45', tRu: 'Было ощущение, будто я живу не своей жизнью. Работа шла очень мягко, но постепенно начали происходить внутренние изменения.', tUk: 'Було відчуття, ніби я живу не своїм життям. Робота йшла дуже м\'яко, але поступово почали відбуватися внутрішні зміни.', r: 'Потеря смысла и личностный кризис — возвращение контакта с собой', rUk: 'Втрата сенсу та особистісна криза — повернення контакту з собою', rate: 5 },
  { n: 'Сергей, 32', tRu: 'Сначала скептически относился к онлайн-формату. Панические состояния стали значительно слабее, а музыка помогала возвращать спокойствие между сеансами.', tUk: 'Спочатку скептично ставився до онлайн-формату. Панічні стани стали значно слабшими, а музика допомагала повертати спокій між сеансами.', r: 'Тревога и панические состояния — снижение приступов, появление спокойствия', rUk: 'Тривога та панічні стани — зниження нападів, поява спокою', rate: 5 },
  { n: 'Ирина, 36', tRu: 'Постоянно попадала в одинаковые болезненные отношения. После нескольких недель появилось ощущение внутренней опоры и спокойствия.', tUk: 'Постійно потрапляла в однакові болючі стосунки. Після кількох тижнів з\'явилося відчуття внутрішньої опори та спокою.', r: 'Повторяющиеся сценарии в отношениях — выход из цикла, появление внутренней опоры', rUk: 'Повторювані сценарії у стосунках — вихід із циклу, поява внутрішньої опори', rate: 5 },
  { n: 'Андрей, 27', tRu: 'Я словно постоянно жил с включённым внутренним шумом. Работа через голос и музыку оказалась неожиданно глубокой.', tUk: 'Я наче постійно жив із увімкненим внутрішнім шумом. Робота через голос і музику виявилася несподівано глибокою.', r: 'Прокрастинация и потеря энергии — возвращение энергии и желания действовать', rUk: 'Прокрастинація та втрата енергії — повернення енергії та бажання діяти', rate: 5 },
  { n: 'Ольга, 40', tRu: 'Долгое время носила всё в себе — обиды, страхи, напряжение. После работы появилось ощущение внутреннего освобождения.', tUk: 'Довгий час носила все в собі — образи, страхи, напруження. Після роботи з\'явилося відчуття внутрішнього звільнення.', r: 'Подавленные эмоции и психосоматика — внутреннее освобождение, уход телесных симптомов', rUk: 'Придушені емоції та психосоматика — внутрішнє звільнення, зникнення тілесних симптомів', rate: 5 },
  { n: 'Виктор, 51', tRu: 'Очень долго жил в состоянии постоянного контроля и страха перед будущим. После сеансов стало больше внутреннего спокойствия и доверия к себе.', tUk: 'Дуже довго жив у стані постійного контролю та страху перед майбутнім. Після сеансів стало більше внутрішнього спокою та довіри до себе.', r: 'Внутренний страх перемен — спокойствие, доверие к себе и жизни', rUk: 'Внутрішній страх змін — спокій, довіра до себе та життя', rate: 5 },
]

// ── Main execution ──
const ruSrc = load('src/content/blog/index.ts')
const ukSrc = load('src/content/blog/index-uk.ts')

console.error(`Loaded: RU ${ruSrc.length} chars, UK ${ukSrc.length} chars`)

const ruPosts = extractPosts(ruSrc)
const ukPosts = extractPosts(ukSrc)

console.error(`Extracted: ${ruPosts.length} RU posts, ${ukPosts.length} UK posts`)

if (ruPosts.length === 0) {
  console.error('ERROR: No RU posts extracted! Check the extraction logic.')
  process.exit(1)
}

// ── Build SQL ──
const lines = []

for (let i = 0; i < ruPosts.length; i++) {
  const ru = ruPosts[i]
  const uk = ukPosts.find(p => p.slug === ru.slug)
  
  const postId = uuid()
  const ts = now()
  const catId = CATEGORIES[ru.categorySlug] || null
  const pubDate = ru.datePublished || '2026-01-01'
  const readMin = ru.readingTime || 5
  
  const pubTs = new Date(pubDate).getTime() ? new Date(pubDate).toISOString() : new Date().toISOString()
  const nowTs = new Date().toISOString()
  const coverImg = ru.image || null
  // 1. blog_post
  lines.push(`INSERT INTO blog_posts (id, category_id, author_id, status, cover_image_id, reading_minutes, published_at, scheduled_at, created_at, updated_at) VALUES (${esc(postId)}, ${esc(catId)}, NULL, 'PUBLISHED', ${esc(coverImg)}, ${readMin}, ${esc(pubTs)}, NULL, ${esc(nowTs)}, ${esc(nowTs)});`)
  
  // 2. RU translation
  const ruTrId = uuid()
  lines.push(`INSERT INTO blog_post_translations (id, post_id, locale, slug, title, excerpt, content_json, content_html, table_of_contents_json, faq_json, seo_meta_id) VALUES (${esc(ruTrId)}, ${esc(postId)}, 'ru', ${esc(ru.slug)}, ${esc(ru.title)}, ${esc(ru.description || '')}, NULL, ${esc(ru.body || '')}, NULL, NULL, NULL);`)
  
  // 3. UK translation
  const ukTrId = uuid()
  const ukTitle = uk ? uk.title : ru.title
  const ukDesc = uk ? (uk.description || '') : (ru.description || '')
  const ukBody = uk ? (uk.body || '') : (ru.body || '')
  lines.push(`INSERT INTO blog_post_translations (id, post_id, locale, slug, title, excerpt, content_json, content_html, table_of_contents_json, faq_json, seo_meta_id) VALUES (${esc(ukTrId)}, ${esc(postId)}, 'uk', ${esc(ru.slug)}, ${esc(ukTitle)}, ${esc(ukDesc)}, NULL, ${esc(ukBody)}, NULL, NULL, NULL);`)
  
  // 4. RU SEO meta
  lines.push(`INSERT INTO seo_meta (id, entity_type, entity_id, locale, title, description, keywords, canonical_path, og_title, og_description, og_image_id, robots_index, robots_follow, schema_type, created_at, updated_at) VALUES (${esc(uuid())}, 'blog_post', ${esc(postId)}, 'ru', ${esc(ru.title)}, ${esc(ru.metaDescription || ru.description || '')}, ${esc((ru.keywords || []).join(', '))}, ${esc('/ru/blog/' + ru.slug)}, ${esc(ru.title)}, ${esc(ru.metaDescription || ru.description || '')}, NULL, 1, 1, 'Article', ${esc(nowTs)}, ${esc(nowTs)});`)
  
  // 5. UK SEO meta
  const ukMetaDesc = uk ? (uk.metaDescription || uk.description || '') : (ru.metaDescription || ru.description || '')
  const ukKeywords = uk ? (uk.keywords || []) : (ru.keywords || [])
  lines.push(`INSERT INTO seo_meta (id, entity_type, entity_id, locale, title, description, keywords, canonical_path, og_title, og_description, og_image_id, robots_index, robots_follow, schema_type, created_at, updated_at) VALUES (${esc(uuid())}, 'blog_post', ${esc(postId)}, 'uk', ${esc(ukTitle)}, ${esc(ukMetaDesc)}, ${esc(ukKeywords.join(', '))}, ${esc('/uk/blog/' + ru.slug)}, ${esc(ukTitle)}, ${esc(ukMetaDesc)}, NULL, 1, 1, 'Article', ${esc(nowTs)}, ${esc(nowTs)});`)
}

// ── Testimonials ──
for (const t of testimonialsData) {
  const tId = uuid()
  const ts = now()
  const nowStr = new Date().toISOString()
  lines.push(`INSERT INTO testimonials (id, status, client_name, client_age, avatar_initials, rating, source, consent_confirmed, published_at, sort_order, created_at) VALUES (${esc(tId)}, 'PUBLISHED', ${esc(t.n)}, NULL, NULL, ${t.rate}, 'site', 1, ${esc(nowStr)}, 0, ${esc(nowStr)});`)
  lines.push(`INSERT INTO testimonial_translations (id, testimonial_id, locale, problem, result, text) VALUES (${esc(uuid())}, ${esc(tId)}, 'ru', NULL, ${esc(t.r)}, ${esc(t.tRu)});`)
  lines.push(`INSERT INTO testimonial_translations (id, testimonial_id, locale, problem, result, text) VALUES (${esc(uuid())}, ${esc(tId)}, 'uk', NULL, ${esc(t.rUk)}, ${esc(t.tUk)});`)
}

// ── Output ──
console.log('-- === SEED: ALL blog posts + testimonials + SEO meta ===')
console.log(`-- Posts: ${ruPosts.length} (×2 locales), Testimonials: ${testimonialsData.length} (×2 locales)`)
console.log(`-- Expected SQL lines: ${lines.length}`)
console.log(lines.join('\n'))
console.log('-- Done.')
