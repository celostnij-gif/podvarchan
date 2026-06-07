'use client'

import { useEffect } from 'react'

/**
 * WebMCPProvider — регистрирует инструменты сайта в navigator.modelContext
 * для браузерных AI-агентов (Chrome Built-in AI / WebMCP).
 *
 * Спека: https://webmachinelearning.github.io/webmcp/
 * Не рендерит UI — только регистрирует инструменты при монтировании.
 */

const tools: WebMCPTool[] = [
  {
    name: 'get_services',
    description: 'Get list of hypnotherapy services with descriptions and prices',
    inputSchema: { type: 'object', properties: {}, required: [] },
    execute: async () => {
      const res = await fetch('/api/services')
      return res.json()
    },
  },
  {
    name: 'submit_contact_inquiry',
    description: 'Submit a contact inquiry for hypnotherapy consultation',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Full name' },
        email: { type: 'string', description: 'Email address' },
        message: { type: 'string', description: 'Inquiry message' },
      },
      required: ['name', 'email', 'message'],
    },
    execute: async (params: Record<string, unknown>) => {
      const res = await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'Content-Type': 'application/json' },
      })
      return res.json()
    },
  },
]

export default function WebMCPProvider() {
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'modelContext' in navigator) {
      navigator.modelContext?.provideContext(tools)
    }
  }, [])

  return null
}
