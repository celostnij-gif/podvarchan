import { NextRequest, NextResponse } from 'next/server'

import { getPublishedServices } from '@/lib/content'

/* ── Service type ── */

interface ServiceResponse {
  id: string
  slug: string
  name: string
  description: string | null
  category: string | null
  icon: string | null
  priority: number
}

/* ── Static fallback data ── */

const FALLBACK_SERVICES: ServiceResponse[] = [
  {
    id: 'gipnoterapiya-onlayn',
    slug: 'gipnoterapiya-onlayn',
    name: 'Гіпнотерапія онлайн',
    description: "М'який еріксонівський гіпноз онлайн (50-60 хв)",
    category: 'hypnotherapy',
    icon: null,
    priority: 3,
  },
  {
    id: 'trevoga-i-panicheskiye-ataki',
    slug: 'trevoga-i-panicheskiye-ataki',
    name: 'Тривога та панічні атаки',
    description: 'Позбавлення від тривоги та панічних атак',
    category: 'anxiety',
    icon: null,
    priority: 3,
  },
  {
    id: 'rabota-s-podsoznaniem',
    slug: 'rabota-s-podsoznaniem',
    name: 'Робота з підсвідомістю',
    description: 'Опрацювання підсвідомості та переконань',
    category: 'subconscious',
    icon: null,
    priority: 3,
  },
  {
    id: 'samosabotazh-i-bloki',
    slug: 'samosabotazh-i-bloki',
    name: 'Самосаботаж і блоки',
    description: 'Подолання самосаботажу та прокрастинації',
    category: 'blocks',
    icon: null,
    priority: 3,
  },
  {
    id: 'emotsionalnoye-vygoraniye',
    slug: 'emotsionalnoye-vygoraniye',
    name: 'Емоційне вигорання',
    description: 'Відновлення після вигорання',
    category: 'burnout',
    icon: null,
    priority: 3,
  },
]

/* ── D1 query via content layer ── */

async function getServicesFromDb(locale: 'ru' | 'uk'): Promise<ServiceResponse[] | null> {
  const items = await getPublishedServices(locale)
  if (!items || items.length === 0) return null

  return items.map((item) => ({
    id: item.slugBase,
    slug: item.translation.slug,
    name: item.translation.title,
    description: item.translation.description,
    category: item.category,
    icon: item.icon,
    priority: item.priority,
  }))
}

/* ── GET handler ── */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') === 'uk' ? 'uk' : 'ru'

  const services = (await getServicesFromDb(locale)) ?? FALLBACK_SERVICES

  return NextResponse.json(
    { services, locale },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    },
  )
}
