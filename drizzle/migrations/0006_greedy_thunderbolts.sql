CREATE TABLE `pricing_plan_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`description` text,
	`badge` text,
	`note` text,
	`features_json` text,
	FOREIGN KEY (`plan_id`) REFERENCES `pricing_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_pricing_plan_loc` ON `pricing_plan_translations` (`plan_id`,`locale`);--> statement-breakpoint
CREATE TABLE `pricing_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`price` integer NOT NULL,
	`old_price` integer,
	`currency` text DEFAULT 'USD' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'PUBLISHED' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pricing_plans_key_unique` ON `pricing_plans` (`key`);--> statement-breakpoint
ALTER TABLE `service_translations` ADD `content_html` text;--> statement-breakpoint
ALTER TABLE `testimonials` ADD `created_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `media_assets` ADD `variants_json` text;--> statement-breakpoint
ALTER TABLE `pages` DROP COLUMN `slug_pattern`;