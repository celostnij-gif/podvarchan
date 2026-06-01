import type { Service, BlogCategory, NavItem } from '@/types'

/* ── Site info ── */

export const SITE = {
  name: 'Podvarchan.com',
  fullName: 'Podvarchan.com — гипнотерапия онлайн',
  url: 'https://podvarchan.com',
  locale: 'ru_RU',
  defaultOgImage: '/images/og-default.jpg',
  themeColor: '#0A0A12',
  authorName: 'Вячеслав Подварчан',
  authorTitle: 'Гипнотерапевт онлайн',
  authorSlug: 'ob-avtore',
} as const

/* ── Navigation ── */

export const MAIN_NAV: NavItem[] = [
  { label: 'Главная', href: '/' },
  {
    label: 'Услуги',
    href: '/uslugi/',
    children: [
      { label: 'Гипнотерапия онлайн', href: '/uslugi/gipnoterapiya-onlayn/' },
      { label: 'Тревога и панические атаки', href: '/uslugi/trevoga-i-panicheskiye-ataki/' },
      { label: 'Работа с подсознанием', href: '/uslugi/rabota-s-podsoznaniem/' },
      { label: 'Самосаботаж и блоки', href: '/uslugi/samosabotazh-i-bloki/' },
      { label: 'Эмоциональное выгорание', href: '/uslugi/emotsionalnoye-vygoraniye/' },
      { label: 'Неуверенность и страх провала', href: '/uslugi/neyverennost-i-strakh-provala/' },
      { label: 'Психосоматика', href: '/uslugi/psikhosomatika/' },
      { label: 'Личностный кризис', href: '/uslugi/lichnostnyy-krizis/' },
    ],
  },
  { label: 'Блог', href: '/blog/' },
  { label: 'Об авторе', href: '/ob-avtore/' },
  { label: 'Метод', href: '/metod/' },
  { label: 'FAQ', href: '/faq/' },
  { label: 'Цены', href: '/tseny/' },
]

/* ── Services ── */

