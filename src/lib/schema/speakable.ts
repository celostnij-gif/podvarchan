/**
 * Generate a SpeakableSpecification JSON-LD object for text-to-speech / voice assistants.
 */
export function speakableSchema(
  cssSelector: string,
  xpath?: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SpeakableSpecification',
  }
  if (cssSelector) result.cssSelector = [cssSelector]
  if (xpath) result.xpath = [xpath]
  return result
}