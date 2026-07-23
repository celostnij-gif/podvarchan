import { readFileSync } from 'fs'

const ru = JSON.parse(readFileSync('messages/ru.json', 'utf-8'))
const uk = JSON.parse(readFileSync('messages/uk.json', 'utf-8'))

const BRAND_RU = 'Вячеслав Подварчан'
const BRAND_UK = "В'ячеслав Подварчан"

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildTitle(title, locale) {
  if (!title) return '(no title)'
  const brand = locale === 'uk' ? BRAND_UK : BRAND_RU
  const clean = title
    .replace(new RegExp(`\\s*\\|\\s*${esc(BRAND_RU)}$`), '')
    .replace(new RegExp(`\\s*\\|\\s*${esc(BRAND_UK)}$`), '')
    .trim()
  if (clean.length === 0) return brand
  const suffixed = `${clean} | ${brand}`
  if (suffixed.length <= 60) return suffixed
  return clean.length <= 60 ? clean : clean.slice(0, 59) + '…'
}

const rows = []

// Static pages
const staticPages = [
  ['/ru/blog/', ru.blog?.pageTitle, 'ru'],
  ['/ru/disclaimer/', ru.disclaimer?.pageTitle, 'ru'],
  ['/ru/faq/', ru.faq?.pageTitle, 'ru'],
  ['/ru/kontakty/', ru.contacts?.pageTitle, 'ru'],
  ['/ru/metod/', ru.method?.metaTitle, 'ru'],
  ['/ru/ob-avtore/', ru.about?.metaTitle, 'ru'],
  ['/ru/politika-konfidentsialnosti/', ru.privacy?.pageTitle, 'ru'],
  ['/ru/uslugi/', ru.services?.pageTitle, 'ru'],
  ['/uk/blog/', uk.blog?.pageTitle, 'uk'],
  ['/uk/disclaimer/', uk.disclaimer?.pageTitle, 'uk'],
  ['/uk/kontakty/', uk.contacts?.pageTitle, 'uk'],
  ['/uk/metod/', uk.method?.metaTitle, 'uk'],
  ['/uk/ob-avtore/', uk.about?.metaTitle, 'uk'],
  ['/uk/politika-konfidentsialnosti/', uk.privacy?.pageTitle, 'uk'],
  ['/uk/uslugi/', uk.services?.pageTitle, 'uk'],
]

// Service pages — both RU and UK use same slugs in servicesData
const ruServices = ru.servicesData || []
const ukServices = uk.servicesData || []

for (const svc of ruServices) {
  staticPages.push([`/ru/uslugi/${svc.slug}/`, svc.title, 'ru'])
  const ukSvc = ukServices.find(u => u.slug === svc.slug)
  if (ukSvc) staticPages.push([`/uk/uslugi/${ukSvc.slug}/`, ukSvc.title, 'uk'])
}

staticPages.sort((a, b) => a[0].localeCompare(b[0]))

for (const [path, stored, locale] of staticPages) {
  const brand = locale === 'uk' ? BRAND_UK : BRAND_RU
  const newTitle = buildTitle(stored, locale)
  const oldTitle = stored ? `${stored} | ${brand} | ${brand}` : '(missing)'
  rows.push({ path, oldTitle, newTitle })
}

console.log('| URL | Старий title (довжина) | Новий title (довжина) |')
console.log('| --- | --- | --- |')
for (const r of rows) {
  console.log(`| ${r.path} | ${r.oldTitle} (${r.oldTitle.length}) | ${r.newTitle} (${r.newTitle.length}) |`)
}
console.log(`\nВсього: ${rows.length} сторінок`)