export const SERVICES: Service[] = [
  {
    slug: 'gipnoterapiya-onlayn',
    title: 'Гипнотерапия онлайн',
    shortTitle: 'Гипнотерапия',
    description: 'Индивидуальные сессии гипнотерапии онлайн. Мягкий эриксоновский гипноз для работы с подсознанием, тревогой, страхами и ограничивающими убеждениями.',
    metaDescription: 'Онлайн-гипнотерапия от сертифицированного специалиста. Мягкий эриксоновский гипноз, работа с тревогой, подсознанием и психосоматикой. Запись на сессию.',
    keywords: ['гипнотерапия онлайн', 'гипнотерапевт онлайн', 'онлайн гипноз', 'сеанс гипноза', 'эриксоновский гипноз'],
    category: 'gipnoterapiya',
    priority: 1,
    icon: '✨',
    cta: 'Записаться на пробную сессию',
    ctaLink: '/kontakty/',
  },
  {
    slug: 'trevoga-i-panicheskiye-ataki',
    title: 'Тревога и панические атаки',
    shortTitle: 'Тревога и ПА',
    description: 'Избавьтесь от тревоги и панических атак с помощью гипнотерапии. Работа с подсознанием на глубинном уровне для устойчивого результата.',
    metaDescription: 'Лечение тревоги и панических атак гипнозом онлайн. Сертифицированный гипнотерапевт. Мягкие техники без лекарств. Запись на консультацию.',
    keywords: ['панические атаки гипноз', 'тревога лечение', 'избавиться от панических атак', 'тревожность гипнотерапия', 'гипноз при страхе'],
    category: 'trevoga',
    priority: 1,
    icon: '🫂',
    cta: 'Убрать тревогу — запись на консультацию',
    ctaLink: '/kontakty/',
  },
  {
    slug: 'rabota-s-podsoznaniem',
    title: 'Работа с подсознанием',
    shortTitle: 'Подсознание',
    description: 'Глубокая проработка подсознания через гипнотерапию. Убираем ограничивающие убеждения, денежные блоки, негативные установки.',
    metaDescription: 'Работа с подсознанием онлайн — гипноз для проработки ограничивающих убеждений, денежных блоков и негативных установок. Сессия гипнотерапии.',
    keywords: ['работа с подсознанием', 'ограничивающие убеждения гипноз', 'денежные блоки гипноз', 'негативные установки', 'убрать внутренние блоки'],
    category: 'podsoznanie',
    priority: 2,
    icon: '🌌',
    cta: 'Начать глубинную проработку подсознания',
    ctaLink: '/kontakty/',
  },
  {
    slug: 'samosabotazh-i-bloki',
    title: 'Самосаботаж и блоки',
    shortTitle: 'Самосаботаж',
    description: 'Уберите самосаботаж и прокрастинацию через гипнотерапию. Поймите, почему откладываете важное, и начните действовать.',
    metaDescription: 'Избавление от самосаботажа и прокрастинации гипнозом онлайн. Работа с внутренними блоками, страхом неудачи и откладыванием важных дел.',
    keywords: ['самосаботаж гипноз', 'убрать прокрастинацию', 'почему я откладываю важное', 'внутренние блоки', 'работа с саботажем'],
    category: 'samosabotazh',
    priority: 2,
    icon: '🔓',
    cta: 'Убрать самосаботаж — консультация',
    ctaLink: '/kontakty/',
  },
  {
    slug: 'emotsionalnoye-vygoraniye',
    title: 'Эмоциональное выгорание',
    shortTitle: 'Выгорание',
    description: 'Восстановление после эмоционального выгорания с гипнотерапией. Верните энергию, ресурс и интерес к жизни.',
    metaDescription: 'Восстановление после эмоционального выгорания — гипнотерапия онлайн. Верните энергию и ресурс. Сессии с сертифицированным специалистом.',
    keywords: ['эмоциональное выгорание гипнотерапия', 'выгорание лечение', 'восстановление энергии', 'усталость психотерапия', 'ресурсное состояние'],
    category: 'vygoraniye',
    priority: 2,
    icon: '🕯️',
    cta: 'Вернуть ресурс — запись на восстановление',
    ctaLink: '/kontakty/',
  },
  {
    slug: 'neyverennost-i-strakh-provala',
    title: 'Неуверенность и страх провала',
    shortTitle: 'Неуверенность',
    description: 'Преодолейте неуверенность, страх провала и синдром самозванца с гипнотерапией. Обретите внутреннюю опору.',
    metaDescription: 'Гипноз от неуверенности в себе, страха провала и синдрома самозванца. Онлайн-сессии с гипнотерапевтом. Повышение самооценки.',
    keywords: ['неуверенность в себе гипноз', 'страх провала', 'синдром самозванца', 'страх ошибки', 'повышение самооценки гипноз'],
    category: 'neyverennost',
    priority: 3,
    icon: '🌟',
    cta: 'Обрести уверенность — запись',
    ctaLink: '/kontakty/',
  },
  {
    slug: 'psikhosomatika',
    title: 'Психосоматика',
    shortTitle: 'Психосоматика',
    description: 'Работа с психосоматическими проявлениями через гипнотерапию. Снятие телесных симптомов стресса и тревоги.',
    metaDescription: 'Гипноз при психосоматике — лечение телесных симптомов стресса и тревоги онлайн. Сессии психосоматической гипнотерапии.',
    keywords: ['психосоматика гипноз лечение', 'психосоматика тревога', 'телесные симптомы стресс', 'гипноз психосоматика', 'психосоматика онлайн'],
    category: 'psikhosomatika',
    priority: 3,
    icon: '🌿',
    cta: 'Убрать телесные симптомы — консультация',
    ctaLink: '/kontakty/',
  },
  {
    slug: 'lichnostnyy-krizis',
    title: 'Личностный кризис',
    shortTitle: 'Кризис',
    description: 'Помощь в прохождении личностного кризиса через гипнотерапию. Поиск себя, новых смыслов и направления в жизни.',
    metaDescription: 'Гипнотерапия при личностном кризисе — помощь в поиске себя и новых смыслов. Онлайн-сессии с гипнотерапевтом.',
    keywords: ['личностный кризис гипнотерапевт', 'кризис возраста помощь', 'поиск себя гипноз', 'смысл жизни психотерапия', 'кризис 30 лет'],
    category: 'krizis',
    priority: 3,
    icon: '🌅',
    cta: 'Вернуть ориентиры — бесплатная консультация',
    ctaLink: '/kontakty/',
  },
]

/* ── Blog Categories ── */

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: 'trevoga',
    name: 'Тревога',
    description: 'Статьи о тревоге, панических атаках и способах работы с ними через гипнотерапию.',
    metaDescription: 'Статьи о тревоге и панических атаках: признаки, причины, методы лечения гипнозом. Рекомендации гипнотерапевта.',
    keywords: ['тревога статья', 'панические атаки симптомы', 'тревожность как лечить'],
    serviceSlug: 'trevoga-i-panicheskiye-ataki',
  },
  {
    slug: 'gipnoterapiya',
    name: 'Гипнотерапия',
    description: 'Всё о гипнотерапии: методы, техники, безопасность, эффективность. Эриксоновский и регрессивный гипноз.',
    metaDescription: 'Всё о гипнотерапии онлайн: методы, техники, безопасность. Эриксоновский гипноз, регрессивная гипнотерапия.',
    keywords: ['гипнотерапия что это', 'методы гипнотерапии', 'эриксоновский гипноз'],
    serviceSlug: 'gipnoterapiya-onlayn',
  },
  {
    slug: 'samosabotazh',
    name: 'Самосаботаж',
    description: 'Почему мы саботируем свои цели, откладываем важное и как с этим работать через гипнотерапию.',
    metaDescription: 'Причины самосаботажа и прокрастинации. Как распознать и убрать внутренние блоки с помощью гипнотерапии.',
    keywords: ['самосаботаж причины', 'прокрастинация что делать', 'внутренние блоки психология'],
    serviceSlug: 'samosabotazh-i-bloki',
  },
  {
    slug: 'podsoznanie',
    name: 'Подсознание',
    description: 'Как работает подсознание, ограничивающие убеждения, денежные блоки — и как гипноз помогает их проработать.',
    metaDescription: 'Работа с подсознанием: ограничивающие убеждения, денежные блоки, установки. Как гипноз помогает изменить подсознательные программы.',
    keywords: ['подсознание работа', 'ограничивающие убеждения', 'денежные блоки психология'],
    serviceSlug: 'rabota-s-podsoznaniem',
  },
  {
    slug: 'psikhosomatika',
    name: 'Психосоматика',
    description: 'Как эмоции и стресс влияют на тело. Психосоматические симптомы и методы работы через гипнотерапию.',
    metaDescription: 'Психосоматика: симптомы, причины, лечение гипнозом онлайн. Как стресс влияет на тело и что с этим делать.',
    keywords: ['психосоматика симптомы', 'тело и психика', 'психосоматика лечение'],
    serviceSlug: 'psikhosomatika',
  },
  {
    slug: 'neyverennost',
    name: 'Неуверенность',
    description: 'Как побороть неуверенность, страх провала и синдром самозванца. Практические советы и гипнотерапия.',
    metaDescription: 'Как побороть неуверенность в себе, страх провала и синдром самозванца. Советы гипнотерапевта и методы работы.',
    keywords: ['неуверенность в себе', 'как побороть неуверенность', 'синдром самозванца'],
    serviceSlug: 'neyverennost-i-strakh-provala',
  },
]

