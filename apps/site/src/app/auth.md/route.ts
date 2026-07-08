import { NextResponse } from 'next/server'
import { SITE } from '@/constants'

const AUTH_MD = `# Podvarchan.com — auth.md

## Agent Registration

This service supports OAuth 2.0-based agent registration and authentication
for AI agents acting on behalf of users.

## Discovery

- Authorization Server metadata: ${SITE.url}/.well-known/oauth-authorization-server
- Protected Resource metadata: ${SITE.url}/.well-known/oauth-protected-resource
- Agent registration: ${SITE.url}/api/auth/register
- Identity endpoint: ${SITE.url}/api/auth/identity
- Claim endpoint: ${SITE.url}/api/auth/claim
- Revocation endpoint: ${SITE.url}/api/auth/revoke

## Supported Registration Methods

### 1. Identity Assertion (ID-JAG)

For agent providers that can mint ID-JAG identity assertions
(\`urn:ietf:params:oauth:token-type:id-jag\`):

\`\`\`
POST ${SITE.url}/api/auth/identity
Content-Type: application/json

{
  "type": "identity_assertion",
  "assertion": "<ID-JAG token>"
}
\`\`\`

### 2. Verified Email (Service Auth)

For agents that can present a user's verified email:

\`\`\`
POST ${SITE.url}/api/auth/identity
Content-Type: application/json

{
  "type": "service_auth",
  "login_hint": "user@example.com"
}
\`\`\`

### 3. Anonymous Registration with User Claim

For agents without a pre-existing identity — register anonymously,
then claim the credential later:

\`\`\`
POST ${SITE.url}/api/auth/identity
Content-Type: application/json

{
  "type": "anonymous"
}
\`\`\`

## Credential Exchange

After receiving an \`identity_assertion\`, exchange it for an access token:

\`\`\`
POST ${SITE.url}/api/auth/callback/credentials
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<identity_assertion>
\`\`\`

## Claim Flow

For anonymous or email-based registration, claim the credential:

\`\`\`
POST ${SITE.url}/api/auth/claim
Content-Type: application/json

{
  "claim_token": "<token>",
  "user_code": "<code>"
}
\`\`\`

## Scopes

| Scope | Description |
|-------|-------------|
| \`openid\` | OpenID Connect identity |
| \`profile\` | Public profile data |
| \`email\` | Verified email address |

## Credential Types

- \`client_secret_basic\` — Confidential clients (HTTP Basic auth)
- \`none\` — Public clients (PKCE required)

---

*auth.md for agent discovery — podvarchan@gmail.com*`

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
