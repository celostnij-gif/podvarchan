/**
 * Соединяет части URL, убирая двойные слэши (кроме протокольного //).
 * Пример: cleanUrl('https://example.com', '/uk', '/page/') => 'https://example.com/uk/page/'
 */
export function cleanUrl(...parts: string[]): string {
  return parts.join('/').replace(/([^:]\/)\/+/g, '$1')
}

/**
 * Сериализует Schema.org объект в JSON-LD для <script type="application/ld+json">.
 *
 * Экранирует `<` → `\u003c` (правило E плана владельца / безопасность):
 * JSON.stringify не экранирует `<` по умолчанию, а внутри <script> строка
 * вида `</script>` или `<tag` из пользовательского контента (отзыв, текст
 * FAQ) сломала бы парсинг HTML/script и открыла XSS-вектор.
 *
 * Единая точка рендера — все страницы импортируют её, не вызывают
 * JSON.stringify напрямую (grep `JSON.stringify(` по schema-рендерам = пусто).
 */
export function renderJsonLd(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}
