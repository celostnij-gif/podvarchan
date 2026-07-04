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
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Редагувати: {svc.slugBase}
      </h1>
      <ServiceForm service={svc} />
    </div>
  )
}
