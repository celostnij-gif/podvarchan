/**
 * Базовый валидатор Schema.org JSON-LD.
 * Проверяет обязательные поля и тип.
 * В production логи отключаются.
 */

export type SchemaType =
  | 'Person'
  | 'Article'
  | 'Service'
  | 'ProfessionalService'
  | 'FAQPage'
  | 'BreadcrumbList'
  | 'WebSite'
  | 'WebPage'

const REQUIRED_FIELDS: Record<SchemaType, string[]> = {
  Person: ['@context', '@type', 'name', 'url'],
  Article: ['@context', '@type', 'headline', 'author', 'datePublished'],
  Service: ['@context', '@type', 'name', 'description', 'provider'],
  ProfessionalService: ['@context', '@type', 'name', 'url'],
  FAQPage: ['@context', '@type', 'mainEntity'],
  BreadcrumbList: ['@context', '@type', 'itemListElement'],
  WebSite: ['@context', '@type', 'url', 'name'],
  WebPage: ['@context', '@type', 'url', 'name'],
}

export interface ValidationResult {
  valid: boolean
  type: string
  errors: string[]
  warnings: string[]
}

/**
 * Проверяет один schema-объект на корректность.
 * Возвращает результат валидации.
 *
 * @param schema - JSON-LD объект
 * @param options.throwOnError - бросить исключение при ошибке (для тестов)
 */
export function validateSchema(
  schema: Record<string, unknown>,
  options: { throwOnError?: boolean } = {}
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    type: (schema['@type'] as string) ?? 'unknown',
    errors: [],
    warnings: [],
  }

  // Проверка @context
  if (!schema['@context']) {
    result.errors.push('Отсутствует @context')
  } else if (schema['@context'] !== 'https://schema.org') {
    result.warnings.push(`@context должен быть "https://schema.org", получено "${schema['@context']}"`)
  }

  // Проверка @type
  const type = schema['@type'] as string | undefined
  if (!type) {
    result.errors.push('Отсутствует @type')
    result.valid = false
    return logAndReturn(result, options.throwOnError)
  }

  // Проверка обязательных полей для данного типа
  const required = REQUIRED_FIELDS[type as SchemaType]
  if (required) {
    for (const field of required) {
      if (field === '@context' || field === '@type') continue
      const value = schema[field]
      if (value === undefined || value === null || value === '') {
        result.errors.push(`[${type}] Отсутствует обязательное поле: "${field}"`)
      }
    }
  } else {
    result.warnings.push(`Неизвестный тип schema: "${type}" — нет правил валидации`)
  }

  // Проверка пустых массивов
  for (const [key, value] of Object.entries(schema)) {
    if (Array.isArray(value) && value.length === 0) {
      result.warnings.push(`[${type}] Пустой массив: "${key}"`)
    }
  }

  // Проверка @id: должен быть абсолютным URL
  const id = schema['@id'] as string | undefined
  if (id && !id.startsWith('http')) {
    result.warnings.push(`[${type}] @id должен быть абсолютным URL, получено: "${id}"`)
  }

  result.valid = result.errors.length === 0
  return logAndReturn(result, options.throwOnError)
}

/**
 * Проверяет массив schema-объектов.
 * Возвращает массив результатов.
 */
export function validateAllSchemas(
  schemas: Record<string, unknown>[]
): ValidationResult[] {
  return schemas.map((s) => validateSchema(s))
}

function logAndReturn(
  result: ValidationResult,
  throwOnError?: boolean
): ValidationResult {
  if (process.env.NODE_ENV === 'development') {
    if (result.errors.length > 0) {
      console.warn(`[Schema Validation] ${result.type}:`, result.errors)
    }
    if (result.warnings.length > 0) {
      console.log(`[Schema Validation] ${result.type} warnings:`, result.warnings)
    }
  }

  if (throwOnError && !result.valid) {
    throw new Error(
      `Schema validation failed for ${result.type}:\n${result.errors.join('\n')}`
    )
  }

  return result
}
