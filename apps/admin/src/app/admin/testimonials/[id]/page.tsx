import { getDB } from '@/db'
import { testimonials, testimonialTranslations } from '@/db/schema/testimonials'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { TestimonialForm } from '../testimonial-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditTestimonialPage(props: Props) {
  const { id } = await props.params
  const db = getDB()

  const rows = await db
    .select()
    .from(testimonials)
    .leftJoin(testimonialTranslations, eq(testimonials.id, testimonialTranslations.testimonialId))
    .where(eq(testimonials.id, id))
    .all()

  if (rows.length === 0) notFound()

  const testimonial = {
    ...rows[0].testimonials,
    translations: rows.map(r => r.testimonial_translations).filter((t): t is NonNullable<typeof t> => t !== null),
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Редагувати відгук</h1>
      <TestimonialForm testimonial={testimonial} />
    </div>
  )
}
