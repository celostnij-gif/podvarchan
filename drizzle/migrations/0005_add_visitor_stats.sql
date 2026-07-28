CREATE TABLE IF NOT EXISTS `visitor_stats` (
  `key` text PRIMARY KEY NOT NULL,
  `count` integer NOT NULL DEFAULT 0
);
