import { NextResponse } from 'next/server'

export const runtime = 'edge'

const services = [
  {
    id: 'gipnoterapiya-onlayn',
    name: 'Гіпнотерапія онлайн',
    description: 'М\'який еріксонівський гіпноз онлайн (50-60 хв)',
    category: 'hypnotherapy',
  },
  {
    id: 'trevoga-i-panicheskiye-ataki',
    name: 'Тривога та панічні атаки',
    description: 'Позбавлення від тривоги та панічних атак',
    category: 'anxiety',
  },
  {
    id: 'rabota-s-podsoznaniem',
    name: 'Робота з підсвідомістю',
    description: 'Опрацювання підсвідомості та переконань',
    category: 'subconscious',
  },
  {
    id: 'samosabotazh-i-bloki',
    name: 'Самосаботаж і блоки',
    description: 'Подолання самосаботажу та прокрастинації',
    category: 'blocks',
  },
  {
    id: 'emotsionalnoye-vygoraniye',
    name: 'Емоційне вигорання',
    description: 'Відновлення після вигорання',
    category: 'burnout',
  },
]

export async function GET() {
  return NextResponse.json(
    { services },
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
