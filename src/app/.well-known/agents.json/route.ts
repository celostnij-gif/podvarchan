import { NextResponse } from 'next/server'

export const runtime = 'edge'

const CONTENT = {
  $schema: 'https://agentskills.io/schemas/agents-index.json',
  version: '1.0',
  domain: 'podvarchan.com',
  agents: {
    index: '/_a2a/index',
    mcp: '/.well-known/mcp/server-card.json',
    chatgpt_plugin: '/.well-known/ai-plugin.json',
  },
}

export async function GET() {
  return NextResponse.json(CONTENT, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
