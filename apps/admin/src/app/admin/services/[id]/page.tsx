import { getDB } from '@/db'
import { services, serviceTranslations } from '@/db/schema/services'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { ServiceForm } from '../service-form'
import type { ServiceWithTranslations } from '../types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditServicePage(props: Props) {
  const { id } = await props.params
  const db = getDB()

  const rows = await db
    .select()
    .from(services)
    .leftJoin(serviceTranslations, eq(services.id, serviceTranslations.serviceId))
    .where(eq(services.id, id))
    .all()

  if (rows.length === 0) notFound()

  const svc: ServiceWithTranslations = {
    ...rows[0].services,
    translations: rows
      .map((r) => r.service_translations)
      .filter((t): t is NonNullable<typeof t> => t !== null),
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Редагувати: {svc.slugBase}
        </h1>
        <a
          href={`/admin/seo/service/${svc.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          SEO
        </a>
      </div>
      <ServiceForm service={svc} />
    </div>
  )
}