/* ── Static pages ── */

export const STATIC_PAGES = [
  { slug: '',                   priority: 1.0, changefreq: 'weekly'  as const },
  { slug: 'uslugi/',            priority: 0.9, changefreq: 'weekly'  as const },
  { slug: 'ob-avtore/',         priority: 0.9, changefreq: 'monthly' as const },
  { slug: 'metod/',             priority: 0.9, changefreq: 'monthly' as const },
  { slug: 'blog/',              priority: 0.8, changefreq: 'weekly'  as const },
  { slug: 'faq/',               priority: 0.7, changefreq: 'monthly' as const },
  { slug: 'kontakty/',          priority: 0.7, changefreq: 'monthly' as const },
  { slug: 'politika-konfidentsialnosti/', priority: 0.3, changefreq: 'yearly' as const },
  { slug: 'disclaimer/',        priority: 0.3, changefreq: 'yearly' as const },
  { slug: 'tseny/',             priority: 0.8, changefreq: 'monthly' as const },
]

/* ── Author info ── */

/* ── Service Icons ── */

export const SERVICE_ICONS: Record<string, string> = {
  'gipnoterapiya-onlayn': '✨',
  'trevoga-i-panicheskiye-ataki': '🫂',
  'rabota-s-podsoznaniem': '🌌',
  'samosabotazh-i-bloki': '🔓',
  'emotsionalnoye-vygoraniye': '🕯️',
  'neyverennost-i-strakh-provala': '🌟',
  'psikhosomatika': '🌿',
  'lichnostnyy-krizis': '🌅',
}

export const AUTHOR = {
  name: 'Вячеслав Подварчан',
  givenName: 'Вячеслав',
  familyName: 'Подварчан',
  jobTitle: 'Гипнотерапевт онлайн',
  description: 'Помогаю освободиться от тревоги, внутренних блоков и самосаботажа через работу с подсознанием, голосом и индивидуальными музыкальными программами. Сертифицированный гипнотерапевт (ABH), практик НЛП (INLPTA), магистр музыкальной терапии (The University of Kansas).',
  image: '/images/about.webp',
  url: '/ob-avtore/',
  sameAs: [
    'https://t.me/SLAVKA_VIP',
    'https://wa.me/380663122069',
  ],
  credentials: [
    {
      name: 'Диплом специалиста с отличием — Практический психолог',
      category: 'degree' as const,
      organization: 'Черкасский национальный университет им. Б. Хмельницкого',
      year: '2010',
    },
    {
      name: 'Магистр музыкального образования — Музыкальная терапия',
      category: 'degree' as const,
      organization: 'The University of Kansas, School of Music',
      year: '2013',
    },
    {
      name: 'Кхенпо (Доктор буддийской философии)',
      category: 'degree' as const,
      organization: 'Shechen Institute of Higher Buddhist Studies (Lekshay Nyidai Ling)',
      year: '2026',
    },
    {
      name: 'INLPTA Certified Practitioner (НЛП Практик)',
      category: 'certification' as const,
      organization: 'Международная ассоциация тренеров НЛП (INLPTA)',
      year: '2010',
    },
    {
      name: 'ABH Certified Hypnotherapist (сертифицированный гипнотерапевт)',
      category: 'certification' as const,
      organization: 'American Board of Hypnotherapy (ABH)',
      year: '2025',
    },
    {
      name: 'Transference-Focused Psychotherapy (TFP) — курс последипломного образования',
      category: 'certification' as const,
      organization: 'Институт психоаналитической психотерапии / TFP Institute (Otto Kernberg, Frank Yeomans)',
      year: '2019',
    },
  ],
}
