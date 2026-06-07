/* ── MCP tool definitions ── */

export interface McpToolDefinition {
  name: string
  description: string
  inputSchema?: Record<string, unknown>
}

export const mcpTools: McpToolDefinition[] = [
  {
    name: 'get_services',
    description: 'Get list of available hypnotherapy services with prices',
  },
  {
    name: 'get_faq',
    description: 'Get frequently asked questions about hypnotherapy',
  },
]
