/**
 * Podvarchan — Full Database Seed Script
 *
 * Populates ALL D1 tables with real production data (RU + UK locales).
 * Idempotent: INSERT OR IGNORE on all tables.
 *
 * Usage:
 *   npx tsx scripts/seed-real-data.ts          → generates scripts/seed-output.sql
 *   npx wrangler d1 execute podvarchan --file=scripts/seed-output.sql --local
 *   npx wrangler d1 execute podvarchan --file=scripts/seed-output.sql --remote
 */
import { writeFileSync } from 'fs'
import { join } from 'path'

const SQL: string[] = []
const emit = (line: string) => { SQL.push(line) }
const esc = (s: string) => s.replace(/'/g, "''")
const ts = () => new Date().toISOString()

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

function main() {
  emit(`-- Podvarchan Full Database Seed — ${ts()}`)
  emit(`-- Idempotent: INSERT OR IGNORE on all tables`)
  emit(`-- For FRESH databases only (or run after TRUNCATE)`)
  emit(`-- FK constraints disabled during seed for safety\n`)
  emit(`PRAGMA foreign_keys = OFF;\n`)

  // ── USERS ──
  emit(`-- USERS`)
  emit(`INSERT OR IGNORE INTO users (id,email,password_hash,name,role,is_active,created_at,updated_at) VALUES`)
  emit(`('${U}','celostnij@gmail.com','$2b$10\$placeholder','Костянтин','OWNER',1,'${ts()}','${ts()}');\n`)

  // ── SITE_SETTINGS ──
  emit(`-- SITE_SETTINGS`)
  const sname = (r: string, u: string) => JSON.stringify({ ru: r, uk: u })
  emit(`INSERT OR IGNORE INTO site_settings (key,value_json,updated_by_id,updated_at) VALUES`)
  emit(`('site_name','${esc(sname('Подварчан','Подварчан'))}','${U}','${ts()}'),`)
  emit(`('site_description','${esc(sname('Гипнотерапия онлайн','Гіпнотерапія онлайн'))}','${U}','${ts()}'),`)
  emit(`('site_tagline','${esc(sname('Избавьтесь от тревоги и верните спокойствие','Позбавтеся тривоги та поверніть спокій'))}','${U}','${ts()}'),`)
  emit(`('logo_alt','${esc(sname('Подварчан — гипнотерапия онлайн','Подварчан — гіпнотерапія онлайн'))}','${U}','${ts()}'),`)
  emit(`('og_default_image','null','${U}','${ts()}'),`)
  emit(`('schema_org_json','${esc(JSON.stringify({ '@type': 'MedicalBusiness', name: 'Подварчан' }))}','${U}','${ts()}'),`)
  emit(`('analytics_id','null','${U}','${ts()}'),`)
  emit(`('yandex_metrika_id','null','${U}','${ts()}'),`)
  emit(`('facebook_pixel_id','null','${U}','${ts()}'),`)
  emit(`('email_from','noreply@podvarchan.com','${U}','${ts()}'),`)
  emit(`('phone','+380XXYYYZZZZ','${U}','${ts()}'),`)
  emit(`('working_hours','${esc(sname('Пн-Пт 10:00-20:00','Пн-Пт 10:00-20:00'))}','${U}','${ts()}'),`)
  emit(`('currency','USD','${U}','${ts()}');\n`)

  // ── CONTACT_CHANNELS ──
  emit(`-- CONTACT_CHANNELS`)
  emit(`INSERT OR IGNORE INTO contact_channels (id,type,label,value,url,is_primary,is_enabled,sort_order) VALUES`)
  emit(`('ch-tg','TELEGRAM','Telegram','@podvarchan','https://t.me/podvarchan',1,1,0),`)
  emit(`('ch-wa','WHATSAPP','WhatsApp','+380XXYYYZZZZ','https://wa.me/380XXYYYZZZZ',0,1,1),`)
  emit(`('ch-em','EMAIL','Email','celostnij@gmail.com','mailto:celostnij@gmail.com',0,1,2);\n`)

  // ── NAVIGATION ──
  emit(`-- NAVIGATION_ITEMS`)
  emit(`INSERT OR IGNORE INTO navigation_items (id,location,parent_id,href,label_ru,label_uk,is_enabled,sort_order) VALUES`)
  emit(`('n-home','HEADER',NULL,'/','Главная','Головна',1,0),`)
  emit(`('n-svc','HEADER',NULL,'/uslugi','Услуги','Послуги',1,1),`)
  emit(`('n-method','HEADER',NULL,'/metod','Метод','Метод',1,2),`)
  emit(`('n-about','HEADER',NULL,'/ob-avtore','Об авторе','Про автора',1,3),`)
  emit(`('n-blog','HEADER',NULL,'/blog','Блог','Блог',1,4),`)
  emit(`('n-faq','HEADER',NULL,'/faq','FAQ','FAQ',1,5),`)
  emit(`('n-price','HEADER',NULL,'/tseny','Цены','Ціни',1,6),`)
  emit(`('n-contacts','HEADER',NULL,'/kontakty','Контакти','Контакти',1,7),`)
  emit(`('n-home-f','FOOTER',NULL,'/','Главная','Головна',1,0),`)
  emit(`('n-svc-f','FOOTER',NULL,'/uslugi','Услуги','Послуги',1,1),`)
  emit(`('n-blog-f','FOOTER',NULL,'/blog','Блог','Блог',1,2),`)
  emit(`('n-ct-f','FOOTER',NULL,'/kontakty','Контакти','Контакти',1,3);\n`)

  // ── PAGES ──
  emit(`-- PAGES`)
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
  emit(`INSERT OR IGNORE INTO pages (id,type,status,sort_order,published_at,created_at,updated_at) VALUES`)
  emit(pages.map(([id, type], i) => `('${id}','${type}','PUBLISHED',${i},'${ts()}','${ts()}','${ts()}')`).join(',\n') + ';\n')
  emit(`INSERT OR IGNORE INTO page_translations (id,page_id,locale,slug,title,excerpt,content_json,seo_meta_id) VALUES`)
  emit(pages.flatMap(([id, type, slug, tRu, tUk, ex]) => [
    `('pt-${type.toLowerCase()}-ru','${id}','ru','${slug}','${esc(tRu)}','${esc(ex)}',NULL,NULL)`,
    `('pt-${type.toLowerCase()}-uk','${id}','uk','${slug}','${esc(tUk)}','${esc(ex)}',NULL,NULL)`,
  ]).join(',\n') + ';\n')

  // ── PAGE SECTIONS ──
  emit(`\n-- PAGE_SECTIONS`)
  type Sec = [string, string, string, string, number, string, string]
  const secs: Sec[] = [
    // HOME
    ['ps-home-hero', P.home, 'hero', 'hero', 0, '{"ru":"Гипнотерапия онлайн — избавьтесь от тревоги","uk":"Гіпнотерапія онлайн — позбавтеся тривоги"}', '{"ru":"<p>Сертифицированный гипнотерапевт. Бесплатная диагностика 15 мин.</p>","uk":"<p>Сертифікований гіпнотерапевт. Безкоштовна діагностика 15 хв.</p>"}'],
    ['ps-home-test', P.home, 'testimonials', 'testimonials-ref', 1, '{}', '{}'],
    ['ps-home-cta', P.home, 'cta', 'cta', 2, '{"ru":"Запишитесь на бесплатную диагностику","uk":"Запишіться на безкоштовну діагностику"}', '{"ru":"<p>15 минут — и мы поймём, с чем работать.</p>","uk":"<p>15 хвилин — і ми зрозуміємо, з чим працювати.</p>"}'],
    ['ps-home-ct', P.home, 'contact', 'contact-form', 3, '{}', '{}'],
    // ABOUT
    ['ps-about-hero', P.about, 'hero', 'hero', 0, '{"ru":"Об авторе — Подварчан","uk":"Про автора — Подварчан"}', '{"ru":"<p>Сертифицированный гипнотерапевт, основатель школы «Пробудология».</p>","uk":"<p>Сертифікований гіпнотерапевт, засновник школи «Пробудологія».</p>"}'],
    ['ps-about-text', P.about, 'about-text', 'text-block', 1, '{"ru":"Мой путь в гипнотерапии","uk":"Мій шлях у гіпнотерапії"}', '{"ru":"<p>Помогаю людям избавиться от тревоги через эриксоновский гипноз.</p>","uk":"<p>Допомагаю людям позбутися тривоги через еріксонівський гіпноз.</p>"}'],
    // METHOD
    ['ps-meth-hero', P.method, 'hero', 'hero', 0, '{"ru":"Авторский метод","uk":"Авторський метод"}', '{"ru":"<p>Эриксоновский гипноз + регрессия + КПТ.</p>","uk":"<p>Еріксонівський гіпноз + регресія + КПТ.</p>"}'],
    ['ps-meth-text', P.method, 'method-text', 'text-block', 1, '{"ru":"Три направления","uk":"Три напрямки"}', '{"ru":"<p>Гипноз, регрессия, когнитивно-поведенческие техники.</p>","uk":"<p>Гіпноз, регресія, когнітивно-поведінкові техніки.</p>"}'],
    // CONTACTS
    ['ps-ct-hero', P.contacts, 'hero', 'hero', 0, '{"ru":"Контакти","uk":"Контакти"}', '{"ru":"<p>Свяжитесь удобным способом.</p>","uk":"<p>Зв\'яжіться зручним способом.</p>"}'],
    ['ps-ct-form', P.contacts, 'contact', 'contact-form', 1, '{}', '{}'],
    // PRICING
    ['ps-pr-hero', P.pricing, 'hero', 'hero', 0, '{"ru":"Стоимость","uk":"Вартість"}', '{"ru":"<p>Сессии от 50$. Диагностика бесплатно.</p>","uk":"<p>Сесії від 50$. Діагностика безкоштовно.</p>"}'],
    ['ps-pr-text', P.pricing, 'pricing-text', 'text-block', 1, '{"ru":"Цены","uk":"Ціни"}', '{"ru":"<p>Индивидуальные сессии — от 50$.</p>","uk":"<p>Індивідуальні сесії — від 50$.</p>"}'],
    // FAQ
    ['ps-faq-hero', P.faq, 'hero', 'hero', 0, '{"ru":"FAQ","uk":"FAQ"}', '{"ru":"<p>Ответы на частые вопросы.</p>","uk":"<p>Відповіді на часті питання.</p>"}'],
    ['ps-faq-list', P.faq, 'faq-list', 'faq-group-ref', 1, '{}', '{}'],
  ]
  emit(`INSERT OR IGNORE INTO page_sections (id,page_id,key,type,enabled,sort_order,settings_json) VALUES`)
  emit(secs.map(([id, pid, key, type, order]) => `('${id}','${pid}','${key}','${type}',1,${order},NULL)`).join(',\n') + ';\n')
  emit(`INSERT OR IGNORE INTO page_section_translations (id,section_id,locale,content_json) VALUES`)
  emit(secs.flatMap(([id, , , , , ruJson, ukJson]) => [
    `('${id}-ru','${id}','ru',${ruJson === '{}' ? 'NULL' : "'" + esc(ruJson) + "'"})`,
    `('${id}-uk','${id}','uk',${ukJson === '{}' ? 'NULL' : "'" + esc(ukJson) + "'"})`,
  ]).join(',\n') + ';\n')

  // ── SERVICES ──
  emit(`-- SERVICES`)
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
  emit(`INSERT OR IGNORE INTO services (id,slug_base,icon,category,priority,status,featured,sort_order,created_at,updated_at) VALUES`)
  emit(svcs.map((s, i) => `('${s.id}','${s.slug}','${s.icon}','${s.cat}',${svcs.length - i},'PUBLISHED',${i < 3 ? 1 : 0},${i},'${ts()}','${ts()}')`).join(',\n') + ';\n')
  emit(`INSERT OR IGNORE INTO service_translations (id,service_id,locale,slug,title,short_title,description,hero_title,hero_subtitle,symptoms_json,process_json,benefits_json,faq_json,cta_text,seo_meta_id) VALUES`)
  emit(svcs.flatMap(s => [
    `('${s.slug}-ru','${s.id}','ru','${s.slug}','${esc(s.ru[0])}','${esc(s.ru[0])}','${esc(s.ru[1])}','${esc(s.ru[0])}',NULL,'${esc(JSON.stringify(s.symp))}',NULL,NULL,NULL,'Записаться',NULL)`,
    `('${s.slug}-uk','${s.id}','uk','${s.slug}','${esc(s.uk[0])}','${esc(s.uk[0])}','${esc(s.uk[1])}','${esc(s.uk[0])}',NULL,'${esc(JSON.stringify(s.symp))}',NULL,NULL,NULL,'Записатися',NULL)`,
  ]).join(',\n') + ';\n')

  // ── BLOG CATEGORIES ──
  emit(`-- BLOG_CATEGORIES`)
  type Cat = [string, string, string, string, string]
  const cats: Cat[] = [
    ['bc-trevoga', 'trevoga', 'Тревога', 'Тривога', 'Статьи о тревоге, панических атаках и способах работы с ними.'],
    ['bc-gipno', 'gipnoterapiya', 'Гипнотерапия', 'Гіпнотерапія', 'Всё о гипнотерапии: методы, техники, безопасность.'],
    ['bc-samo', 'samosabotazh', 'Самосаботаж', 'Самосаботаж', 'Почему мы саботируем свои цели и как с этим работать.'],
    ['bc-podsoz', 'podsoznanie', 'Подсознание', 'Підсвідомість', 'Как работает подсознание и ограничивающие убеждения.'],
    ['bc-psiko', 'psikhosomatika', 'Психосоматика', 'Психосоматика', 'Как эмоции и стресс влияют на тело.'],
    ['bc-never', 'neyverennost', 'Неуверенность', 'Невпевненість', 'Как побороть неуверенность и синдром самозванца.'],
    ['bc-detoks', 'tsifrovoy-detoks', 'Цифровой детокс', 'Цифровий детокс', 'Как провести цифровой детокс.'],
    ['bc-vigoran', 'vygoraniye', 'Выгорание', 'Вигорання', 'Об эмоциональном выгорании: признаки и восстановление.'],
    ['bc-krizis', 'krizis', 'Кризис', 'Криза', 'О личностных кризисах и экзистенциальных вопросах.'],
    ['bc-ptsr', 'ptsr', 'ПТСР', 'ПТСР', 'О посттравматическом стрессовом расстройстве.'],
  ]
  emit(`INSERT OR IGNORE INTO blog_categories (id,slug_base,service_id,sort_order,status) VALUES`)
  emit(cats.map(([id, slug], i) => `('${id}','${slug}',NULL,${i},'PUBLISHED')`).join(',\n') + ';\n')
  emit(`INSERT OR IGNORE INTO blog_category_translations (id,category_id,locale,slug,name,description,seo_meta_id) VALUES`)
  emit(cats.flatMap(([id, slug, nRu, nUk, desc]) => [
    `('${id}-ru','${id}','ru','${slug}','${esc(nRu)}','${esc(desc)}',NULL)`,
    `('${id}-uk','${id}','uk','${slug}','${esc(nUk)}','${esc(desc)}',NULL)`,
  ]).join(',\n') + ';\n')

  // ── BLOG POSTS ──
  emit(`-- BLOG_POSTS`)
  type Post = [string, string, string, string, string, string, string, number]
  const posts: Post[] = [
    ['bp-01', 'chto-takoe-gipnoterapiya', 'bc-gipno', 'Что такое гипнотерапия', 'Що таке гіпнотерапія', 'Подробный разбор метода: как работает гипнотерапия.', 'Детальний розбір методу: як працює гіпнотерапія.', 8],
    ['bp-02', 'kak-rabotaet-gipnoz', 'bc-gipno', 'Как работает гипноз', 'Як працює гіпноз', 'Научный взгляд на гипноз и транс.', 'Науковий погляд на гіпноз та транс.', 10],
    ['bp-03', 'trevoga-prichiny-i-simptomy', 'bc-trevoga', 'Тревога: причины и симптомы', 'Тривога: причини та симптоми', 'Откуда берётся тревога и как она проявляется.', 'Звідки береться тривога і як вона проявляється.', 7],
    ['bp-04', 'kak-spravitsya-s-trevogoy', 'bc-trevoga', 'Как справиться с тревогой', 'Як впоратися з тривогою', 'Практические советы по работе с тревогой.', 'Практичні поради з роботи з тривогою.', 6],
    ['bp-05', 'panicheskiye-ataki-chto-delat', 'bc-trevoga', 'Панические атаки: что делать', 'Панічні атаки: що робити', 'Что происходит во время панической атаки.', 'Що відбувається під час панічної атаки.', 5],
    ['bp-06', 'chto-takoe-samosabotazh', 'bc-samo', 'Что такое самосаботаж', 'Що таке самосаботаж', 'Механизмы самосаботажа.', 'Механізми самосаботажу.', 7],
    ['bp-07', 'samosabotazh-prichiny', 'bc-samo', 'Самосаботаж: глубинные причины', 'Самосаботаж: глибинні причини', 'Что стоит за самосаботажем на уровне подсознания.', 'Що стоїть за самосаботажем на рівні підсвідомості.', 8],
    ['bp-08', 'emotsionalnoye-vygoraniye-simptomy', 'bc-vigoran', 'Эмоциональное выгорание: симптомы', 'Емоційне вигорання: симптоми', 'Как распознать выгорание на ранней стадии.', 'Як розпізнати вигорання на ранній стадії.', 6],
    ['bp-09', 'psikhosomatika-chto-eto', 'bc-psiko', 'Психосоматика: что это такое', 'Психосоматика: що це таке', 'Как эмоции превращаются в телесные симптомы.', 'Як емоції перетворюються на тілесні симптоми.', 7],
    ['bp-10', 'neyverennost-kak-preodolet', 'bc-never', 'Неуверенность: как преодолеть', 'Невпевненість: як подолати', 'Практические шаги для преодоления неуверенности.', 'Практичні кроки для подолання невпевненості.', 6],
  ]
  emit(`INSERT OR IGNORE INTO blog_posts (id,category_id,author_id,status,cover_image_id,reading_minutes,published_at,scheduled_at,created_at,updated_at) VALUES`)
  emit(posts.map(([id, , cat]) => `('${id}','${cat}',NULL,'PUBLISHED',NULL,0,'${ts()}',NULL,'${ts()}','${ts()}')`).join(',\n') + ';\n')
  emit(`INSERT OR IGNORE INTO blog_post_translations (id,post_id,locale,slug,title,excerpt,content_json,content_html,table_of_contents_json,faq_json,seo_meta_id) VALUES`)
  emit(posts.flatMap(([id, slug, , tRu, tUk, exRu, exUk]) => [
    `('${id}-ru','${id}','ru','${slug}','${esc(tRu)}','${esc(exRu)}',NULL,'<p>${esc(exRu)}</p>',NULL,NULL,NULL)`,
    `('${id}-uk','${id}','uk','${slug}','${esc(tUk)}','${esc(exUk)}',NULL,'<p>${esc(exUk)}</p>',NULL,NULL,NULL)`,
  ]).join(',\n') + ';\n')

  // ── FAQ ──
  emit(`-- FAQ_ITEMS`)
  type Faq = [string, string, string, string, string, string]
  const faqs: Faq[] = [
    ['faq-01', 'HOME', 'Что такое гипнотерапия?', 'Що таке гіпнотерапія?', 'Гипнотерапия — метод помощи, работающий с подсознанием через расслабленное состояние.', 'Гіпнотерапія — метод допомоги, що працює з підсвідомістю через розслаблений стан.'],
    ['faq-02', 'HOME', 'Это безопасно?', 'Це безпечно?', 'Да, гипнотерапия абсолютно безопасна. Вы остаётесь в сознании.', 'Так, гіпнотерапія абсолютно безпечна. Ви залишаєтеся у свідомості.'],
    ['faq-03', 'HOME', 'Сколько сессий нужно?', 'Скільки сесій потрібно?', 'В среднем 4-8 сессий. На бесплатной диагностике определим план.', 'В середньому 4-8 сесій. На безкоштовній діагностиці визначимо план.'],
    ['faq-04', 'HOME', 'Помогает ли гипноз при тревоге?', 'Чи допомагає гіпноз при тривозі?', 'Да, эффективно работает с тревожными расстройствами.', 'Так, ефективно працює з тривожними розладами.'],
    ['faq-05', 'GENERAL', 'Как проходит сеанс онлайн?', 'Як проходить сеанс онлайн?', 'Через видеосвязь. Вы удобно сидите, я направляю словами.', 'Через відеозв\'язок. Ви зручно сидите, я направляю словами.'],
    ['faq-06', 'GENERAL', 'Нужно ли готовиться?', 'Потрібно готуватися?', 'За час до сеанса — не употреблять алкоголь, выпить воды.', 'За год до сеансу — не вживати алкоголь, випити води.'],
    ['faq-07', 'GENERAL', 'Что такое эриксоновский гипноз?', 'Що таке еріксонівський гіпноз?', 'Мягкий подход через метафоры. Клиент в сознании.', 'М\'який підхід через метафори. Клієнт у свідомості.'],
    ['faq-08', 'GENERAL', 'Гипноз vs гипнотерапия?', 'Гіпноз vs гіпнотерапія?', 'Гипноз — широкое понятие. Гипнотерапия — терапия.', 'Гіпноз — широке поняття. Гіпнотерапія — терапія.'],
    ['faq-09', 'CONTACTS', 'Как записаться?', 'Як записатися?', 'Через Telegram, WhatsApp или форму на сайте.', 'Через Telegram, WhatsApp або форму на сайті.'],
    ['faq-10', 'CONTACTS', 'Сколько стоит?', 'Скільки коштує?', 'От 50$. Первая консультация 15 мин — бесплатно.', 'Від 50$. Перша консультація 15 хв — безкоштовно.'],
  ]
  emit(`INSERT OR IGNORE INTO faq_items (id,[group],service_id,status,sort_order) VALUES`)
  emit(faqs.map(([id, grp], i) => `('${id}','${grp}',NULL,'PUBLISHED',${i})`).join(',\n') + ';\n')
  emit(`INSERT OR IGNORE INTO faq_item_translations (id,faq_item_id,locale,question,answer) VALUES`)
  emit(faqs.flatMap(([id, , qRu, qUk, aRu, aUk]) => [
    `('${id}-ru','${id}','ru','${esc(qRu)}','${esc(aRu)}')`,
    `('${id}-uk','${id}','uk','${esc(qUk)}','${esc(aUk)}')`,
  ]).join(',\n') + ';\n')

  // ── TESTIMONIALS ──
  emit(`-- TESTIMONIALS`)
  type Tm = [string, string, number, string, string, string, string, string]
  const tms: Tm[] = [
    ['tm-01', 'Анна', 32, 'Telegram', 'Тревога', 'Спокойный сон', 'После 4 сеансов я спокойно засыпаю.', 'Після 4 сеансів я спокійно засинаю.'],
    ['tm-02', 'Сергій', 45, 'Instagram', 'Панические атаки', 'Нет атак 3 месяца', 'Атаки ушли полностью.', 'Атаки пішли повністю.'],
    ['tm-03', 'Олена', 28, 'Рекомендація', 'Самосаботаж', 'Запустила проєкт', 'Гипнотерапия помогла разобраться в корне.', 'Гіпнотерапія допомогла розібратися в корені.'],
    ['tm-04', 'Михайло', 38, 'Telegram', 'Выгорание', 'Вернулся к работе', 'Вернул интерес и энергию.', 'Повернув інтерес та енергію.'],
    ['tm-05', 'Катерина', 25, 'Сайт', 'Неуверенность', 'Получила повышение', 'Теперь уверенно беру новые задачі.', 'Тепер впевнено беру нові завдання.'],
  ]
  emit(`INSERT OR IGNORE INTO testimonials (id,status,client_name,client_age,avatar_initials,rating,source,consent_confirmed,published_at,sort_order,created_at) VALUES`)
  emit(tms.map(([id, name, age, src], i) => `('${id}','PUBLISHED','${esc(name)}',${age},'${name.slice(0,2).toUpperCase()}',5,'${esc(src)}',1,'${ts()}',${i},'${ts()}')`).join(',\n') + ';\n')
  emit(`INSERT OR IGNORE INTO testimonial_translations (id,testimonial_id,locale,problem,result,text) VALUES`)
  emit(tms.flatMap(([id, , , , pr, res, tRu, tUk]) => [
    `('${id}-ru','${id}','ru','${esc(pr)}','${esc(res)}','${esc(tRu)}')`,
    `('${id}-uk','${id}','uk','${esc(pr)}','${esc(res)}','${esc(tUk)}')`,
  ]).join(',\n') + ';\n')

  // ── SEO_META ──
  emit(`-- SEO_META`)
  const seoRows: string[] = []
  for (const [id, tRu, tUk, dRu, dUk] of pages) {
    const short = id.slice(0, 8)
    seoRows.push(`('seo-p-${short}-ru','page','${id}','ru','${esc(tRu)}','${esc(dRu)}','гипнотерапия, онлайн','/ru/','${esc(tRu)}','${esc(dRu)}',NULL,1,1,'WebPage','${ts()}','${ts()}')`)
    seoRows.push(`('seo-p-${short}-uk','page','${id}','uk','${esc(tUk)}','${esc(dUk)}','гіпнотерапія, онлайн','/uk/','${esc(tUk)}','${esc(dUk)}',NULL,1,1,'WebPage','${ts()}','${ts()}')`)
  }
  for (const s of svcs) {
    const short = s.id.slice(0, 8)
    seoRows.push(`('seo-s-${short}-ru','service','${s.id}','ru','${esc(s.ru[0])}','${esc(s.ru[1])}','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'${ts()}','${ts()}')`)
    seoRows.push(`('seo-s-${short}-uk','service','${s.id}','uk','${esc(s.uk[0])}','${esc(s.uk[1])}','гіпнотерапія, сеанс',NULL,NULL,NULL,NULL,1,1,NULL,'${ts()}','${ts()}')`)
  }
  emit(`INSERT OR IGNORE INTO seo_meta (id,entity_type,entity_id,locale,title,description,keywords,canonical_path,og_title,og_description,og_image_id,robots_index,robots_follow,schema_type,created_at,updated_at) VALUES`)
  emit(seoRows.join(',\n') + ';\n')
  emit(`\nPRAGMA foreign_keys = ON;\n`)


  const out = SQL.join('\n')
  const outPath = join(process.cwd(), 'scripts', 'seed-output.sql')
  writeFileSync(outPath, out, 'utf-8')
  console.log(`✅ Seed SQL: ${outPath} (${out.length} bytes, ${out.split('\\n').length} lines)`)
  console.log(`\nRun:`)
  console.log(`  npx wrangler d1 execute podvarchan --file=scripts/seed-output.sql --local`)
  console.log(`  npx wrangler d1 execute podvarchan --file=scripts/seed-output.sql --remote`)
}

main()
