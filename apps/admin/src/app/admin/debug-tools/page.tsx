import { getDB } from '@/db'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default async function DebugPage() {
  const results: { label: string; ok: boolean; error?: string }[] = []
  const { env } = getCloudflareContext()

  // Test 1: D1 binding availability
  try {
    const ok = typeof env.DB !== 'undefined'
    results.push({ label: 'D1 binding (env.DB) exists', ok, error: ok ? undefined : 'env.DB is undefined' })
  } catch (e) {
    results.push({ label: 'D1 binding (env.DB) exists', ok: false, error: String(e) })
  }

  // Test 2: Basic D1 query
  try {
    const stmt = env.DB.prepare('SELECT 1 as test')
    const r = await stmt.run()
    results.push({ label: 'D1 basic query (env.DB.prepare().run())', ok: true })
  } catch (e) {
    results.push({ label: 'D1 basic query', ok: false, error: String(e) })
  }

  // Test 3: FAQ query (known working)
  try {
    const stmt = env.DB.prepare('SELECT COUNT(*) as count FROM faq_items')
    const r = await stmt.run()
    results.push({ label: 'FAQ table query (SELECT COUNT FROM faq_items)', ok: true })
  } catch (e) {
    results.push({ label: 'FAQ table query', ok: false, error: String(e) })
  }

  // Test 4: Blog posts query (known failing)
  try {
    const stmt = env.DB.prepare('SELECT COUNT(*) as count FROM blog_posts')
    const r = await stmt.run()
    results.push({ label: 'Blog posts table query (SELECT COUNT FROM blog_posts)', ok: true })
  } catch (e) {
    results.push({ label: 'Blog posts table query', ok: false, error: String(e) })
  }

  // Test 5: Services query
  try {
    const stmt = env.DB.prepare('SELECT COUNT(*) as count FROM services')
    const r = await stmt.run()
    results.push({ label: 'Services table query', ok: true })
  } catch (e) {
    results.push({ label: 'Services table query', ok: false, error: String(e) })
  }

  // Test 6: Pages query
  try {
    const stmt = env.DB.prepare('SELECT COUNT(*) as count FROM pages')
    const r = await stmt.run()
    results.push({ label: 'Pages table query', ok: true })
  } catch (e) {
    results.push({ label: 'Pages table query', ok: false, error: String(e) })
  }

  // Test 7: Leads query
  try {
    const stmt = env.DB.prepare('SELECT COUNT(*) as count FROM contact_leads')
    const r = await stmt.run()
    results.push({ label: 'Leads table query', ok: true })
  } catch (e) {
    results.push({ label: 'Leads table query', ok: false, error: String(e) })
  }

  // Test 8: Drizzle getDB()
  try {
    const db = getDB()
    results.push({ label: 'Drizzle getDB() works', ok: true })
  } catch (e) {
    results.push({ label: 'Drizzle getDB() works', ok: false, error: String(e) })
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Debug Page</h1>
      <table className="min-w-full border-collapse border border-zinc-700">
        <thead>
          <tr className="bg-zinc-800">
            <th className="border border-zinc-700 px-4 py-2 text-left text-sm font-medium">Test</th>
            <th className="border border-zinc-700 px-4 py-2 text-left text-sm font-medium">Status</th>
            <th className="border border-zinc-700 px-4 py-2 text-left text-sm font-medium">Error</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-zinc-900/50' : 'bg-zinc-900/20'}>
              <td className="border border-zinc-700 px-4 py-2 text-sm">{r.label}</td>
              <td className="border border-zinc-700 px-4 py-2 text-sm">
                <span className={r.ok ? 'text-green-400' : 'text-red-400'}>
                  {r.ok ? '✅ OK' : '❌ FAIL'}
                </span>
              </td>
              <td className="border border-zinc-700 px-4 py-2 text-sm font-mono text-red-400 max-w-xl break-all">
                {r.error || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
