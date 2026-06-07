import { NextResponse } from 'next/server'

export const runtime = 'edge'

const skillsIndex = {
  $schema: 'https://agentskills.io/schemas/v0.2.0/index.json',
  version: '0.2.0',
  domain: 'podvarchan.com',
  skills: [
    {
      name: 'hypnotherapy-booking',
      type: 'workflow',
      description: 'Inquire about hypnotherapy session booking',
      url: 'https://podvarchan.com/.well-known/agent-skills/booking.md',
      sha256: 'a8ae83af9d144aa128d6d1548890c9a3275fc47f22fb48866d0c4e621e650a48',
    },
    {
      name: 'services-catalog',
      type: 'resource',
      description: 'Access the hypnotherapy services catalog',
      url: 'https://podvarchan.com/.well-known/agent-skills/services.md',
      sha256: '652285e981205fb6e9296eee9bb07edba455beeefdb28f0d6c93f3b845fc4466',
    },
  ],
}

export async function GET() {
  return NextResponse.json(skillsIndex, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
