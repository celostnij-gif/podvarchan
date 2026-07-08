import { NextResponse } from 'next/server'

const CONTENT = `# Booking Skill

## Description

Цей навик дозволяє отримати інформацію про запис на сеанс гіпнотерапії.

## Input Parameters

- preferred_date: string (ISO 8601)
- service_type: string (individual|course_5|course_10)

## Output

Посилання на форму запису або контактна інформація.
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
