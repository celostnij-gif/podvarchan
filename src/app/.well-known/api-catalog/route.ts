import { NextResponse } from 'next/server'

export async function GET() {
  const linkset = [
    {
      anchor: 'https://podvarchan.com/api',
      'https://www.iana.org/assignments/relation/service-desc': [
        { href: 'https://podvarchan.com/api/openapi.json' },
      ],
      'https://www.iana.org/assignments/relation/service-doc': [
        { href: 'https://podvarchan.com/api/docs' },
      ],
      'https://www.iana.org/assignments/relation/status': [
        { href: 'https://podvarchan.com/api/health' },
      ],
    },
  ]

  return NextResponse.json(
    { linkset },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/linkset+json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    },
  )
}
