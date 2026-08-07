/**
 * Парсинг дат из D1-строк (ISO 8601 или epoch-millis).
 *
 * Исторический баг: `pages.updated_at` / `blog_posts.updated_at` в проде
 * содержали и ISO-строки, и epoch-millis (10-13 цифр) — результат записи
 * `new Date().getTime()` из разных версий админки. parseDate() нормализует
 * оба формата, не мутируя D1.
 */
export function parseDate(
  value: string | number | Date | null | undefined,
): Date | undefined {
  if (value === null || value === undefined) return undefined
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value
  }
  if (typeof value === 'number') {
    return parseNumeric(String(value))
  }
  const s = value.trim()
  if (s === '') return undefined
  if (/^\d{10,13}$/.test(s)) return parseNumeric(s)
  // голые цифры вне epoch-диапазона (например '12345') V8 трактует как год — отклоняем
  if (/^\d+$/.test(s)) return undefined
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function parseNumeric(digits: string): Date | undefined {
  const n = Number(digits)
  if (!Number.isFinite(n) || n <= 0) return undefined
  // 10 цифр = секунды (1.7e9 для 2020-х), 13 = миллисекунды
  const ms = n < 1e12 ? n * 1000 : n
  const d = new Date(ms)
  return Number.isNaN(d.getTime()) ? undefined : d
}
