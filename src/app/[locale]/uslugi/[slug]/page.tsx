import {
  ServiceDetailPage,
  generateServiceDetailMetadata,
  generateServiceStaticParams,
} from '@/lib/pages/service-detail'

// Next statically analyzes `revalidate` — must be a literal, not an imported const
export const revalidate = 604800

export { generateServiceStaticParams as generateStaticParams }

type PageProps = { params: Promise<{ slug: string; locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  return generateServiceDetailMetadata({ params, catalog: 'uslugi' })
}

export default function Page({ params }: PageProps) {
  return <ServiceDetailPage params={params} catalog="uslugi" />
}
