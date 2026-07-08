/**
 * Маппінг категорій блогу до відповідних сторінок послуг.
 * Використовується для внутрішньої перелінковки: стаття блогу → релевантна послуга.
 */
export const CATEGORY_TO_SERVICE: Record<string, string> = {
  trevoga: 'trevoga-i-panicheskiye-ataki',
  samosabotazh: 'samosabotazh-i-bloki',
  gipnoterapiya: 'gipnoterapiya-onlayn',
  podsoznanie: 'rabota-s-podsoznaniem',
  psikhosomatika: 'psikhosomatika',
  vygoraniye: 'emotsionalnoye-vygoraniye',
  neyverennost: 'neyverennost-i-strakh-provala',
  krizis: 'lichnostnyy-krizis',
  'tsifrovoy-detoks': 'tsifrovoy-detoks-i-gadzhet-zavisimost',
  ptsr: 'trevoga-i-panicheskiye-ataki',
}

/**
 * Зворотний маппінг: slug послуги → масив slug категорій блогу.
 * Автоматично будується з CATEGORY_TO_SERVICE.
 */
const SERVICE_TO_CATEGORIES: Record<string, string[]> = {}
for (const [cat, svc] of Object.entries(CATEGORY_TO_SERVICE)) {
  if (!SERVICE_TO_CATEGORIES[svc]) SERVICE_TO_CATEGORIES[svc] = []
  SERVICE_TO_CATEGORIES[svc].push(cat)
}

/**
 * Повертає slug категорій блогу, що відповідають послузі.
 * Якщо послугу не знайдено, повертає порожній масив.
 */
export function getCategorySlugsByService(serviceSlug: string): string[] {
  return SERVICE_TO_CATEGORIES[serviceSlug] ?? []
}

/**
 * Повертає slug послуги за категорією блогу.
 * Якщо категорію не знайдено, повертає undefined.
 */
export function getServiceSlugByCategory(categorySlug: string): string | undefined {
  return CATEGORY_TO_SERVICE[categorySlug]
}
