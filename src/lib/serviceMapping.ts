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
}

/**
 * Повертає slug послуги за категорією блогу.
 * Якщо категорію не знайдено, повертає undefined.
 */
export function getServiceSlugByCategory(categorySlug: string): string | undefined {
  return CATEGORY_TO_SERVICE[categorySlug]
}
