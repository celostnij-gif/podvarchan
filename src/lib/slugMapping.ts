/**
 * UK slug mappings for services, blog posts, and blog categories.
 * Maps Russian (RU) slugs → Ukrainian (UK) slugs.
 */

/* ── Services ── */
export const SERVICE_SLUG_UK: Record<string, string> = {
  'gipnoterapiya-onlayn': 'hipnoterapiya-onlayn',
  'onlajn-konsultaciya-psyhologa': 'onlayn-konsultatsiya-psihologa',
  'psyholog-bioenergetyk': 'psiholog-bioenergetik',
  'trevoga-i-panicheskiye-ataki': 'trivoga-i-panichni-ataki',
  'rabota-s-podsoznaniem': 'robota-z-pidsvidomistyu',
  'samosabotazh-i-bloki': 'samosabotazh-i-bloki',
  'emotsionalnoye-vygoraniye': 'emotsiyne-vigorannya',
  'neyverennost-i-strakh-provala': 'nevnennist-i-strah-nevdachi',
  'psikhosomatika': 'psihosomatika',
  'lichnostnyy-krizis': 'osobistisna-kriza',
  'kak-izbavitsya-ot-trevogi': 'yak-pozbutisya-trivogi',
  'postoyannaya-trevoga-bez-prichiny': 'postiyna-trivoga-bez-prichini',
  'utrennyaya-trevoga': 'ranishnya-trivoga',
  'trevoga-pered-snom': 'trivoga-pered-snom',
  'trevoga-posle-stressa': 'trivoga-pislya-stresu',
  'vnutrenneye-napryazheniye': 'vnutrishnya-napruga',
  'navyazchivye-mysli': 'nabyadlivi-dumki',
  'strakh-budushchego': 'strakh-maybutnogo',
  'tsifrovoy-detoks-i-gadzhet-zavisimost': 'tsifroviy-detoks-i-gadzhet-zalezhnist',
}

/* ── Blog Posts ── */
export const BLOG_SLUG_UK: Record<string, string> = {
  'chto-takoe-gipnoterapiya': 'shcho-take-gipnoterapiya',
  'kak-rabotaet-gipnoz': 'yak-pratsyuye-gipnoz',
  'trevoga-prichiny-i-simptomy': 'trivoga-prichini-i-simptomi',
  'kak-spravitsya-s-trevogoy': 'yak-vporatisya-z-trivogoyu',
  'panicheskiye-ataki-chto-delat': 'panichni-ataki-shcho-robiti',
  'chto-takoe-samosabotazh': 'shcho-take-samosabotazh',
  'samosabotazh-prichiny': 'samosabotazh-prichini',
  'emotsionalnoye-vygoraniye-simptomy': 'emotsiyne-vigorannya-simptomi',
  'vnutrenniy-kritik': 'vnutrishniy-kritik',
  'podavlennyye-emotsii': 'podavleni-emotsiyi',
  'eksistentsialnyy-krizis': 'ekzistentsialna-kriza',
  'gipnoterapiya-onlayn-kak-prokhodit': 'gipnoterapiya-onlayn-yak-prokhodit',
  'priznaki-gadzhet-zavisimosti': 'oznaki-gadzhet-zalezhnosti',
  'tsifrovoy-detoks-poshagovoe-rukovodstvo': 'tsifroviy-detoks-pokrokova-instruktsiya',
  'vliyanie-pesen-na-podsoznanie': 'vpliv-pisen-na-pidsvidomist',
  'detskaya-gadzhet-zavisimost': 'dityacha-gadzhet-zalezhnist',
  'net-sil-chto-delat': 'nema-sil-shcho-robiti',
  'postoyannaya-ustalost-prichiny': 'postiyna-vtoma-prichini',
  'vliyanie-pesen-na-kachestvo-zhizni': 'vpliv-pisen-na-yakist-zhittya',
  'psikhosomatika-chto-eto': 'psihosomatika-shcho-tse',
  'neyverennost-kak-preodolet': 'nevnennist-yak-podolati',
  'pochemu-trevoga-ne-prokhodit-godami': 'chomu-trivoga-ne-minaye-rokarami',
  'kom-v-gorle-pri-trevoge': 'grudka-v-gorli-pri-trivozi',
  'pochemu-voznikaet-panika-nochyu': 'chomu-vinikaye-panika-vnochi',
  'strakh-smerti-bez-prichiny': 'strakh-smerti-bez-prichini',
  'postoyannoe-vnutrennee-napryazhenie': 'postiyne-vnutrishnye-napruzhennya',
  'kak-perestat-boyatsya-budushchego': 'yak-perestati-boyatisya-maybutnogo',
  'psikhosomatika-golovokruzheniya': 'psihosomatika-zamorochennya',
  'psikhosomatika-boli-v-shee': 'psihosomatika-bolyu-v-shiyi',
  'psikhosomatika-davleniya': 'psihosomatika-tisku',
  'ptsr-u-veteranov-simptomy-i-pomoshch': 'ptsr-u-veteraniv-oznaky-i-dopomoha',
  'trevoga-polnyy-putevoditel': 'trivoga-povniy-putivnik',
}

/* ── Blog Categories ── */
export const CATEGORY_SLUG_UK: Record<string, string> = {
  'trevoga': 'trivoga',
  'gipnoterapiya': 'hipnoterapiya',
  'samosabotazh': 'samosabotazh',
  'podsoznanie': 'pidsvidomist',
  'psikhosomatika': 'psihosomatika',
  'neyverennost': 'nevnennist',
  'tsifrovoy-detoks': 'tsifroviy-detoks',
  'vygoraniye': 'vigorannya',
  'krizis': 'kriza',
  'zagalni-zapit': 'zagalni-zapit',
  'ptsr': 'ptsr',
}

/* ── Reverse mappings (UK → RU) ── */

export const SERVICE_SLUG_FROM_UK: Record<string, string> = {}
for (const [ru, uk] of Object.entries(SERVICE_SLUG_UK)) {
  SERVICE_SLUG_FROM_UK[uk] = ru
}

export const BLOG_SLUG_FROM_UK: Record<string, string> = {}
for (const [ru, uk] of Object.entries(BLOG_SLUG_UK)) {
  BLOG_SLUG_FROM_UK[uk] = ru
}

export const CATEGORY_SLUG_FROM_UK: Record<string, string> = {}
for (const [ru, uk] of Object.entries(CATEGORY_SLUG_UK)) {
  CATEGORY_SLUG_FROM_UK[uk] = ru
}


/* ── Helpers ── */

/** Resolve slug to the canonical RU slug for data lookups */
export function resolveServiceSlug(slug: string): string {
  if (SERVICE_SLUG_FROM_UK[slug]) return SERVICE_SLUG_FROM_UK[slug]
  return slug // already RU slug
}

export function resolveBlogSlug(slug: string): string {
  if (BLOG_SLUG_FROM_UK[slug]) return BLOG_SLUG_FROM_UK[slug]
  return slug
}

export function resolveCategorySlug(slug: string): string {
  if (CATEGORY_SLUG_FROM_UK[slug]) return CATEGORY_SLUG_FROM_UK[slug]
  return slug
}
