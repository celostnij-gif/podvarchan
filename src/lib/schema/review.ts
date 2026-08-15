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
    ratingValue = '5.0',
    bestRating = '5',
    worstRating = '1',
    ratingCount = reviews.length,
    reviewCount = reviews.length,
    itemName = SITE.fullName,
    itemUrl = SITE.url,
  } = params

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE.url}#product`,
    name: itemName,
    url: itemUrl,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue,
      bestRating,
      worstRating,
      ratingCount,
      reviewCount,
    },
    review: reviews.map((review) => ({
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
    })),
  }
}
