import { NextResponse } from 'next/server'
import { SITE } from '@/constants'

const AUTH_MD = `# Podvarchan.com — auth.md

## Agent Registration

This service supports OAuth 2.0-based agent registration and authentication.
AI agents can register to access the Podvarchan.com API for session management,
content retrieval, and communication features.

## Authorization Server

- **Issuer**: ${SITE.url}
- **Authorization Endpoint**: ${SITE.url}/api/auth/signin
- **Token Endpoint**: ${SITE.url}/api/auth/callback/credentials
- **Registration**: ${SITE.url}/api/auth/register

## Supported Methods

### OAuth 2.0 Authorization Code Flow

\`\`\`
POST ${SITE.url}/api/auth/signin
Content-Type: application/json

{
  "client_id": "your_client_id",
  "redirect_uri": "https://youragent.com/callback",
  "response_type": "code",
  "scope": "openid profile email"
}
\`\`\`

### Client Credentials Flow

For server-to-server agent communication:

\`\`\`
POST ${SITE.url}/api/auth/callback/credentials
Content-Type: application/json

{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "grant_type": "client_credentials"
}
\`\`\`

## Credential Types

- \`client_secret_basic\` — HTTP Basic auth with client ID and secret
- \`none\` — Public clients (PKCE required)

## Identity Assertion

Supported token types for identity delegation:

- \`urn:ietf:params:oauth:token-type:id-jag\` — JWT-based agent identity assertion
- \`verified_email\` — Email-verified identity assertion

## Required Scopes

| Scope | Description |
|-------|-------------|
| \`openid\` | OpenID Connect identity |
| \`profile\` | Access to public profile data |
| \`email\` | Access to verified email |
| \`admin\` | Administrative operations |

## Discovery

Authorization Server metadata: ${SITE.url}/.well-known/oauth-authorization-server
Protected Resource metadata: ${SITE.url}/.well-known/oauth-protected-resource
Agent registration: ${SITE.url}/.well-known/oauth-authorization-server

## Claim & Revocation

- **Claim URI**: ${SITE.url}/api/auth/claim
- **Revocation URI**: ${SITE.url}/api/auth/revoke

---

*Generated for agent discovery. For questions contact podvarchan@gmail.com*
`

export async function GET() {
  return new NextResponse(AUTH_MD, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
