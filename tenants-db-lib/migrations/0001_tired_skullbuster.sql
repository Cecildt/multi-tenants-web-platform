ALTER TABLE `tenants` ADD `updated_timestamp` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` DROP COLUMN `updated_at`;