#!/usr/bin/env npx tsx
/**
 * Podvarchan — Pricing plans seed (UPSERT).
 *
 * Единый источник цен: прайс /tseny/ (4 позиции: free/single/premium/elite).
 * Тексты сверены с продом /ru/tseny/ и /uk/tsiny/ (2026-08-07) и messages.
 *
 * Usage:
 *   npx tsx scripts/seed-pricing.ts            → scripts/seed-pricing-output.sql
 *   npx wrangler d1 execute podvarchan --file=scripts/seed-pricing-output.sql --remote
 */
import { writeFileSync } from 'fs'
import { join } from 'path'

const SQL: string[] = []
const emit = (line: string) => SQL.push(line)
const esc = (s: string) => s.replace(/'/g, "''")
const ts = () => new Date().toISOString()

interface PlanSeed {
  id: string
  key: 'free' | 'single' | 'premium' | 'elite'
  price: number
  oldPrice: number | null
  sortOrder: number
  badgeRu?: string
  badgeUk?: string
  tr: Record<'ru' | 'uk', { title: string; subtitle: string; description: string; features: string[] }>
}

const PLANS: PlanSeed[] = [
  {
    id: 'plan-free', key: 'free', price: 0, oldPrice: null, sortOrder: 0,
    tr: {
      ru: {
        title: 'Диагностическая консультация',
        subtitle: '15 минут · Знакомство и анализ запроса',
        description: 'Первичная онлайн-встреча для знакомства и определения направления работы',
        features: ['Определение корня проблемы', 'Рекомендации по формату работы', 'Без обязательств'],
      },
      uk: {
        title: 'Діагностична консультація',
        subtitle: '15 хвилин · Знайомство та аналіз запиту',
        description: 'Первинна онлайн-зустріч для знайомства та визначення напрямку роботи',
        features: ['Визначення кореня проблеми', 'Рекомендації щодо формату роботи', "Без зобов'язань"],
      },
    },
  },
  {
    id: 'plan-single', key: 'single', price: 50, oldPrice: null, sortOrder: 1,
    tr: {
      ru: {
        title: 'Одиночная сессия',
        subtitle: '50–60 минут · Глубокая работа',
        description: 'или 2000 грн',
        features: ['Индивидуальная сессия гипнотерапии', 'Работа с вашим запросом', 'Мягкий эриксоновский гипноз', 'Домашние практики после сессии'],
      },
      uk: {
        title: 'Одиночна сесія',
        subtitle: '50–60 хвилин · Глибока робота',
        description: 'або 2000 грн',
        features: ['Індивідуальна сесія гіпнотерапії', 'Робота з вашим запитом', "М'який еріксонівський гіпноз", 'Домашні практики після сесії'],
      },
    },
  },
  {
    id: 'plan-premium', key: 'premium', price: 210, oldPrice: 250, sortOrder: 2,
    badgeRu: 'Выбор большинства', badgeUk: 'Вибір більшості',
    tr: {
      ru: {
        title: 'Курс «Премиум»',
        subtitle: '5 сессий · Решение проблемы',
        description: 'Полноценный курс для глубинной проработки (экономия 16%)',
        features: ['5 индивидуальных сессий по 60 минут', 'Работа с причиной, а не симптомами', 'Индивидуальная программа между сессиями', 'Аудио-медитации под ваш запрос', 'Поддержка в чате между сессиями'],
      },
      uk: {
        title: 'Курс «Преміум»',
        subtitle: '5 сесій · Вирішення проблеми',
        description: 'Повноцінний курс для глибинного опрацювання (економія 16%)',
        features: ['5 індивідуальних сесій по 60 хвилин', 'Робота з причиною, а не симптомами', 'Індивідуальна програма між сесіями', 'Аудіо-медитації під ваш запит', 'Підтримка в чаті між сесіями'],
      },
    },
  },
  {
    id: 'plan-elite', key: 'elite', price: 400, oldPrice: 500, sortOrder: 3,
    tr: {
      ru: {
        title: 'Курс «Элит»',
        subtitle: '10 сессий · Полная трансформация',
        description: 'Максимальный курс для устойчивых изменений (экономия 20%)',
        features: ['10 индивидуальных сессий по 60 минут', 'Полная проработка всех блоков', 'Индивидуальные музыкальные программы', 'Глубинная регрессивная работа', 'Приоритетная запись', 'Поддержка в чате на весь период курса'],
      },
      uk: {
        title: 'Курс «Еліт»',
        subtitle: '10 сесій · Повна трансформація',
        description: 'Максимальний курс для стійких змін (економія 20%)',
        features: ['10 індивідуальних сесій по 60 хвилин', 'Повне опрацювання всіх блоків', 'Індивідуальні музичні програми', 'Глибинна регресивна робота', 'Пріоритетний запис', 'Підтримка в чаті на весь період курсу'],
      },
    },
  },
]

emit('PRAGMA foreign_keys = ON;')
emit('-- Pricing plans (UPSERT by fixed id)')
emit('INSERT INTO pricing_plans (id, key, price, old_price, currency, sort_order, status, created_at, updated_at) VALUES')
emit(
  PLANS.map((p) => {
    const old = p.oldPrice === null ? 'NULL' : String(p.oldPrice)
    return `('${p.id}','${p.key}',${p.price},${old},'USD',${p.sortOrder},'PUBLISHED','${ts()}','${ts()}')`
  }).join(',\n') + '\nON CONFLICT(id) DO UPDATE SET key=excluded.key, price=excluded.price, old_price=excluded.old_price, currency=excluded.currency, sort_order=excluded.sort_order, status=excluded.status, updated_at=excluded.updated_at;'
)

for (const p of PLANS) {
  for (const locale of ['ru', 'uk'] as const) {
    const t = p.tr[locale]
    const badge = locale === 'ru' ? p.badgeRu : p.badgeUk
    const features = JSON.stringify(t.features).replace(/'/g, "''")
    const badgeSql = badge ? `'${esc(badge)}'` : 'NULL'
    const titleSql = esc(t.title)
    const subtitleSql = esc(t.subtitle)
    const descriptionSql = esc(t.description)
    emit('INSERT INTO pricing_plan_translations (id, plan_id, locale, title, subtitle, description, badge, note, features_json) VALUES')
    emit(
      `('${p.id}-${locale}','${p.id}','${locale}','${titleSql}','${subtitleSql}','${descriptionSql}',${badgeSql},NULL,'${features}')`
    )
    emit(
      `ON CONFLICT(id) DO UPDATE SET plan_id=excluded.plan_id, locale=excluded.locale, title=excluded.title, subtitle=excluded.subtitle, description=excluded.description, badge=excluded.badge, note=excluded.note, features_json=excluded.features_json;`
    )
  }
}

const out = SQL.join('\n')
const outPath = join(process.cwd(), 'scripts', 'seed-pricing-output.sql')
writeFileSync(outPath, out, 'utf-8')
console.log('[OK] Seed SQL: ' + outPath + ' (' + out.length + ' bytes)')
console.log('Run: npx wrangler d1 execute podvarchan --file=scripts/seed-pricing-output.sql --remote')
