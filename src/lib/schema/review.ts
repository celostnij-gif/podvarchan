import { SITE } from '@/constants'

interface AggregateRatingSchemaParams {
  ratingValue?: string
  bestRating?: string
  worstRating?: string
  ratingCount?: number
  reviewCount?: number
  itemName?: string
  itemUrl?: string
}

interface ReviewItem {
  author: string
  rating: number
  date: string
  text: string
  result: string
}

/**
 * Генерирует JSON-LD объект AggregateRating + Review schema.org.
 * Используется на главной странице для отображения звёздного рейтинга в поиске Google.
 */
export function aggregateRatingSchema(
  reviews: ReviewItem[],
  params: AggregateRatingSchemaParams = {}
): Record<string, unknown> {
  const {
    // Real data only (AGENTS.md §5): average of the supplied reviews, never a hardcoded value.
    ratingValue = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : undefined,
    bestRating = '5',
    worstRating = '1',
    ratingCount = reviews.length,
    reviewCount = reviews.length,
    itemName = SITE.fullName,
    itemUrl = SITE.url,
  } = params

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE.url}#product`,
    name: itemName,
    url: itemUrl,
  }

  // No reviews → no aggregateRating (a fake rating is worse than none for E-E-A-T)
  if (ratingValue !== undefined && ratingCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue,
      bestRating,
      worstRating,
      ratingCount,
      reviewCount,
    }
  }

  schema.review = reviews.map((review) => ({
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    datePublished: review.date,
    reviewBody: review.text,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: String(review.rating),
      bestRating,
      worstRating,
    },
    itemReviewed: {
      '@type': 'Service',
      name: review.result,
    },
  }))

  return schema
}
