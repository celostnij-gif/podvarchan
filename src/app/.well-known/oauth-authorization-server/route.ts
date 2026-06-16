import { NextResponse } from 'next/server'

export async function GET() {
  const metadata = {
    issuer: 'https://podvarchan.com',
    authorization_endpoint: 'https://podvarchan.com/api/auth/signin',
    token_endpoint: 'https://podvarchan.com/api/auth/callback/credentials',
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'none'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    scopes_supported: ['openid', 'profile', 'email'],
    code_challenge_methods_supported: ['S256'],
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
