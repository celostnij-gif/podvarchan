/**
 * Соединяет части URL, убирая двойные слэши (кроме протокольного //).
 * Пример: cleanUrl('https://example.com', '/uk', '/page/') => 'https://example.com/uk/page/'
 */
export function cleanUrl(...parts: string[]): string {
  return parts.join('/').replace(/([^:]\/)\/+/g, '$1')
}
