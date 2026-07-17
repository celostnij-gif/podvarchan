-- Migration 0004: Fix INTEGER→TEXT column types for remaining tables
-- Changes date columns from INTEGER to TEXT to match Drizzle schema
-- Strategy: recreate each table with TEXT for date columns, preserve all data

PRAGMA foreign_keys = OFF;

--> statement-breakpoint
CREATE TABLE `pages_v2` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `pages_v2` SELECT * FROM `pages`;
--> statement-breakpoint
DROP TABLE `pages`;
--> statement-breakpoint
ALTER TABLE `pages_v2` RENAME TO `pages`;

--> statement-breakpoint
CREATE TABLE `testimonials_v2` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`client_name` text NOT NULL,
	`client_age` integer,
	`avatar_initials` text,
	`rating` integer,
	`source` text,
	`consent_confirmed` integer DEFAULT false NOT NULL,
	`published_at` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `testimonials_v2` SELECT * FROM `testimonials`;
--> statement-breakpoint
DROP TABLE `testimonials`;
--> statement-breakpoint
ALTER TABLE `testimonials_v2` RENAME TO `testimonials`;

--> statement-breakpoint
CREATE TABLE `services_v2` (
	`id` text PRIMARY KEY NOT NULL,
	`slug_base` text NOT NULL,
	`icon` text,
	`category` text,
	`priority` integer DEFAULT 3 NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`scheduled_at` text
);
--> statement-breakpoint
INSERT INTO `services_v2` SELECT * FROM `services`;
--> statement-breakpoint
DROP TABLE `services`;
--> statement-breakpoint
ALTER TABLE `services_v2` RENAME TO `services`;

--> statement-breakpoint
CREATE TABLE `seo_meta_v2` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`locale` text NOT NULL,
	`title` text,
	`description` text,
	`keywords` text,
	`canonical_path` text,
	`og_title` text,
	`og_description` text,
	`og_image_id` text,
	`robots_index` integer DEFAULT true NOT NULL,
	`robots_follow` integer DEFAULT true NOT NULL,
	`schema_type` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `seo_meta_v2` SELECT * FROM `seo_meta`;
--> statement-breakpoint
DROP TABLE `seo_meta`;
--> statement-breakpoint
ALTER TABLE `seo_meta_v2` RENAME TO `seo_meta`;

--> statement-breakpoint
CREATE TABLE `media_assets_v2` (
	`id` text PRIMARY KEY NOT NULL,
	`file_name` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`width` integer,
	`height` integer,
	`storage_key` text NOT NULL,
	`public_url` text NOT NULL,
	`alt_ru` text,
	`alt_uk` text,
	`title_ru` text,
	`title_uk` text,
	`caption_ru` text,
	`caption_uk` text,
	`uploaded_by_id` text,
	`created_at` text NOT NULL,
	`variants_json` text
);
--> statement-breakpoint
INSERT INTO `media_assets_v2` SELECT * FROM `media_assets`;
--> statement-breakpoint
DROP TABLE `media_assets`;
--> statement-breakpoint
ALTER TABLE `media_assets_v2` RENAME TO `media_assets`;

--> statement-breakpoint
CREATE TABLE `redirect_rules_v2` (
	`id` text PRIMARY KEY NOT NULL,
	`from_path` text NOT NULL,
	`to_path` text NOT NULL,
	`status_code` integer DEFAULT 301 NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`hit_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `redirect_rules_v2` SELECT * FROM `redirect_rules`;
--> statement-breakpoint
DROP TABLE `redirect_rules`;
--> statement-breakpoint
ALTER TABLE `redirect_rules_v2` RENAME TO `redirect_rules`;

-- Restore indexes that were lost during table recreation
CREATE UNIQUE INDEX IF NOT EXISTS `services_slug_base_unique` ON `services` (`slug_base`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_seo_entity` ON `seo_meta` (`entity_type`,`entity_id`,`locale`);

PRAGMA foreign_keys = ON;
