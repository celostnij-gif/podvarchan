CREATE TABLE `blog_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug_base` text NOT NULL,
	`service_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_categories_slug_base_unique` ON `blog_categories` (`slug_base`);--> statement-breakpoint
CREATE TABLE `blog_category_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`locale` text NOT NULL,
	`slug` text NOT NULL,
	`name` text,
	`description` text,
	`seo_meta_id` text,
	FOREIGN KEY (`category_id`) REFERENCES `blog_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_bcat_trans_cat_loc` ON `blog_category_translations` (`category_id`,`locale`);--> statement-breakpoint
CREATE TABLE `blog_post_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`locale` text NOT NULL,
	`slug` text NOT NULL,
	`title` text,
	`excerpt` text,
	`content_json` text,
	`content_html` text,
	`table_of_contents_json` text,
	`faq_json` text,
	`seo_meta_id` text,
	FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_bpost_trans_post_loc` ON `blog_post_translations` (`post_id`,`locale`);--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text,
	`author_id` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`cover_image_id` text,
	`reading_minutes` integer,
	`published_at` text,
	`scheduled_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `blog_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `faq_item_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`faq_item_id` text NOT NULL,
	`locale` text NOT NULL,
	`question` text,
	`answer` text,
	FOREIGN KEY (`faq_item_id`) REFERENCES `faq_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_faq_trans_item_loc` ON `faq_item_translations` (`faq_item_id`,`locale`);--> statement-breakpoint
CREATE TABLE `faq_items` (
	`id` text PRIMARY KEY NOT NULL,
	`group` text DEFAULT 'GENERAL' NOT NULL,
	`service_id` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `service_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`locale` text NOT NULL,
	`slug` text NOT NULL,
	`title` text,
	`short_title` text,
	`description` text,
	`hero_title` text,
	`hero_subtitle` text,
	`symptoms_json` text,
	`process_json` text,
	`benefits_json` text,
	`faq_json` text,
	`cta_text` text,
	`seo_meta_id` text,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_serv_trans_svc_loc` ON `service_translations` (`service_id`,`locale`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`slug_base` text NOT NULL,
	`icon` text,
	`category` text,
	`priority` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `services_slug_base_unique` ON `services` (`slug_base`);--> statement-breakpoint
CREATE TABLE `page_section_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`section_id` text NOT NULL,
	`locale` text NOT NULL,
	`content_json` text,
	FOREIGN KEY (`section_id`) REFERENCES `page_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_psect_trans_sec_loc` ON `page_section_translations` (`section_id`,`locale`);--> statement-breakpoint
CREATE TABLE `page_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`page_id` text NOT NULL,
	`key` text NOT NULL,
	`type` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`settings_json` text,
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `page_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`page_id` text NOT NULL,
	`locale` text NOT NULL,
	`slug` text NOT NULL,
	`title` text,
	`excerpt` text,
	`content_json` text,
	`seo_meta_id` text,
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_page_trans_page_loc` ON `page_translations` (`page_id`,`locale`);--> statement-breakpoint
CREATE TABLE `pages` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`slug_pattern` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `testimonial_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`testimonial_id` text NOT NULL,
	`locale` text NOT NULL,
	`problem` text,
	`result` text,
	`text` text,
	FOREIGN KEY (`testimonial_id`) REFERENCES `testimonials`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_testim_trans_tid_loc` ON `testimonial_translations` (`testimonial_id`,`locale`);--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`client_name` text,
	`client_age` integer,
	`avatar_initials` text,
	`rating` integer,
	`source` text,
	`consent_confirmed` integer DEFAULT false NOT NULL,
	`published_at` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`phone` text,
	`message` text,
	`source_page` text,
	`locale` text,
	`status` text DEFAULT 'NEW' NOT NULL,
	`internal_note` text,
	`ip_hash` text,
	`user_agent` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lead_events` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`user_id` text,
	`type` text,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `contact_leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`file_name` text,
	`original_name` text,
	`mime_type` text,
	`size` integer,
	`width` integer,
	`height` integer,
	`storage_key` text,
	`public_url` text,
	`alt_ru` text,
	`alt_uk` text,
	`title_ru` text,
	`title_uk` text,
	`caption_ru` text,
	`caption_uk` text,
	`uploaded_by_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`label` text,
	`value` text,
	`url` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `navigation_items` (
	`id` text PRIMARY KEY NOT NULL,
	`location` text NOT NULL,
	`parent_id` text,
	`href` text,
	`label_ru` text,
	`label_uk` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `redirect_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`from_path` text NOT NULL,
	`to_path` text NOT NULL,
	`status_code` integer DEFAULT 301 NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`hit_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text,
	`updated_by_id` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `content_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`locale` text,
	`data_json` text,
	`created_by_id` text,
	`created_at` text NOT NULL,
	`label` text
);
--> statement-breakpoint
CREATE TABLE `seo_meta` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`locale` text,
	`title` text,
	`description` text,
	`keywords` text,
	`canonical_path` text,
	`og_title` text,
	`og_description` text,
	`og_image_id` text,
	`robots_index` integer DEFAULT true,
	`robots_follow` integer DEFAULT true,
	`schema_type` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_seo_entity` ON `seo_meta` (`entity_type`,`entity_id`,`locale`);