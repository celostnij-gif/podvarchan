import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  // Auth.js uses HS256 (symmetric) with AUTH_SECRET by default,
  // which means there are no public RSA/EC keys to expose.
  // When asymmetric keys are configured, populate this array.
  const jwks = {
    keys: [],
  }

  return NextResponse.json(jwks, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
