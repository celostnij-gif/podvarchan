--> statement-breakpoint
-- Add `scheduled_at` column to services table (nullable, for scheduled publishing)
ALTER TABLE `services` ADD COLUMN `scheduled_at` integer;
