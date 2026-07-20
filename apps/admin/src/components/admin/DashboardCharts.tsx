'use client'

import { useEffect, useState } from 'react'

interface ContentStat {
  label: string
  total: number
  published: number
  color: string
  href?: string
}

export function DashboardCharts({ stats }: { stats: ContentStat[] }) {
  const publishedTotal = stats.reduce((a, s) => a + s.published, 0)
  const draftTotal = stats.reduce((a, s) => a + (s.total - s.published), 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Donut: published vs draft */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-4">Публікації</h3>
        <DonutChart
          segments={[
            { label: 'Опубліковано', value: publishedTotal, color: '#d97706' },
            { label: 'Чернетки', value: draftTotal, color: '#52525b' },
          ]}
        />
      </div>

      {/* Per-type progress bars */}
      <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-4">Статус контенту</h3>
        <div className="space-y-3">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">{s.label}</span>
                <span className="text-zinc-300">
                  <span className="text-amber-500 font-medium">{s.published}</span>
                  <span className="text-zinc-600">/{s.total}</span>
                </span>
              </div>
              <ProgressBar value={s.published} max={s.total} color={s.color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DonutChart({ segments, size = 130, strokeWidth = 22 }:
  { segments: { label: string; value: number; color: string }[]; size?: number; strokeWidth?: number }
) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 150); return () => clearTimeout(t) }, [])

  const total = Math.max(segments.reduce((a, b) => a + b.value, 0), 1)
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2

  let offset = 0
  const arcs = segments.map((seg) => {
    const pct = seg.value / total
    const len = pct * circ
    const dash = animated ? `${len} ${circ - len}` : `0 ${circ}`
    const off = animated ? -offset : 0
    const el = { ...seg, dash, dashOffset: off, len }
    offset += len
    return el
  })

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="flex-shrink-0" viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(39 39 42)" strokeWidth={strokeWidth} />
          {arcs.map((a) => (
            <circle key={a.label} cx={cx} cy={cy} r={r} fill="none" stroke={a.color}
              strokeWidth={strokeWidth} strokeDasharray={a.dash} strokeDashoffset={a.dashOffset}
              strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          ))}
        </g>
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          className="fill-zinc-200 text-xl font-bold" fontSize={Math.round(size * 0.16)}>
          {total}
        </text>
      </svg>
      <div className="space-y-1.5">
        {segments.filter(s => s.value > 0).map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-zinc-400">{s.label}</span>
            <span className="text-zinc-200 font-medium">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(max > 0 ? (value / max) * 100 : 0), 200); return () => clearTimeout(t) }, [value, max])

  return (
    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${w}%`, backgroundColor: color }} />
    </div>
  )
}
