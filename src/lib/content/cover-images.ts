/**
 * Locale-aware cover image overrides for blog posts.
 *
 * D1 `blog_posts.cover_image_id` is post-level (shared between locales),
 * so both RU and UK show the same image. This map provides locale-specific
 * alternatives for posts where separate cover images exist in R2.
 */
export const COVER_IMAGE_OVERRIDES: Record<string, { ru: string; uk: string }> = {
  'chto-takoe-eriksonovskiy-gipnoz': {
    ru: '/api/media/blog/chto-takoe-eriksonovskiy-gipnoz.webp',
    uk: '/api/media/blog/chto-takoe-eriksonovskiy-gipnoz-uk.webp',
  },
  'effektivna-li-gipnoterapiya-onlajn': {
    ru: '/api/media/blog/effektivna-li-gipnoterapiya-onlajn.webp',
    uk: '/api/media/blog/effektivna-li-gipnoterapiya-onlajn-uk.webp',
  },
  'kak-ostanovit-panicheskuyu-ataku': {
    ru: '/api/media/blog/kak-ostanovit-panicheskuyu-ataku.webp',
    uk: '/api/media/blog/kak-ostanovit-panicheskuyu-ataku-uk.webp',
  },
  'kulturnyy-shok': {
    ru: '/api/media/blog/kulturnyy-shok.webp',
    uk: '/api/media/blog/kulturnyy-shok-uk.webp',
  },
  'nostalgiya-po-rodine': {
    ru: '/api/media/blog/nostalgiya-po-rodine.webp',
    uk: '/api/media/blog/nostalgiya-po-rodine-uk.webp',
  },
  'odinochestvo-v-emigracii': {
    ru: '/api/media/blog/odinochestvo-v-emigracii.webp',
    uk: '/api/media/blog/odinochestvo-v-emigracii-uk.webp',
  },
  'postoyannaya-trevoga-bez-prichiny': {
    ru: '/api/media/blog/postoyannaya-trevoga-bez-prichiny.webp',
    uk: '/api/media/blog/postoyannaya-trevoga-bez-prichiny-uk.webp',
  },
  'trevoga-posle-pereezda': {
    ru: '/api/media/blog/trevoga-posle-pereezda.webp',
    uk: '/api/media/blog/trevoga-posle-pereezda-uk.webp',
  },
}
