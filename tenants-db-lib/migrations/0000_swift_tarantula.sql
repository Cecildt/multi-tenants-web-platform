CREATE TABLE `tenants` (
	`tenant_id` text PRIMARY KEY NOT NULL,
	`tenant_name` text NOT NULL,
	`business_name` text NOT NULL,
	`email` text NOT NULL,
	`created_timestamp` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer
);
