import { NextRequest, NextResponse } from 'next/server'
import { mcpTools, type McpToolDefinition } from '@/lib/mcp/tools'

export const runtime = 'edge'

/* ── Types ── */

interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: Record<string, unknown>
  id: string | number | null
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  result?: unknown
  error?: { code: number; message: string }
  id: string | number | null
}

/* ── CORS headers ── */

const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=3600',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/* ── OPTIONS (CORS preflight) ── */

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: CORS_HEADERS })
}

/* ── Handlers ── */

function handleToolsList(id: string | number | null): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    result: { tools: mcpTools },
    id,
  }
}

function handleToolsCall(
  params: Record<string, unknown> | undefined,
  id: string | number | null,
): JsonRpcResponse {
  const toolName = params?.name as string | undefined

  if (!toolName) {
    return {
      jsonrpc: '2.0',
      error: { code: -32602, message: 'Missing tool name' },
      id,
    }
  }

  const tool: McpToolDefinition | undefined = mcpTools.find((t) => t.name === toolName)

  if (!tool) {
    return {
      jsonrpc: '2.0',
      error: { code: -32602, message: `Unknown tool: ${toolName}` },
      id,
    }
  }

  return {
    jsonrpc: '2.0',
    result: {
      content: [
        {
          type: 'text',
          text: `${tool.name}: ${tool.description} (stub — real implementation pending)`,
        },
      ],
    },
    id,
  }
}

/* ── POST handler ── */

export async function POST(request: NextRequest) {
  try {
    const body: JsonRpcRequest = await request.json()

    if (body.jsonrpc !== '2.0') {
      return NextResponse.json(
        { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid JSON-RPC request' }, id: body.id ?? null },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    const requestId = body.id ?? null
    let response: JsonRpcResponse

    switch (body.method) {
      case 'tools/list':
        response = handleToolsList(requestId)
        break
      case 'tools/call':
        response = handleToolsCall(body.params, requestId)
        break
      default:
        response = {
          jsonrpc: '2.0',
          error: { code: -32601, message: `Method not found: ${body.method}` },
          id: requestId,
        }
    }

    return NextResponse.json(response, {
      status: response.error ? 400 : 200,
      headers: CORS_HEADERS,
    })
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
      { status: 400, headers: CORS_HEADERS },
    )
  }
}
