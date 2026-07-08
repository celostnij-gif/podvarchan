import { NextResponse } from 'next/server'

export async function GET() {
  const metadata = {
    issuer: 'https://podvarchan.com',
    authorization_endpoint: 'https://podvarchan.com/api/auth/signin',
    token_endpoint: 'https://podvarchan.com/api/auth/callback/credentials',
    userinfo_endpoint: 'https://podvarchan.com/api/auth/session',
    jwks_uri: 'https://podvarchan.com/.well-known/jwks.json',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    scopes_supported: ['openid', 'profile', 'email'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256', 'HS256'],
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
