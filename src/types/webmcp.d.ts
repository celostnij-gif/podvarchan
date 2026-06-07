/* ── WebMCP: Browser AI Agent Context API ── */

interface WebMCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  execute: (params: Record<string, unknown>) => Promise<unknown>
}

interface Navigator {
  modelContext?: {
    provideContext: (tools: WebMCPTool[]) => void
  }
}
