import { NextResponse } from 'next/server'
import { mcpTools } from '@/lib/mcp/tools'

const serverCard = {
  schema_version: '1.0',
  serverInfo: {
    name: 'podvarchan-mcp-server',
    version: '1.0.0',
    description:
      'Hypnotherapy services MCP server. Provides access to service catalog, booking inquiries, and FAQ.',
    homepage: 'https://podvarchan.com',
  },
  transport: {
    type: 'http',
    endpoint: 'https://podvarchan.com/api/mcp',
  },
  capabilities: {
    tools: true,
    resources: true,
    prompts: false,
  },
  tools: mcpTools.map(({ name, description }) => ({ name, description })),
}

export async function GET() {
  return NextResponse.json(serverCard, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
