import type { Metadata } from 'next'
import type { ComponentType } from 'react'
import Link from 'next/link'
import { getDashboardData } from '@/lib/admin/dashboard'
import { StatusBadge } from '@/components/admin'
import {
  Layers,
  FileText,
  MessageSquare,
  HelpCircle,
  Image,
  Users,
  ArrowLeftRight,
  History,
  AlertTriangle,
  ArrowRight,
  Clock,
  Mail,
  Phone,
  ExternalLink,
  Megaphone,
  Layout,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Дашборд',
}

/* ═══════════════════════════════════════
   Stat Card
   ═══════════════════════════════════════ */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  color = 'zinc',
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number | string
  sub?: string
  href?: string
  color?: 'zinc' | 'gold' | 'green' | 'amber' | 'blue' | 'red'
}) {
  const colorMap: Record<string, string> = {
    zinc: 'bg-zinc-900/50 border-zinc-800/50 text-zinc-400',
    gold: 'bg-gold/5 border-gold/10 text-gold',
    green: 'bg-green-900/20 border-green-800/20 text-green-400',
    amber: 'bg-amber-900/20 border-amber-800/20 text-amber-400',
    blue: 'bg-blue-900/20 border-blue-800/20 text-blue-400',
    red: 'bg-red-900/20 border-red-800/20 text-red-400',
  }

  return (
    <div className={`relative group rounded-xl border p-5 ${colorMap[color]} transition-all duration-300 hover:border-opacity-60`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-black/30 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight text-zinc-100">{value}</p>
      <p className="text-sm text-zinc-500 mt-0.5">{label}</p>
      {sub && (
        <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>
      )}
      {href && (
        <Link
          href={href}
          className="absolute inset-0 rounded-xl"
          aria-label={`Перейти к ${label}`}
        >
          <span className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ArrowRight className="w-4 h-4 text-zinc-500" />
          </span>
        </Link>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   Section Header
   ═══════════════════════════════════════ */

function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-zinc-900/70 border border-zinc-800/50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-zinc-400" />
        </div>
        <h2 className="text-base font-semibold text-zinc-200">{title}</h2>
      </div>
      {action && (
        <Link
          href={action.href}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-gold transition-colors duration-200"
        >
          {action.label}
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   Status map for leads
   ═══════════════════════════════════════ */

const LEAD_STATUS_MAP: Record<string, { label: string; variant: 'published' | 'draft' | 'review' | 'active' | 'spam' | 'inactive' | 'scheduled' | 'archived' | 'hidden' }> = {
  NEW:        { label: 'Новая',       variant: 'review' },
  IN_PROGRESS: { label: 'В работе',   variant: 'active' },
  CONTACTED:  { label: 'Связались',   variant: 'published' },
  BOOKED:     { label: 'Записан',     variant: 'scheduled' },
  CLOSED:     { label: 'Закрыта',     variant: 'archived' },
  SPAM:       { label: 'Спам',        variant: 'spam' },
}

/* ═══════════════════════════════════════
   Page
   ═══════════════════════════════════════ */

export default async function DashboardPage() {
  const data = await getDashboardData()
  const { stats } = data

  const totalDrafts = stats.services.draft + stats.blog.draft + stats.pages.draft
  const totalSeoIssues = data.seoIssues.length

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Дашборд</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {data.lastUpdated.toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <StatCard
          icon={Layers}
          label="Услуги"
          value={stats.services.total}
          sub={`${stats.services.published} опубликовано, ${stats.services.draft} черновиков`}
          href="/admin/services"
          color="gold"
        />
        <StatCard
          icon={FileText}
          label="Статьи"
          value={stats.blog.total}
          sub={`${stats.blog.published} опубликовано, ${stats.blog.draft} черновиков`}
          href="/admin/blog"
          color="blue"
        />
        <StatCard
          icon={MessageSquare}
          label="Заявки"
          value={stats.leads.total}
          sub={`${stats.leads.new} новых, ${stats.leads.inProgress} в работе`}
          href="/admin/leads"
          color="green"
        />
        <StatCard
          icon={Megaphone}
          label="Отзывы"
          value={stats.testimonials.total}
          sub={`${stats.testimonials.published} опубликовано`}
          href="/admin/testimonials"
          color="amber"
        />
        <StatCard
          icon={HelpCircle}
          label="FAQ"
          value={stats.faq.total}
          sub={`${stats.faq.published} опубликовано`}
          href="/admin/faq"
          color="zinc"
        />
        <StatCard
          icon={Layout}
          label="Страницы"
          value={stats.pages.total}
          sub={`${stats.pages.draft} черновиков`}
          href="/admin/pages"
          color="zinc"
        />
        <StatCard
          icon={Image}
          label="Медиа"
          value={stats.media.total}
          href="/admin/media"
          color="zinc"
        />
        <StatCard
          icon={Users}
          label="Пользователи"
          value={stats.users.total}
          sub={`${stats.users.active} активных`}
          href="/admin/users"
          color="zinc"
        />
        <StatCard
          icon={ArrowLeftRight}
          label="Редиректы"
          value={stats.redirects.total}
          href="/admin/redirects"
          color="zinc"
        />
        <StatCard
          icon={History}
          label="Ревізії"
          value={stats.revisions.total}
          href="/admin/audit"
          color="zinc"
        />
      </div>

      {/* ── Low-level alerts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/admin/blog"
          className={`flex items-center gap-3 rounded-xl border p-4 transition-all duration-200 ${
            totalDrafts > 0
              ? 'bg-amber-900/10 border-amber-800/20 hover:bg-amber-900/20'
              : 'bg-zinc-900/30 border-zinc-800/30 hover:bg-zinc-900/50'
          }`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            totalDrafts > 0 ? 'bg-amber-900/30 text-amber-400' : 'bg-zinc-800/50 text-zinc-500'
          }`}>
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200">{totalDrafts} черновиков</p>
            <p className="text-xs text-zinc-500 mt-0.5">Требуют публикации</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />
        </Link>

        <Link
          href="/admin/leads"
          className={`flex items-center gap-3 rounded-xl border p-4 transition-all duration-200 ${
            stats.leads.new > 0
              ? 'bg-green-900/10 border-green-800/20 hover:bg-green-900/20'
              : 'bg-zinc-900/30 border-zinc-800/30 hover:bg-zinc-900/50'
          }`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            stats.leads.new > 0 ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800/50 text-zinc-500'
          }`}>
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200">{stats.leads.new} новых заявок</p>
            <p className="text-xs text-zinc-500 mt-0.5">Ожидают обработки</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />
        </Link>

        <Link
          href="/admin/seo"
          className={`flex items-center gap-3 rounded-xl border p-4 transition-all duration-200 ${
            totalSeoIssues > 0
              ? 'bg-red-900/10 border-red-800/20 hover:bg-red-900/20'
              : 'bg-zinc-900/30 border-zinc-800/30 hover:bg-zinc-900/50'
          }`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            totalSeoIssues > 0 ? 'bg-red-900/30 text-red-400' : 'bg-zinc-800/50 text-zinc-500'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200">{totalSeoIssues} SEO-проблем</p>
            <p className="text-xs text-zinc-500 mt-0.5">Отсутствуют meta-description</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />
        </Link>
      </div>

      {/* ── Recent Leads ── */}
      <section>
        <SectionHeader icon={MessageSquare} title="Последние заявки" action={{ label: 'Все заявки', href: '/admin/leads' }} />
        {data.recentLeads.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-zinc-800/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Имя</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">Контакт</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">Источник</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Статус</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden lg:table-cell">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {data.recentLeads.map((lead) => {
                  const statusCfg = LEAD_STATUS_MAP[lead.status] ?? { label: lead.status, variant: 'draft' as const }
                  return (
                    <tr key={lead.id} className="hover:bg-zinc-900/30 transition-colors duration-150">
                      <td className="px-4 py-3">
                        <Link href={`/admin/leads/${lead.id}`} className="text-zinc-200 hover:text-gold transition-colors duration-200 font-medium">
                          {lead.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-zinc-600" aria-hidden="true" />
                            {lead.email}
                          </span>
                          {lead.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-zinc-600" aria-hidden="true" />
                              {lead.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">
                        {lead.sourcePage ? (
                          <span className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {lead.sourcePage}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={statusCfg.variant} label={statusCfg.label} />
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs text-right hidden lg:table-cell">
                        <span className="flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          {lead.createdAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-8 text-center">
            <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">
              {data.dbAvailable ? 'Нет заявок' : 'База данных недоступна. Подключите D1 для просмотра статистики.'}
            </p>
          </div>
        )}
      </section>

      {/* ── Drafts + SEO Issues ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drafts */}
        <section>
          <SectionHeader icon={FileText} title="Черновики" action={data.drafts.length > 0 ? { label: 'Все черновики', href: '/admin/blog' } : undefined} />
          {data.drafts.length > 0 ? (
            <div className="space-y-1.5">
              {data.drafts.slice(0, 6).map((draft) => (
                <Link
                  key={`${draft.type}-${draft.id}`}
                  href={draft.editUrl}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900/40 transition-colors duration-200 group"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    draft.type === 'blog' ? 'bg-blue-400' :
                    draft.type === 'service' ? 'bg-amber-400' :
                    'bg-zinc-400'
                  }`} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors truncate">
                      {draft.type === 'blog' ? 'Статья' : draft.type === 'service' ? 'Услуга' : 'Страница'}
                    </p>
                    <p className="text-xs text-zinc-600">
                      ID: {draft.id.slice(0, 8)}…
                      {draft.createdAt && ` • ${draft.createdAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>
                  <StatusBadge status="draft" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-8 text-center">
              <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">Нет черновиков</p>
            </div>
          )}
        </section>

        {/* SEO Issues */}
        <section>
          <SectionHeader icon={AlertTriangle} title="SEO-проблемы" action={data.seoIssues.length > 0 ? { label: 'Все проблемы', href: '/admin/seo' } : undefined} />
          {data.seoIssues.length > 0 ? (
            <div className="space-y-1.5">
              {data.seoIssues.slice(0, 6).map((issue) => (
                <Link
                  key={`${issue.type}-${issue.id}`}
                  href={issue.editUrl}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900/40 transition-colors duration-200 group"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400/70 shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors truncate">
                      {issue.title ?? `${issue.type}: ${issue.id.slice(0, 8)}…`}
                    </p>
                    <p className="text-xs text-red-400/60">{issue.issue}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">
                {data.dbAvailable ? 'SEO-проблем не найдено' : 'База данных недоступна'}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ── DB connection indicator ── */}
      {!data.dbAvailable && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-900/10 border border-amber-800/20 text-sm text-amber-400/80">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>База данных D1 не подключена. Статистика отображается в режиме заглушки. Запустите проект через <code className="text-amber-300 bg-amber-900/20 px-1.5 py-0.5 rounded text-xs">wrangler</code> для реальных данных.</span>
        </div>
      )}
    </div>
  )
}
