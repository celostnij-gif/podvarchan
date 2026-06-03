'use client'

import { useRegisteredSchemas } from '@/providers/BreadcrumbsProvider'

/* ── PageSchemaRenderer — рендерит page-specific JSON-LD схемы из контекста ── */

function PageSchemaRenderer() {
  const schemas = useRegisteredSchemas()
  if (schemas.length === 0) return null

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`page-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}

export { PageSchemaRenderer }
