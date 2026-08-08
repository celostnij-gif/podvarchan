import {
  SERVICE_DETAIL_REVALIDATE,
  ServiceDetailPage,
  generateServiceDetailMetadata,
  generateServiceStaticParams,
} from '@/lib/pages/service-detail'

export const revalidate = SERVICE_DETAIL_REVALIDATE

export { generateServiceStaticParams as generateStaticParams }

type PageProps = { params: Promise<{ slug: string; locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  return generateServiceDetailMetadata({ params, catalog: 'poslugy' })
}

export default function Page({ params }: PageProps) {
  return <ServiceDetailPage params={params} catalog="poslugy" />
}
