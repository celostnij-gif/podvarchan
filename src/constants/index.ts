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
      { label: 'Цифровой детокс', href: '/uslugi/tsifrovoy-detoks-i-gadzhet-zavisimost/' },
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
  { slug: 'gipnoterapiya-onlayn', category: 'gipnoterapiya', priority: 1, icon: '✨', ctaLink: '/kontakty/' },
  { slug: 'onlajn-konsultaciya-psyhologa', category: 'zagalni-zapit', priority: 1, icon: '👤', ctaLink: '/kontakty/' },
  { slug: 'psyholog-bioenergetyk', category: 'zagalni-zapit', priority: 1, icon: '🔮', ctaLink: '/kontakty/' },
  { slug: 'trevoga-i-panicheskiye-ataki', category: 'trevoga', priority: 1, icon: '🫂', ctaLink: '/kontakty/' },
  { slug: 'rabota-s-podsoznaniem', category: 'podsoznanie', priority: 2, icon: '🌌', ctaLink: '/kontakty/' },
  { slug: 'samosabotazh-i-bloki', category: 'samosabotazh', priority: 2, icon: '🔓', ctaLink: '/kontakty/' },
  { slug: 'emotsionalnoye-vygoraniye', category: 'vygoraniye', priority: 2, icon: '🕯️', ctaLink: '/kontakty/' },
  { slug: 'neyverennost-i-strakh-provala', category: 'neyverennost', priority: 3, icon: '🌟', ctaLink: '/kontakty/' },
  { slug: 'psikhosomatika', category: 'psikhosomatika', priority: 3, icon: '🌿', ctaLink: '/kontakty/' },
  { slug: 'lichnostnyy-krizis', category: 'krizis', priority: 3, icon: '🌱', ctaLink: '/kontakty/' },
  { slug: 'kak-izbavitsya-ot-trevogi', category: 'trevoga', priority: 3, icon: '🦋', ctaLink: '/kontakty/' },
  { slug: 'postoyannaya-trevoga-bez-prichiny', category: 'trevoga', priority: 3, icon: '🌫️', ctaLink: '/kontakty/' },
  { slug: 'utrennyaya-trevoga', category: 'trevoga', priority: 3, icon: '☀️', ctaLink: '/kontakty/' },
  { slug: 'trevoga-pered-snom', category: 'trevoga', priority: 3, icon: '🌙', ctaLink: '/kontakty/' },
  { slug: 'trevoga-posle-stressa', category: 'trevoga', priority: 3, icon: '🌊', ctaLink: '/kontakty/' },
  { slug: 'vnutrenneye-napryazheniye', category: 'trevoga', priority: 3, icon: '⚡', ctaLink: '/kontakty/' },
  { slug: 'navyazchivye-mysli', category: 'trevoga', priority: 3, icon: '🌀', ctaLink: '/kontakty/' },
  { slug: 'strakh-budushchego', category: 'trevoga', priority: 3, icon: '🌅', ctaLink: '/kontakty/' },
]

/* ── Blog Categories ── */

export const BLOG_CATEGORIES: BlogCategory[] = [
  { slug: 'trevoga', serviceSlug: 'trevoga-i-panicheskiye-ataki' },
  { slug: 'gipnoterapiya', serviceSlug: 'gipnoterapiya-onlayn' },
  { slug: 'samosabotazh', serviceSlug: 'samosabotazh-i-bloki' },
  { slug: 'podsoznanie', serviceSlug: 'rabota-s-podsoznaniem' },
  { slug: 'psikhosomatika', serviceSlug: 'psikhosomatika' },
  { slug: 'neyverennost', serviceSlug: 'neyverennost-i-strakh-provala' },
  { slug: 'tsifrovoy-detoks', serviceSlug: 'tsifrovoy-detoks-i-gadzhet-zavisimost' },
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
  'gipnoterapiya-onlayn': 'brain',
  'onlajn-konsultaciya-psyhologa': 'user-check',
  'psyholog-bioenergetyk': 'sparkles',
  'trevoga-i-panicheskiye-ataki': 'heart',
  'rabota-s-podsoznaniem': 'moon',
  'samosabotazh-i-bloki': 'lock',
  'emotsionalnoye-vygoraniye': 'flame',
  'neyverennost-i-strakh-provala': 'shield-off',
  'psikhosomatika': 'leaf',
  'lichnostnyy-krizis': 'compass',
  'tsifrovoy-detoks-i-gadzhet-zavisimost': 'smartphone',
  'kak-izbavitsya-ot-trevogi': 'feather',
  'postoyannaya-trevoga-bez-prichiny': 'cloud-fog',
  'utrennyaya-trevoga': 'sunrise',
  'trevoga-pered-snom': 'moon',
  'trevoga-posle-stressa': 'waves',
  'vnutrenneye-napryazheniye': 'zap',
  'navyazchivye-mysli': 'refresh-cw',
  'strakh-budushchego': 'sunset',
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
    'https://t.me/podvarchan',
    'https://wa.me/380663122069',
    'https://www.instagram.com/vip_podvarchan/',
    'https://www.facebook.com/SLAVKA10VIP',
    'https://x.com/PodvarchanVip',
    'https://mentalzon.com/ru/therapist/19292/вячеслав-подварчан-иванович',
    'https://www.b17.ru/podvarchan_vyacheslav/',
    /* ═══════════════════════════════════════════════════════════
       ⚡  E-E-A-T сигналы — добавить по мере регистрации:
       LinkedIn, YouTube, Google Business Profile
       ═══════════════════════════════════════════════════════════ */
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
