/**
 * Загружает шрифт Google Fonts для использования в OG-изображениях (next/og).
 * В edge-рантайме (Cloudflare Workers) нет доступа к fs, поэтому шрифты
 * загружаются через fetch с Google Fonts CDN.
 *
 * Важно: Satori (движок next/og) не поддерживает woff2, только woff и ttf.
 * Используем User-Agent Internet Explorer 11, чтобы Google Fonts вернул
 * .woff (не woff2).
 *
 * @param fontFamily — название семейства шрифта (например, 'Inter')
 * @param weight — начертание (400, 600, 700)
 * @returns ArrayBuffer с данными шрифта
 */
export async function loadGoogleFont(
  fontFamily: string,
  weight: number = 400
): Promise<ArrayBuffer> {
  // User-Agent IE 11, чтобы Google Fonts отдал .woff, а не .woff2
  const cssUrl = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@${weight}&display=swap`

  const css = await fetch(cssUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko',
    },
  }).then((r) => {
    if (!r.ok) throw new Error(`Font CSS fetch failed: ${r.status}`)
    return r.text()
  })

  // Извлекаем первый src: url(...) из CSS (cyrillic subset — содержит кириллицу)
  const match = css.match(/src:\s*url\(([^)]+)\)/)
  if (!match) throw new Error(`Font URL not found in CSS for ${fontFamily}`)

  const fontUrl = match[1]
  const response = await fetch(fontUrl)
  if (!response.ok) throw new Error(`Font file fetch failed: ${response.status}`)

  return response.arrayBuffer()
}
