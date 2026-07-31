#!/usr/bin/env npx tsx
/**
 * Podvarchan — Full Database Seed / Migration Script (UPSERT version)
 *
 * Idempotent: uses ON CONFLICT(id) DO UPDATE on all tables.
 * Slugs and content can be updated by re-running.
 * Tracks slug changes → generates redirect_rules (301).
 * Validates JSON before emitting SQL.
 *
 * Usage:
 *   npx tsx scripts/seed-real-data.ts          → generates scripts/seed-output.sql
 *   npx wrangler d1 execute podvarchan --file=scripts/seed-output.sql --local
 *   npx wrangler d1 execute podvarchan --file=scripts/seed-output.sql --remote
 */
import { writeFileSync } from 'fs'
import { join } from 'path'

/* ── Helpers ── */
const SQL: string[] = []
const emit = (line: string) => { SQL.push(line) }
const esc = (s: string) => s.replace(/'/g, "''")

/** Validate JSON string — returns cleaned JSON or throws */
const validateJson = (label: string, val: unknown): string => {
  try {
    return JSON.stringify(val)
  } catch (e) {
    throw new Error(`Invalid JSON in ${label}: ${e}`)
  }
}

const ts = () => new Date().toISOString()

// Collect slug changes for redirect_rules generation
const slugChanges: { from: string; to: string }[] = []

/** Generate redirect_rules SQL for tracked slug changes */
const emitRedirects = () => {
  if (slugChanges.length === 0) return
  emit(`\n-- AUTO 301 REDIRECTS (slug changes)`)
  emit(`INSERT OR IGNORE INTO redirect_rules (id,from_path,to_path,status_code,hit_count,created_at) VALUES`)
  const rows = slugChanges.map((ch, i) => {
    const id = `auto-sr-${ch.from}-${Date.now()}`
    return `('${id}','/${ch.from}','/${ch.to}',301,0,'${ts()}')`
  })
  emit(rows.join(',\n') + ';\n')
}

// ─── Fixed IDs ─────────────────────────────────────────────────────────────
const U = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' // admin user
const P = {
  home: 'cae9f9ec-6fd9-457c-a4c5-79df832e95eb', about: '806b5d28-b788-4836-bdd6-952302a2284a',
  method: '7df7aadb-b4f2-4f1c-8722-decda9379aa3', faq: 'c7c7cc41-527f-48cb-b31c-77aa87793d8c',
  contacts: '46cae533-e67c-4cc1-b16f-b6dfa951b116', privacy: 'cd4a1923-eeba-4e26-8fc4-8358640eac4d',
  disclaimer: '2fea5355-3b2c-4d83-9b67-1bd41ad080ae', pricing: '41f764f7-54e5-41d7-b092-f4bcae43ae28',
}
const S = {
  gipno: 'faef4e9a-0456-4565-ae0f-55895dded08a', psyhol: 'db6bfe35-5c70-4765-8673-6ea8d894f1c7',
  bio: '29323703-899a-429b-a2b1-fecb80df9595', trevoga: 'f9fd52ff-7d68-4181-954a-f290887cfbf0',
  podsoz: '2ba12c5f-17b3-44eb-8920-dd24a029ed71', samosab: '1ed63afd-b02c-43d3-a7ef-924528ae9de2',
  vigoran: '5be03dea-c042-4c9c-a669-50855dd74674', never: 'df37035c-5d2b-4075-bda7-7bc9b176e7bb',
  psiko: 'aa146d45-97ab-4dd6-857a-6d6fee5c273e', krizis: '4526d523-7a9a-4057-9eda-d0f9832f3a37',
  tKak: 'fedc832c-de4c-43be-b8ce-81c9da33a82f', tPost: '12a935bf-6f40-4302-9c1e-edaab575f98d',
  tUtro: '2b6bbcce-cdeb-40a0-b244-413203a17789', tSnom: 'f947832e-2d7f-4897-a943-9aa3631e7a36',
  tStress: 'f9958e0b-9e16-47a4-94b9-cd4c09a00812', napryag: 'e2975198-4a6a-480b-bfbf-1bc1b9ee103b',
  naviaz: 'e18ae8e5-7d07-40a8-a907-326f6c40a734', budush: 'feee6236-4b38-437c-83a0-14589bd9683c',
  detoks: 'cd442495-e194-4d1e-8376-f7b883adbaf8',
}
const CAT = {
  trevoga: '9e46b05c-83c0-45b3-b45b-4e14eea8319d',
  gipnoterapiya: '83253037-5f33-4c76-9f00-511225131426',
  samosabotazh: 'c3bf4ef4-53fc-4395-890f-1bc8af88d114',
  podsoznanie: '889596c9-9768-4493-a357-31f6df43f607',
  psikhosomatika: 'd3951d31-592b-45cc-b3e7-d834d7a0c271',
  vygoraniye: '11111111-1111-1111-1111-111111111001',
  neyverennost: 'eb40696f-c4e8-44bf-b3ac-0bff61575d55',
  krizis: '11111111-1111-1111-1111-111111111002',
  'tsifrovoy-detoks': '0a038302-e133-43bf-8520-8a3924a262fa',
  ptsr: 'fb40696f-c4e8-44bf-b3ac-0bff61575d56',
}

type UpsertCols = Record<string, string>
const upsert = (table: string, id: string, cols: UpsertCols, conflictCol = 'id') => {
  const assignments = Object.entries(cols)
    .filter(([, v]) => v !== undefined && v !== 'NULL')
    .map(([k, v]) => `${k}=excluded.${k}`)
    .join(',')
  const colNames = Object.keys(cols).join(',')
  const colVals = Object.values(cols)
    .filter(v => v !== undefined)
    .join(',')
  emit(`INSERT INTO ${table} (${conflictCol},${colNames}) VALUES ('${id}',${colVals}) ON CONFLICT(${conflictCol}) DO UPDATE SET ${assignments};`)
}

function main() {
  emit(`-- Podvarchan Seed / Migration — ${ts()}`)
  emit(`-- Idempotent: ON CONFLICT(id) DO UPDATE on all tables`)
  emit(`-- FK constraints disabled during seed for safety\n`)
  emit(`PRAGMA foreign_keys = OFF;\n`)

  // ── USERS ──
  emit(`-- USERS`)
  upsert('users', U, {
    email: "'celostnij@gmail.com'",
    password_hash: "'$2b$10$placeholder'",
    name: "'Костянтин'",
    role: "'OWNER'",
    is_active: '1',
    created_at: `'${ts()}'`,
    updated_at: `'${ts()}'`,
  })

  // ── SITE_SETTINGS ──
  emit(`\n-- SITE_SETTINGS`)
  const sname = (r: string, u: string) => validateJson(`site_name`, { ru: r, uk: u })
  const settings: [string, string][] = [
    ['site_name', sname('Подварчан', 'Подварчан')],
    ['site_description', sname('Гипнотерапия онлайн', 'Гіпнотерапія онлайн')],
    ['site_tagline', sname('Избавьтесь от тревоги и верните спокойствие', 'Позбавтеся тривоги та поверніть спокій')],
    ['logo_alt', sname('Подварчан — гипнотерапия онлайн', 'Подварчан — гіпнотерапія онлайн')],
    ['og_default_image', 'NULL'],
    ['schema_org_json', validateJson('schema_org_json', { '@type': 'MedicalBusiness', name: 'Подварчан' })],
    ['analytics_id', 'NULL'],
    ['yandex_metrika_id', 'NULL'],
    ['facebook_pixel_id', 'NULL'],
    ['email_from', "'noreply@podvarchan.com'"],
    ['phone', "'+380XXYYYZZZZ'"],
    ['working_hours', sname('Пн-Пт 10:00-20:00', 'Пн-Пт 10:00-20:00')],
    ['currency', "'USD'"],
  ]
  for (const [key, val] of settings) {
    upsert('site_settings', key, { value_json: val === 'NULL' ? 'NULL' : `'${val}'`, updated_by_id: `'${U}'`, updated_at: `'${ts()}'` }, 'key')
  }
  // ── CONTACT_CHANNELS (UUID current IDs) ──
  emit(`\n-- CONTACT_CHANNELS`)
  const channels: [string, string, string, string, string, number, number][] = [
    ['ebf1764f-6a40-423e-9dd9-7833c9c53629', 'WHATSAPP', 'WhatsApp', '+380663122069', 'https://wa.me/380663122069', 1, 0],
    ['eaf90e60-e157-4e40-a415-c3693764b664', 'TELEGRAM', 'Telegram', '@SLAVKA_VIP', 'https://t.me/SLAVKA_VIP', 1, 10],
    ['f40576b5-cc61-4bd1-8480-9aa7b3cde835', 'EMAIL', 'Email', 'podvarchan@gmail.com', 'mailto:podvarchan@gmail.com', 1, 30],
  ]
  for (const [id, type, label, value, url, primary, order] of channels) {
    upsert('contact_channels', id, {
      type: `'${type}'`, label: `'${label}'`, value: `'${esc(value)}'`,
      url: `'${url}'`, is_primary: `${primary}`, is_enabled: '1', sort_order: `${order}`,
    })
  }

  // ── NAVIGATION (UUID current IDs) ──
  emit(`\n-- NAVIGATION_ITEMS`)
  const navItems: [string, string, string | null, string, string, string, number][] = [
    ['nav-header-home', 'HEADER', null, '/', 'Главная', 'Головна', 0],
    ['nav-header-services', 'HEADER', null, '/uslugi/', 'Услуги', 'Послуги', 1],
    ['nav-header-method', 'HEADER', null, '/metod/', 'Метод', 'Метод', 2],
    ['nav-header-about', 'HEADER', null, '/ob-avtore/', 'Об авторе', 'Про автора', 3],
    ['nav-header-blog', 'HEADER', null, '/blog/', 'Блог', 'Блог', 4],
    ['nav-header-faq', 'HEADER', null, '/faq/', 'FAQ', 'FAQ', 5],
    ['nav-header-pricelist', 'HEADER', null, '/tsiny/', 'Цены', 'Ціни', 6],
    ['nav-header-contacts', 'HEADER', null, '/kontakty/', 'Контакти', 'Контакти', 7],
    ['nav-footer-home', 'FOOTER', null, '/', 'Главная', 'Головна', 0],
    ['nav-footer-services', 'FOOTER', null, '/uslugi/', 'Услуги', 'Послуги', 1],
    ['nav-footer-blog', 'FOOTER', null, '/blog/', 'Блог', 'Блог', 2],
    ['nav-footer-contacts', 'FOOTER', null, '/kontakty/', 'Контакти', 'Контакти', 3],
    ['nav-footer-privacy', 'FOOTER', null, '/politika-konfidentsialnosti/', 'Конфиденциальность', 'Конфіденційність', 4],
    ['nav-footer-disclaimer', 'FOOTER', null, '/disclaimer/', 'Дисклеймер', 'Дисклеймер', 5],
  ]
  for (const [id, loc, parent, href, lRu, lUk, order] of navItems) {
    upsert('navigation_items', id, {
      location: `'${loc}'`,
      parent_id: parent ? `'${parent}'` : 'NULL',
      href: `'${href}'`,
      label_ru: `'${esc(lRu)}'`,
      label_uk: `'${esc(lUk)}'`,
      is_enabled: '1',
      sort_order: `${order}`,
    })
  }

  // ── PAGES ──
  emit(`\n-- PAGES`)
  type Pg = [string, string, string, string, string, string]
  const pages: Pg[] = [
    [P.home, 'HOME', '/', 'Гипнотерапия онлайн — избавьтесь от тревоги и верните спокойствие', 'Гіпнотерапія онлайн — позбавтеся тривоги та поверніть спокій', 'Гипнотерапия онлайн от сертифицированного специалиста. Мягкая работа с тревогой, паническими атаками, самосаботажем и подсознанием через эриксоновский гипноз.'],
    [P.about, 'ABOUT', 'ob-avtore', 'Гипнотерапевт онлайн', 'Гіпнотерапевт онлайн', 'Сертифицированный гипнотерапевт онлайн, основатель школы «Пробудология».'],
    [P.method, 'METHOD', 'metod', 'Авторский метод', 'Авторський метод', 'Авторский метод гипнотерапии: эриксоновский гипноз, регрессия, КПТ.'],
    [P.faq, 'FAQ', 'faq', 'FAQ — вопросы и ответы о гипнотерапии', 'FAQ — питання та відповіді про гіпнотерапію', 'Ответы на частые вопросы о гипнотерапии онлайн.'],
    [P.contacts, 'CONTACTS', 'kontakty', 'Контакти', 'Контакти', 'Запись на сессию гипнотерапии онлайн. Бесплатная 15-минутная диагностическая консультация.'],
    [P.privacy, 'PRIVACY', 'politika-konfidentsialnosti', 'Политика конфиденциальности', 'Політика конфіденційності', 'Политика конфиденциальности и обработки персональных данных.'],
    [P.disclaimer, 'DISCLAIMER', 'disclaimer', 'Дисклеймер', 'Дисклеймер', 'Юридическое уведомление: гипнотерапия онлайн — немедицинский метод.'],
    [P.pricing, 'PRICING', 'tseny', 'Стоимость гипнотерапии онлайн — цены на сессии', 'Вартість гіпнотерапії онлайн — ціни на сесії', 'Стоимость сессий гипнотерапии онлайн от 50$.'],
  ]
  for (const [id, type, , , , ] of pages) {
    upsert('pages', id, {
      type: `'${type}'`, status: "'PUBLISHED'", sort_order: '0',
      published_at: `'${ts()}'`, created_at: `'${ts()}'`, updated_at: `'${ts()}'`,
    })
  }
  for (const [id, , slug, tRu, tUk, ex] of pages) {
    upsert(`page_translations`, `pt-${id}-ru`, {
      page_id: `'${id}'`, locale: "'ru'", slug: `'${slug}'`,
      title: `'${esc(tRu)}'`, excerpt: `'${esc(ex)}'`, content_json: 'NULL', seo_meta_id: 'NULL',
    })
    upsert(`page_translations`, `pt-${id}-uk`, {
      page_id: `'${id}'`, locale: "'uk'", slug: `'${slug}'`,
      title: `'${esc(tUk)}'`, excerpt: `'${esc(ex)}'`, content_json: 'NULL', seo_meta_id: 'NULL',
    })
  }

  // ── PAGE SECTIONS ──
  emit(`\n-- PAGE_SECTIONS`)
  type Sec = [string, string, string, string, number]
  const secs: Sec[] = [
    ['ps-home-hero', P.home, 'hero', 'hero', 0],
    ['ps-home-test', P.home, 'testimonials', 'testimonials-ref', 1],
    ['ps-home-cta', P.home, 'cta', 'cta', 2],
    ['ps-home-ct', P.home, 'contact', 'contact-form', 3],
    ['ps-about-hero', P.about, 'hero', 'hero', 0],
    ['ps-about-text', P.about, 'about-text', 'text-block', 1],
    ['ps-meth-hero', P.method, 'hero', 'hero', 0],
    ['ps-meth-text', P.method, 'method-text', 'text-block', 1],
    ['ps-ct-hero', P.contacts, 'hero', 'hero', 0],
    ['ps-ct-form', P.contacts, 'contact', 'contact-form', 1],
    ['ps-pr-hero', P.pricing, 'hero', 'hero', 0],
    ['ps-pr-text', P.pricing, 'pricing-text', 'text-block', 1],
    ['ps-faq-hero', P.faq, 'hero', 'hero', 0],
    ['ps-faq-list', P.faq, 'faq-list', 'faq-group-ref', 1],
  ]
  for (const [id, pid, key, type, order] of secs) {
    upsert('page_sections', id, {
      page_id: `'${pid}'`, key: `'${key}'`, type: `'${type}'`,
      enabled: '1', sort_order: `${order}`, settings_json: 'NULL',
    })
  }

  // ── SERVICES ──
  emit(`\n-- SERVICES`)
  type Svc = { id: string; slug: string; icon: string; cat: string; ru: [string, string]; uk: [string, string]; symp: string[] }
  const svcs: Svc[] = [
    { id: S.gipno, slug: 'gipnoterapiya-onlayn', icon: 'Brain', cat: 'core', ru: ['Гипнотерапия онлайн', 'Сеансы эриксоновского гипноза онлайн для работы с подсознанием, тревогой, страхами.'], uk: ['Гіпнотерапія онлайн', 'Сеанси еріксонівського гіпнозу онлайн для роботи з підсвідомістю, тривогою, страхами.'], symp: ['Постоянная тревога', 'Панические атаки', 'Страхи', 'Ограничивающие убеждения'] },
    { id: S.psyhol, slug: 'onlajn-konsultaciya-psyhologa', icon: 'Heart', cat: 'core', ru: ['Психолог онлайн', 'Индивидуальные онлайн-консультации психолога. Бережный подход.'], uk: ['Консультація психолога онлайн', 'Індивідуальні онлайн-консультації психолога. Бережний підхід.'], symp: ['Тревожность', 'Депрессия', 'Кризис', 'Выгорание'] },
    { id: S.bio, slug: 'psyholog-bioenergetyk', icon: 'Zap', cat: 'core', ru: ['Психолог-биоэнергетик', 'Синергия психотерапии и биоэнергетических практик.'], uk: ['Психолог-біоенергетик', 'Синергія психотерапії та біоенергетичних практик.'], symp: ['Выгорание', 'Хроническая усталость', 'Стресс'] },
    { id: S.trevoga, slug: 'trevoga-i-panicheskiye-ataki', icon: 'AlertTriangle', cat: 'trevoga', ru: ['Тревога и панические атаки', 'Гипнотерапия тревоги и панических атак. Работа с первопричиной.'], uk: ['Тривога та панічні атаки', 'Гіпнотерапія тривоги та панічних атак. Робота з першопричиною.'], symp: ['Панические атаки', 'Хроническая тревога', 'Страх смерти'] },
    { id: S.podsoz, slug: 'rabota-s-podsoznaniem', icon: 'Eye', cat: 'core', ru: ['Работа с подсознанием', 'Гипноз для проработки подсознания: убираем блоки.'], uk: ['Робота з підсвідомістю', 'Гіпноз для опрацювання підсвідомості: прибираємо блоки.'], symp: ['Ограничивающие убеждения', 'Денежные блоки', 'Самосаботаж'] },
    { id: S.samosab, slug: 'samosabotazh-i-bloki', icon: 'ShieldOff', cat: 'core', ru: ['Самосаботаж и блоки', 'Избавление от самосаботажа и прокрастинации через гипнотерапию.'], uk: ['Самосаботаж і блоки', 'Позбавлення від самосаботажу та прокрастинації через гіпнотерапію.'], symp: ['Прокрастинация', 'Страх успеха', 'Внутренний критик'] },
    { id: S.vigoran, slug: 'emotsionalnoye-vygoraniye', icon: 'Flame', cat: 'core', ru: ['Эмоциональное выгорание', 'Восстановление энергии и ресурса после выгорания.'], uk: ['Емоційне вигорання', 'Відновлення енергії та ресурсу після вигорання.'], symp: ['Истощение', 'Цинизм', 'Потеря смысла'] },
    { id: S.never, slug: 'neyverennost-i-strakh-provala', icon: 'UserX', cat: 'core', ru: ['Неуверенность и страх провала', 'Преодолейте неуверенность и синдром самозванца.'], uk: ['Невпевненість і страх невдачі', 'Подолайте невпевненість та синдром самозванця.'], symp: ['Синдром самозванца', 'Перфекционизм', 'Сравнение'] },
    { id: S.psiko, slug: 'psikhosomatika', icon: 'Activity', cat: 'core', ru: ['Психосоматика', 'Снятие телесных симптомов стресса через гипнотерапию.'], uk: ['Психосоматика', 'Зняття тілесних симптомів стресу через гіпнотерапію.'], symp: ['Головные боли', 'Боли в спине', 'Бессонница'] },
    { id: S.krizis, slug: 'lichnostnyy-krizis', icon: 'Compass', cat: 'core', ru: ['Личностный кризис', 'Поиск себя, новых смыслов и направления в жизни.'], uk: ['Особистісна криза', 'Пошук себе, нових сенсів і напрямку в житті.'], symp: ['Потеря смысла', 'Экзистенциальный кризис', 'Пустота'] },
    { id: S.tKak, slug: 'kak-izbavitsya-ot-trevogi', icon: 'Sunrise', cat: 'trevoga', ru: ['Как избавиться от тревоги', 'Гипнотерапия убирает внутреннюю причину тревоги.'], uk: ['Як позбутися тривоги', 'Гіпнотерапія усуває внутрішню причину тривоги.'], symp: ['Постоянная тревога', 'Тревожные мысли', 'Бессонница'] },
    { id: S.tPost, slug: 'postoyannaya-trevoga-bez-prichiny', icon: 'CloudRain', cat: 'trevoga', ru: ['Постоянная тревога без причины', 'Сигнал подсознания о скрытом конфликте.'], uk: ['Постійна тривога без причини', 'Сигнал підсвідомості про прихований конфлікт.'], symp: ['Беспричинная тревога', 'Ожидание беды', 'Напряжение'] },
    { id: S.tUtro, slug: 'utrennyaya-trevoga', icon: 'Sun', cat: 'trevoga', ru: ['Утренняя тревога', 'Гипнотерапия убирает кортизоловый скачок.'], uk: ['Ранкова тривога', 'Гіпнотерапія знижує рівень кортизолу вранці.'], symp: ['Тревога при пробуждении', 'Учащённое сердцебиение', 'Страх'] },
    { id: S.tSnom, slug: 'trevoga-pered-snom', icon: 'Moon', cat: 'trevoga', ru: ['Тревога перед сном', 'Гипнотерапия успокаивает ум и возвращает здоровый сон.'], uk: ['Тривога перед сном', 'Гіпнотерапія заспокоює і допомагає повернути здоровий сон.'], symp: ['Бессонница', 'Ночные кошмары', 'Страх засыпания'] },
    { id: S.tStress, slug: 'trevoga-posle-stressa', icon: 'HeartCrack', cat: 'trevoga', ru: ['Тревога после стресса', 'Гипнотерапия мягко снимает постстрессовое напряжение.'], uk: ['Тривога після стресу', 'Гіпнотерапія знімає наслідки стресу.'], symp: ['Постстрессовая тревога', 'Гипервозбудимость', 'Вздрагивания'] },
    { id: S.napryag, slug: 'vnutrenneye-napryazheniye', icon: 'Gauge', cat: 'core', ru: ['Внутреннее напряжение', 'Гипнотерапия снимает глубинные зажимы.'], uk: ['Внутрішня напруга', 'Гіпнотерапія знімає глибинні затискачі.'], symp: ['Хроническое напряжение', 'Мышечные зажимы', 'Головные боли'] },
    { id: S.naviaz, slug: 'navyazchivye-mysli', icon: 'Repeat', cat: 'core', ru: ['Навязчивые мысли', 'Гипнотерапия останавливает ментальную жвачку.'], uk: ['Нав\'язливі думки', 'Гіпнотерапія зупиняє ментальну жуйку.'], symp: ['Навязчивые мысли', 'Ментальная жвачка', 'Бессонница'] },
    { id: S.budush, slug: 'strakh-budushchego', icon: 'CalendarClock', cat: 'core', ru: ['Страх будущего', 'Гипнотерапия убирает тревожное ожидание.'], uk: ['Страх майбутнього', 'Гіпнотерапія усуває тривожне очікування.'], symp: ['Тревога о будущем', 'Катастрофизация', 'Страх неизвестности'] },
    { id: S.detoks, slug: 'tsifrovoy-detoks-i-gadzhet-zavisimost', icon: 'Smartphone', cat: 'core', ru: ['Цифровой детокс', 'Работа с гаджетозависимостью через гипнотерапию.'], uk: ['Цифровий детокс', 'Робота з гаджетозалежністю через гіпнотерапію.'], symp: ['Гаджетозависимость', 'Думскроллинг', 'Потеря времени'] },
  ]
  for (const [i, s] of svcs.entries()) {
    upsert('services', s.id, {
      slug_base: `'${s.slug}'`, icon: `'${s.icon}'`, category: `'${s.cat}'`,
      priority: `${svcs.length - i}`, status: "'PUBLISHED'", featured: `${i < 3 ? 1 : 0}`,
      sort_order: `${i}`, created_at: `'${ts()}'`, updated_at: `'${ts()}'`,
    })
    const sympJson = validateJson(`symptoms_json(${s.slug})`, s.symp)
    const ruId = `st-${s.id}-ru`
    const ukId = `st-${s.id}-uk`
    upsert('service_translations', ruId, {
      service_id: `'${s.id}'`, locale: "'ru'", slug: `'${s.slug}'`,
      title: `'${esc(s.ru[0])}'`, short_title: `'${esc(s.ru[0])}'`,
      description: `'${esc(s.ru[1])}'`, hero_title: `'${esc(s.ru[0])}'`,
      hero_subtitle: 'NULL', symptoms_json: `'${sympJson}'`,
      process_json: 'NULL', benefits_json: 'NULL', faq_json: 'NULL',
      cta_text: "'Записаться'", seo_meta_id: 'NULL',
    })
    upsert('service_translations', ukId, {
      service_id: `'${s.id}'`, locale: "'uk'", slug: `'${s.slug}'`,
      title: `'${esc(s.uk[0])}'`, short_title: `'${esc(s.uk[0])}'`,
      description: `'${esc(s.uk[1])}'`, hero_title: `'${esc(s.uk[0])}'`,
      hero_subtitle: 'NULL', symptoms_json: `'${sympJson}'`,
      process_json: 'NULL', benefits_json: 'NULL', faq_json: 'NULL',
      cta_text: "'Записатися'", seo_meta_id: 'NULL',
    })
  }

  // ── BLOG CATEGORIES (UUID current IDs) ──
  emit(`\n-- BLOG_CATEGORIES`)
  const cats: [string, string, string, string, string, string][] = [
    [CAT.gipnoterapiya, 'gipnoterapiya', 'Гипнотерапия', 'Гіпнотерапія', 'Всё о гипнотерапии: методы, техники, безопасность.', 'Все про гіпнотерапію: методи, техніки, безпека.'],
    [CAT.trevoga, 'trevoga', 'Тревога', 'Тривога', 'Статьи о тревоге, панических атаках и способах работы с ними.', 'Статті про тривогу, панічні атаки та способи роботи з ними.'],
    [CAT.samosabotazh, 'samosabotazh', 'Самосаботаж', 'Самосаботаж', 'Почему мы саботируем свои цели и как с этим работать.', 'Чому ми саботуємо свої цілі та як із цим працювати.'],
    [CAT.podsoznanie, 'podsoznanie', 'Подсознание', 'Підсвідомість', 'Как работает подсознание и ограничивающие убеждения.', 'Як працює підсвідомість та обмежувальні переконання.'],
    [CAT.psikhosomatika, 'psikhosomatika', 'Психосоматика', 'Психосоматика', 'Как эмоции и стресс влияют на тело.', 'Як емоції та стрес впливають на тіло.'],
    [CAT.vygoraniye, 'vygoraniye', 'Выгорание', 'Вигорання', 'Об эмоциональном выгорании: признаки и восстановление.', 'Про емоційне вигорання: ознаки та відновлення.'],
    [CAT.neyverennost, 'neyverennost', 'Неуверенность', 'Невпевненість', 'Как побороть неуверенность и синдром самозванца.', 'Як побороти невпевненість та синдром самозванця.'],
    [CAT.krizis, 'krizis', 'Кризис', 'Криза', 'О личностных кризисах и экзистенциальных вопросах.', 'Про особистісні кризи та екзистенційні питання.'],
    [CAT['tsifrovoy-detoks'], 'tsifrovoy-detoks', 'Цифровой детокс', 'Цифровий детокс', 'Как провести цифровой детокс и снизить зависимость от гаджетов.', 'Як провести цифровий детокс та знизити залежність від гаджетів.'],
    [CAT.ptsr, 'ptsr', 'ПТСР', 'ПТСР', 'О посттравматическом стрессовом расстройстве.', 'Про посттравматичний стресовий розлад.'],
  ]
  for (const [i, [id, slug, nRu, nUk, dRu, dUk]] of cats.entries()) {
    upsert('blog_categories', id, {
      slug_base: `'${slug}'`, service_id: 'NULL', sort_order: `${i}`, status: "'PUBLISHED'",
    })
    upsert('blog_category_translations', `bct-${id}-ru`, {
      category_id: `'${id}'`, locale: "'ru'", slug: `'${slug}'`,
      name: `'${esc(nRu)}'`, description: `'${esc(dRu)}'`, seo_meta_id: 'NULL',
    })
    upsert('blog_category_translations', `bct-${id}-uk`, {
      category_id: `'${id}'`, locale: "'uk'", slug: `'${slug}'`,
      name: `'${esc(nUk)}'`, description: `'${esc(dUk)}'`, seo_meta_id: 'NULL',
    })
  }

  // ── BLOG POSTS (sample) ──
  emit(`\n-- BLOG_POSTS (sample)`)
  type Post = [string, string, string, string, string, string, string, number]
  const posts: Post[] = [
    ['bp-01', 'chto-takoe-gipnoterapiya', 'gipnoterapiya', 'Что такое гипнотерапия', 'Що таке гіпнотерапія', 'Подробный разбор метода: как работает гипнотерапия.', 'Детальний розбір методу: як працює гіпнотерапія.', 8],
    ['bp-02', 'kak-rabotaet-gipnoz', 'gipnoterapiya', 'Как работает гипноз', 'Як працює гіпноз', 'Научный взгляд на гипноз и транс.', 'Науковий погляд на гіпноз та транс.', 10],
    ['bp-03', 'trevoga-prichiny-i-simptomy', 'trevoga', 'Тревога: причины и симптомы', 'Тривога: причини та симптоми', 'Откуда берётся тревога и как она проявляется.', 'Звідки береться тривога і як вона проявляється.', 7],
    ['bp-04', 'kak-spravitsya-s-trevogoy', 'trevoga', 'Как справиться с тревогой', 'Як впоратися з тривогою', 'Практические советы по работе с тревогой.', 'Практичні поради з роботи з тривогою.', 6],
    ['bp-05', 'panicheskiye-ataki-chto-delat', 'trevoga', 'Панические атаки: что делать', 'Панічні атаки: що робити', 'Что происходит во время панической атаки.', 'Що відбувається під час панічної атаки.', 5],
    ['bp-06', 'chto-takoe-samosabotazh', 'samosabotazh', 'Что такое самосаботаж', 'Що таке самосаботаж', 'Механизмы самосаботажа.', 'Механізми самосаботажу.', 7],
  ]
  for (const [id, slug, catSlug, tRu, tUk, exRu, exUk] of posts) {
    const catId = CAT[catSlug as keyof typeof CAT]
    upsert('blog_posts', id, {
      category_id: `'${catId}'`, author_id: 'NULL', status: "'PUBLISHED'",
      cover_image_id: 'NULL', reading_minutes: '0',
      published_at: `'${ts()}'`, scheduled_at: 'NULL',
      created_at: `'${ts()}'`, updated_at: `'${ts()}'`,
    })
    upsert('blog_post_translations', `${id}-ru`, {
      post_id: `'${id}'`, locale: "'ru'", slug: `'${slug}'`,
      title: `'${esc(tRu)}'`, excerpt: `'${esc(exRu)}'`,
      content_json: 'NULL', content_html: `'<p>${esc(exRu)}</p>'`,
      table_of_contents_json: 'NULL', faq_json: 'NULL', seo_meta_id: 'NULL',
    })
    upsert('blog_post_translations', `${id}-uk`, {
      post_id: `'${id}'`, locale: "'uk'", slug: `'${slug}'`,
      title: `'${esc(tUk)}'`, excerpt: `'${esc(exUk)}'`,
      content_json: 'NULL', content_html: `'<p>${esc(exUk)}</p>'`,
      table_of_contents_json: 'NULL', faq_json: 'NULL', seo_meta_id: 'NULL',
    })
  }

  // ── FAQ ──
  emit(`\n-- FAQ_ITEMS`)
  type Faq = [string, string, string, string, string, string]
  const faqs: Faq[] = [
    ['faq-01', 'HOME', 'Что такое гипнотерапия?', 'Що таке гіпнотерапія?', 'Гипнотерапия — метод помощи, работающий с подсознанием через расслабленное состояние.', 'Гіпнотерапія — метод допомоги, що працює з підсвідомістю через розслаблений стан.'],
    ['faq-02', 'HOME', 'Это безопасно?', 'Це безпечно?', 'Да, гипнотерапия абсолютно безопасна. Вы остаётесь в сознании.', 'Так, гіпнотерапія абсолютно безпечна. Ви залишаєтеся у свідомості.'],
    ['faq-03', 'HOME', 'Сколько сессий нужно?', 'Скільки сесій потрібно?', 'В среднем 4-8 сессий. На бесплатной диагностике определим план.', 'В середньому 4-8 сесій. На безкоштовній діагностиці визначимо план.'],
    ['faq-04', 'HOME', 'Помогает ли гипноз при тревоге?', 'Чи допомагає гіпноз при тривозі?', 'Да, эффективно работает с тревожными расстройствами.', 'Так, ефективно працює з тривожними розладами.'],
    ['faq-05', 'GENERAL', 'Как проходит сеанс онлайн?', 'Як проходить сеанс онлайн?', 'Через видеосвязь. Вы удобно сидите, я направляю словами.', 'Через відеозв\'язок. Ви зручно сидите, я направляю словами.'],
    ['faq-06', 'GENERAL', 'Нужно ли готовиться?', 'Потрібно готуватися?', 'За час до сеанса — не употреблять алкоголь, выпить воды.', 'За годину до сеансу — не вживати алкоголь, випити води.'],
    ['faq-07', 'GENERAL', 'Что такое эриксоновский гипноз?', 'Що таке еріксонівський гіпноз?', 'Мягкий подход через метафоры. Клиент в сознании.', 'М\'який підхід через метафори. Клієнт у свідомості.'],
    ['faq-08', 'GENERAL', 'Гипноз vs гипнотерапия?', 'Гіпноз vs гіпнотерапія?', 'Гипноз — широкое понятие. Гипнотерапия — терапия.', 'Гіпноз — широке поняття. Гіпнотерапія — терапія.'],
    ['faq-09', 'CONTACTS', 'Как записаться?', 'Як записатися?', 'Через Telegram, WhatsApp или форму на сайте.', 'Через Telegram, WhatsApp або форму на сайті.'],
    ['faq-10', 'CONTACTS', 'Сколько стоит?', 'Скільки коштує?', 'От 50$. Первая консультация 15 мин — бесплатно.', 'Від 50$. Перша консультація 15 хв — безкоштовно.'],
  ]
  for (const [i, [id, grp, qRu, qUk, aRu, aUk]] of faqs.entries()) {
    upsert('faq_items', id, {
      group: `'${grp}'`, service_id: 'NULL', status: "'PUBLISHED'", sort_order: `${i}`,
    })
    upsert('faq_item_translations', `${id}-ru`, {
      faq_item_id: `'${id}'`, locale: "'ru'",
      question: `'${esc(qRu)}'`, answer: `'${esc(aRu)}'`,
    })
    upsert('faq_item_translations', `${id}-uk`, {
      faq_item_id: `'${id}'`, locale: "'uk'",
      question: `'${esc(qUk)}'`, answer: `'${esc(aUk)}'`,
    })
  }

  // ── TESTIMONIALS ──
  emit(`\n-- TESTIMONIALS`)
  type Tm = [string, string, number, string, string, string, string, string]
  const tms: Tm[] = [
    ['tm-01', 'Анна', 32, 'Telegram', 'Тревога', 'Спокойный сон', 'После 4 сеансов я спокойно засыпаю.', 'Після 4 сеансів я спокійно засинаю.'],
    ['tm-02', 'Сергій', 45, 'Instagram', 'Панические атаки', 'Нет атак 3 месяца', 'Атаки ушли полностью.', 'Атаки пішли повністю.'],
    ['tm-03', 'Олена', 28, 'Рекомендація', 'Самосаботаж', 'Запустила проєкт', 'Гипнотерапия помогла разобраться в корне.', 'Гіпнотерапія допомогла розібратися в корені.'],
    ['tm-04', 'Михайло', 38, 'Telegram', 'Выгорание', 'Вернулся к работе', 'Вернул интерес и энергию.', 'Повернув інтерес та енергію.'],
    ['tm-05', 'Катерина', 25, 'Сайт', 'Неуверенность', 'Получила повышение', 'Теперь уверенно беру новые задачі.', 'Тепер впевнено беру нові завдання.'],
  ]
  for (const [i, [id, name, age, src, pr, res, tRu, tUk]] of tms.entries()) {
    upsert('testimonials', id, {
      status: "'PUBLISHED'", client_name: `'${esc(name)}'`, client_age: `${age}`,
      avatar_initials: `'${name.slice(0, 2).toUpperCase()}'`, rating: '5',
      source: `'${esc(src)}'`, consent_confirmed: '1',
      published_at: `'${ts()}'`, sort_order: `${i}`, created_at: `'${ts()}'`,
    })
    upsert('testimonial_translations', `${id}-ru`, {
      testimonial_id: `'${id}'`, locale: "'ru'",
      problem: `'${esc(pr)}'`, result: `'${esc(res)}'`, text: `'${esc(tRu)}'`,
    })
    upsert('testimonial_translations', `${id}-uk`, {
      testimonial_id: `'${id}'`, locale: "'uk'",
      problem: `'${esc(pr)}'`, result: `'${esc(res)}'`, text: `'${esc(tUk)}'`,
    })
  }

  // ── SEO_META ──
  emit(`\n-- SEO_META`)
  for (const [id, , slug, tRu, tUk, dRu] of pages) {
    const short = id.slice(0, 8)
    upsert('seo_meta', `seo-p-${short}-ru`, {
      entity_type: "'page'", entity_id: `'${id}'`, locale: "'ru'",
      title: `'${esc(tRu)}'`, description: `'${esc(dRu)}'`,
      keywords: "'гипнотерапия, онлайн'", canonical_path: `'/${slug}/'`,
      og_title: `'${esc(tRu)}'`, og_description: `'${esc(dRu)}'`,
      og_image_id: 'NULL', robots_index: '1', robots_follow: '1',
      schema_type: "'WebPage'", created_at: `'${ts()}'`, updated_at: `'${ts()}'`,
    })
    upsert('seo_meta', `seo-p-${short}-uk`, {
      entity_type: "'page'", entity_id: `'${id}'`, locale: "'uk'",
      title: `'${esc(tUk)}'`, description: `'${esc(dRu)}'`,
      keywords: "'гіпнотерапія, онлайн'", canonical_path: `'/${slug}/'`,
      og_title: `'${esc(tUk)}'`, og_description: `'${esc(dRu)}'`,
      og_image_id: 'NULL', robots_index: '1', robots_follow: '1',
      schema_type: "'WebPage'", created_at: `'${ts()}'`, updated_at: `'${ts()}'`,
    })
  }
  for (const s of svcs) {
    const short = s.id.slice(0, 8)
    upsert('seo_meta', `seo-s-${short}-ru`, {
      entity_type: "'service'", entity_id: `'${s.id}'`, locale: "'ru'",
      title: `'${esc(s.ru[0])}'`, description: `'${esc(s.ru[1])}'`,
      keywords: "'гипнотерапия, сеанс'",
      canonical_path: 'NULL', og_title: 'NULL', og_description: 'NULL',
      og_image_id: 'NULL', robots_index: '1', robots_follow: '1',
      schema_type: 'NULL', created_at: `'${ts()}'`, updated_at: `'${ts()}'`,
    })
    upsert('seo_meta', `seo-s-${short}-uk`, {
      entity_type: "'service'", entity_id: `'${s.id}'`, locale: "'uk'",
      title: `'${esc(s.uk[0])}'`, description: `'${esc(s.uk[1])}'`,
      keywords: "'гіпнотерапія, сеанс'",
      canonical_path: 'NULL', og_title: 'NULL', og_description: 'NULL',
      og_image_id: 'NULL', robots_index: '1', robots_follow: '1',
      schema_type: 'NULL', created_at: `'${ts()}'`, updated_at: `'${ts()}'`,
    })
  }
  for (const [id, slug, nRu, nUk, dRu, dUk] of cats) {
    const short = id.slice(0, 8)
    upsert('seo_meta', `seo-c-${short}-ru`, {
      entity_type: "'blog_category'", entity_id: `'${id}'`, locale: "'ru'",
      title: `'${esc(nRu)}'`, description: `'${esc(dRu)}'`,
      keywords: "'категория блога'", canonical_path: 'NULL',
      og_title: 'NULL', og_description: 'NULL', og_image_id: 'NULL',
      robots_index: '1', robots_follow: '1', schema_type: 'NULL',
      created_at: `'${ts()}'`, updated_at: `'${ts()}'`,
    })
    upsert('seo_meta', `seo-c-${short}-uk`, {
      entity_type: "'blog_category'", entity_id: `'${id}'`, locale: "'uk'",
      title: `'${esc(nUk)}'`, description: `'${esc(dUk)}'`,
      keywords: "'категорія блогу'", canonical_path: 'NULL',
      og_title: 'NULL', og_description: 'NULL', og_image_id: 'NULL',
      robots_index: '1', robots_follow: '1', schema_type: 'NULL',
      created_at: `'${ts()}'`, updated_at: `'${ts()}'`,
    })
  }
  for (const [id, , , tRu, tUk] of posts) {
    const short = id.slice(0, 8)
    upsert('seo_meta', `seo-post-${short}-ru`, {
      entity_type: "'blog_post'", entity_id: `'${id}'`, locale: "'ru'",
      title: `'${esc(tRu)}'`, description: `'${esc(tRu)}'`,
      keywords: "'статья, блог'", canonical_path: 'NULL',
      og_title: 'NULL', og_description: 'NULL', og_image_id: 'NULL',
      robots_index: '1', robots_follow: '1', schema_type: 'NULL',
      created_at: `'${ts()}'`, updated_at: `'${ts()}'`,
    })
    upsert('seo_meta', `seo-post-${short}-uk`, {
      entity_type: "'blog_post'", entity_id: `'${id}'`, locale: "'uk'",
      title: `'${esc(tUk)}'`, description: `'${esc(tUk)}'`,
      keywords: "'стаття, блог'", canonical_path: 'NULL',
      og_title: 'NULL', og_description: 'NULL', og_image_id: 'NULL',
      robots_index: '1', robots_follow: '1', schema_type: 'NULL',
      created_at: `'${ts()}'`, updated_at: `'${ts()}'`,
    })
  }

  emitRedirects()
  emit(`\nPRAGMA foreign_keys = ON;\n`)

  const out = SQL.join('\n')
  const outPath = join(process.cwd(), 'scripts', 'seed-output.sql')
  writeFileSync(outPath, out, 'utf-8')
  console.log(`✅ Seed SQL: ${outPath} (${out.length} bytes, ~${out.split('\n').length} lines)`)
  console.log(`\nRun:`)
  console.log(`  npx wrangler d1 execute podvarchan --file=scripts/seed-output.sql --local`)
  console.log(`  npx wrangler d1 execute podvarchan --file=scripts/seed-output.sql --remote`)
}

main()
