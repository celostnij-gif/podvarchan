import { NextResponse } from 'next/server'

const CONTENT = `# Services Catalog Skill

## Description

Цей навик надає доступ до каталогу послуг гіпнотерапії.

## Available Services

### Гіпнотерапія онлайн
Індивідуальна сесія гіпнотерапії онлайн (50-60 хв).

### Тривога та панічні атаки
Робота з тривожними розладами та панічними атаками.

### Самосаботаж і блоки
Опрацювання самосаботажу, блоків та обмежувальних переконань.

### Емоційне вигорання
Відновлення після емоційного вигорання.

## Output

Список послуг з описами та цінами.
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
