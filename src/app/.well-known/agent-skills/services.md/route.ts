import { NextResponse } from 'next/server'

const CONTENT = `# Services Catalog Skill

## Description

Этот навык предоставляет доступ к каталогу услуг гипнотерапии.

## Available Services

### Гипнотерапия онлайн
Индивидуальная сессия гипнотерапии онлайн (50-60 мин).

### Тривога та панічні атаки
Работа с тревожными расстройствами и паническими атаками.

### Самосаботаж і блоки
Проработка самосаботажа, блоков и ограничивающих убеждений.

### Эмоциональное выгорание
Восстановление после эмоционального выгорания.

## Output

Список услуг с описаниями и ценами.
`

export async function GET() {
  return new NextResponse(CONTENT, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
