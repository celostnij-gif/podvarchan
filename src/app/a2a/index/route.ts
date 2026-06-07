import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-static'

export async function GET() {
  return NextResponse.json(
    {
      name: 'Podvarchan AI Agent Index',
      version: '1.0',
      domain: 'podvarchan.com',
      capabilities: {
        a2a: {
          version: '1.0',
          supportedFeatures: ['skill_discovery', 'task_delegation'],
        },
        mcp: {
          supported: true,
          endpoint: '/.well-known/mcp/server-card.json',
        },
      },
      metadata: {
        description:
          'Agent-to-Agent (A2A) index for Podvarchan – психологічна допомога та консультації',
        agents: {
          index: '/_a2a/index',
        },
      },
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  )
}
