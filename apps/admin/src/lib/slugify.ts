/**
 * Lightweight transliteration + slugify for RU/UK → URL-safe slug.
 * Used in admin forms to auto-generate slugBase / locale slug from a title.
 */

const RU_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  // UK extras
  і: 'i', ї: 'yi', є: 'ye', ґ: 'g',
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .split('')
    .map((ch) => RU_MAP[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}
