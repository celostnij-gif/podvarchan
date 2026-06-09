import { NextResponse } from 'next/server'

const CONTENT = `# Booking Skill

## Description

Этот навык позволяет запросить информацию о записи на сеанс гипнотерапии.

## Input Parameters

- preferred_date: string (ISO 8601)
- service_type: string (individual|course_5|course_10)

## Output

Ссылка на форму записи или контактная информация.
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
