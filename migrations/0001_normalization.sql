CREATE TABLE `profile_nodes` (
	`profile_id` text NOT NULL,
	`node_id` text NOT NULL,
	PRIMARY KEY(`profile_id`, `node_id`),
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`node_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `profile_options` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`enable_subscription_prefix` integer DEFAULT false,
	`manual_node_prefix` text,
	`enable_group_name_prefix` integer DEFAULT false,
	`manual_nodes_first` integer DEFAULT false,
	`strategy` text DEFAULT 'all',
	`polling_mode` text DEFAULT 'hourly',
	`use_all` integer DEFAULT false,
	`random` integer DEFAULT false,
	`timeout` integer DEFAULT 2000,
	`polling_threshold` integer DEFAULT 3,
	`polling_interval` integer DEFAULT 3600,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `profile_subscriptions` (
	`profile_id` text NOT NULL,
	`subscription_id` text NOT NULL,
	PRIMARY KEY(`profile_id`, `subscription_id`),
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE cascade
);

ALTER TABLE `nodes` DROP COLUMN `params`;
