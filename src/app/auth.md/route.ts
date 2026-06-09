import { NextResponse } from 'next/server'

const CONTENT = `# Authentication Guide for AI Agents — podvarchan.com

## Overview

This site provides hypnotherapy services. AI agents may access
public content without authentication. Protected admin APIs
require Bearer token authentication.

## Public Access

All GET requests to public pages do not require authentication.

## Agent Registration

To register an AI agent for API access:

1. Contact: info@podvarchan.com
2. Provide: agent name, purpose, organization
3. Receive: API key or OAuth client credentials

## OAuth 2.0 Flow

- Discovery: /.well-known/oauth-authorization-server
- Token endpoint: /api/auth/callback/credentials
- Scopes: openid profile email admin
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
