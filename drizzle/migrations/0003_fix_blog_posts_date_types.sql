-- Migration 0003: Fix blog_posts column types
-- Remote D1 has INTEGER for date columns (published_at, scheduled_at, created_at, updated_at)
-- but the original migration (0001) defined them as TEXT.
-- Since SQLite stores TEXT values anyway, this is a type declaration fix.
--
-- Strategy: recreate blog_posts with correct column types.
-- Data values are already TEXT (ISO date strings), so no data conversion needed.

PRAGMA foreign_keys = OFF;

--> statement-breakpoint
CREATE TABLE `blog_posts_v2` (
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
INSERT INTO `blog_posts_v2` SELECT * FROM `blog_posts`;
--> statement-breakpoint
DROP TABLE `blog_posts`;
--> statement-breakpoint
ALTER TABLE `blog_posts_v2` RENAME TO `blog_posts`;

PRAGMA foreign_keys = ON;
