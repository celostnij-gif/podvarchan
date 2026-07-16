import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(),
  fileName: text('file_name'),
  originalName: text('original_name'),
  mimeType: text('mime_type'),
  size: integer('size'),
  width: integer('width'),
  height: integer('height'),
  storageKey: text('storage_key'),
  publicUrl: text('public_url'),
  altRu: text('alt_ru'),
  altUk: text('alt_uk'),
  titleRu: text('title_ru'),
  titleUk: text('title_uk'),
  captionRu: text('caption_ru'),
  captionUk: text('caption_uk'),
  variantsJson: text('variants_json'),
  uploadedById: text('uploaded_by_id'),
  createdAt: text('created_at').notNull(),
})
