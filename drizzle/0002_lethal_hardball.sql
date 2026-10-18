CREATE TABLE `owner_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`credential_digest` text NOT NULL,
	`expires` integer NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `owner_sessions_expiry` ON `owner_sessions` (`expires`);