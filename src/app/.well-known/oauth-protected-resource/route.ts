import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const metadata = {
    resource: 'https://podvarchan.com',
    authorization_servers: ['https://podvarchan.com'],
    scopes_supported: ['openid', 'profile', 'email', 'admin'],
    bearer_methods_supported: ['header'],
    resource_signing_alg_values_supported: ['RS256'],
    resource_documentation: 'https://podvarchan.com/api/docs',
  }

  return NextResponse.json(metadata, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
