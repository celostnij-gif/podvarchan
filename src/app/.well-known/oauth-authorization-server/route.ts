import { NextResponse } from 'next/server'
import { SITE } from '@/constants'

const ISSUER = SITE.url

export async function GET() {
  const metadata = {
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/api/auth/signin`,
    token_endpoint: `${ISSUER}/api/auth/callback/credentials`,
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'none'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    scopes_supported: ['openid', 'profile', 'email'],
    code_challenge_methods_supported: ['S256'],

    // Agent auth block for AI agent registration/discovery
    agent_auth: {
      skill: 'auth.md',
      register_uri: `${ISSUER}/api/auth/register`,
      identity_types_supported: ['identity_assertion', 'anonymous'],
      identity_assertion: {
        assertion_types_supported: [
          'urn:ietf:params:oauth:token-type:id-jag',
          'verified_email',
        ],
        credential_types_supported: ['client_secret_basic'],
        claim_uri: `${ISSUER}/api/auth/claim`,
        revocation_uri: `${ISSUER}/api/auth/revoke`,
        events_supported: ['revocation'],
      },
      anonymous: {
        credential_types_supported: ['none'],
        claim_uri: `${ISSUER}/api/auth/claim`,
      },
    },
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
