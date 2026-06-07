import { NextResponse } from 'next/server'

export const runtime = 'edge'

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Podvarchan API',
    version: '1.0.0',
    description: 'API for Podvarchan — психологічна допомога та консультації',
  },
  servers: [
    {
      url: 'https://podvarchan.com/api',
      description: 'Production server',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const

export async function GET() {
  return NextResponse.json(openApiSpec, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
