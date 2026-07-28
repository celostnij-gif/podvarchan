import { NextResponse } from 'next/server'
import { getDB } from '@/db'
import { visitorStats } from '@/db/schema/visitor-stats'
import { inArray, sql } from 'drizzle-orm'

/** GET — read counters without incrementing */
export async function GET() {
  try {
    const db = getDB()
    const dayKey = new Date().toISOString().slice(0, 10)
    const keys = ['total', dayKey] as const

    const rows = await db
      .select({ key: visitorStats.key, count: visitorStats.count })
      .from(visitorStats)
      .where(inArray(visitorStats.key, [...keys]))

    const map = Object.fromEntries(rows.map((r) => [r.key, r.count]))
    return NextResponse.json({ today: map[dayKey] ?? 0, total: map['total'] ?? 0 })
  } catch {
    return NextResponse.json({ today: 0, total: 0 })
  }
}

/** POST — increment counters and return new values */
export async function POST() {
  try {
    const db = getDB()
    const dayKey = new Date().toISOString().slice(0, 10)

    // Upsert total
    await db
      .insert(visitorStats)
      .values({ key: 'total', count: 1 })
      .onConflictDoUpdate({
        target: visitorStats.key,
        set: { count: sql`${visitorStats.count} + 1` },
      })

    // Upsert today
    await db
      .insert(visitorStats)
      .values({ key: dayKey, count: 1 })
      .onConflictDoUpdate({
        target: visitorStats.key,
        set: { count: sql`${visitorStats.count} + 1` },
      })

    // Read back
    const keys = ['total', dayKey] as const
    const rows = await db
      .select({ key: visitorStats.key, count: visitorStats.count })
      .from(visitorStats)
      .where(inArray(visitorStats.key, [...keys]))

    const map = Object.fromEntries(rows.map((r) => [r.key, r.count]))
    return NextResponse.json({ today: map[dayKey] ?? 0, total: map['total'] ?? 0 })
  } catch {
    return NextResponse.json({ today: 0, total: 0 })
  }
}
