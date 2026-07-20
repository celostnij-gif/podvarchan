import PreviewButton from '@/components/admin/PreviewButton'
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Редагувати відгук</h1>
        <PreviewButton
          entityType="testimonial"
          slug="list"
          publicPath="/ru/"
        />
      </div>
      <TestimonialForm testimonial={testimonial} />
    </div>
  )
}
