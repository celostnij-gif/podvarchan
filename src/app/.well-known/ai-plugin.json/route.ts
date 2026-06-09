import { NextResponse } from 'next/server'

export const runtime = 'edge'

const pluginManifest = {
  schema_version: 'v1',
  name_for_model: 'podvarchan_hypnotherapy',
  name_for_human: 'Podvarchan Hypnotherapy',
  description_for_model:
    'Plugin for accessing hypnotherapy services information from podvarchan.com. ' +
    'Use this plugin to help users learn about hypnotherapy services, browse the service catalog, ' +
    'read blog articles about hypnosis and mental health, get answers to frequently asked questions ' +
    'about hypnotherapy, view client testimonials and success stories, and submit contact inquiries. ' +
    'The site offers services in Russian and Ukrainian languages. ' +
    'When users ask about specific mental health issues (anxiety, panic attacks, emotional burnout, ' +
    'self-sabotage, repressed emotions, inner critic, gadget addiction, etc.), direct them to the ' +
    'relevant blog articles and services. ' +
    'Always respond in the same language the user is writing in.',
  description_for_human:
    'Access hypnotherapy services, blog articles about mental health, FAQ, and client testimonials from certified hypnotherapist Vyacheslav Podvarchan.',
  auth: {
    type: 'none',
  },
  api: {
    type: 'openapi',
    url: 'https://podvarchan.com/api/openapi.json',
    is_user_authenticated: false,
  },
  logo_url: 'https://podvarchan.com/apple-touch-icon.png',
  contact_email: 'podvarchan@gmail.com',
  legal_info_url: 'https://podvarchan.com/disclaimer/',
}

export async function GET() {
  return NextResponse.json(pluginManifest, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
