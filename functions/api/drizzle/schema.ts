import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    username: text('username').notNull().unique(),
    password: text('password').notNull(),
    role: text('role').notNull().default('user'),
    sub_token: text('sub_token').unique(),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
});

export const nodes = sqliteTable('nodes', {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    group_id: text('group_id').references(() => node_groups.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    link: text('link'),
    protocol: text('protocol').notNull(),
    protocol_params: text('protocol_params'),
    server: text('server'),
    port: integer('port'),
    password: text('password'),
    type: text('type'),
    params: text('params'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    sort_order: integer('sort_order'),
    status: text('status').default('pending'),
    latency: integer('latency'),
    last_checked: text('last_checked'),
    error: text('error'),
});

export const node_statuses = sqliteTable('node_statuses', {
    node_id: text('node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    latency: integer('latency'),
    checked_at: text('checked_at').notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.node_id, t.user_id] }),
}));

export const subscriptions = sqliteTable('subscriptions', {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    url: text('url').notNull(),
    type: text('type'),
    enabled: integer('enabled').default(1),
    node_count: integer('node_count').default(0),
    last_updated: text('last_updated'),
    error: text('error'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    include_keywords: text('include_keywords'),
    exclude_keywords: text('exclude_keywords'),
    expires_at: text('expires_at'), // DATETIME in SQL is typically TEXT in JS/SQLite
    subscription_info: text('subscription_info'),
    group_id: text('group_id').references(() => subscription_groups.id, { onDelete: 'set null' }),
    remaining_traffic: integer('remaining_traffic'), // BIGINT
    remaining_days: integer('remaining_days'),
});

export const subscription_groups = sqliteTable('subscription_groups', {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    sort_order: integer('sort_order').default(0),
    is_enabled: integer('is_enabled', { mode: 'boolean' }).default(true),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
}, (t) => ({
    // unique: uniqueIndex('name_user_idx').on(t.user_id, t.name) // Drizzle syntax for unique constraint slightly different or inferred
}));

export const subscription_group_rules = sqliteTable('subscription_group_rules', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    group_id: text('group_id').notNull().references(() => subscription_groups.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    value: text('value').notNull(),
    enabled: integer('enabled').notNull().default(1),
    sort_order: integer('sort_order').default(0),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const subscription_rules = sqliteTable('subscription_rules', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    subscription_id: text('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    value: text('value').notNull(),
    enabled: integer('enabled').notNull().default(1),
    sort_order: integer('sort_order').default(0),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const subconverter_assets = sqliteTable('subconverter_assets', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    url: text('url').notNull(),
    type: text('type').notNull(), // check constraint handled at app level or raw sql
    is_default: integer('is_default').default(0),
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const user_default_assets = sqliteTable('user_default_assets', {
    user_id: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    default_backend_id: integer('default_backend_id').references(() => subconverter_assets.id, { onDelete: 'set null' }),
    default_config_id: integer('default_config_id').references(() => subconverter_assets.id, { onDelete: 'set null' }),
});

export const profiles = sqliteTable('profiles', {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull().references(() => users.id),
    name: text('name').notNull(),
    alias: text('alias'),
    content: text('content'),
    generation_mode: text('generation_mode').notNull().default('local'),
    template_id: integer('template_id'),
    subconverter_backend_id: integer('subconverter_backend_id').references(() => subconverter_assets.id),
    subconverter_config_id: integer('subconverter_config_id').references(() => subconverter_assets.id),
    template_variables: text('template_variables'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
    polling_index: integer('polling_index').default(0),
    last_successful_subscription_id: text('last_successful_subscription_id'),
    last_successful_subscription_content: text('last_successful_subscription_content'),
    last_successful_subscription_updated_at: text('last_successful_subscription_updated_at'),
    group_polling_indices: text('group_polling_indices'),
});

export const profile_nodes = sqliteTable('profile_nodes', {
    profile_id: text('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    node_id: text('node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.profile_id, t.node_id] }),
}));

export const profile_subscriptions = sqliteTable('profile_subscriptions', {
    profile_id: text('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    subscription_id: text('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.profile_id, t.subscription_id] }),
}));


export const profile_rules = sqliteTable('profile_rules', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    profile_id: text('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    value: text('value').notNull(),
    enabled: integer('enabled').notNull().default(1),
    sort_order: integer('sort_order').default(0),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const settings = sqliteTable('settings', {
    key: text('key').notNull(),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    value: text('value'),
    type: text('type').notNull(),
    category: text('category').notNull(),
    description: text('description'),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.key, t.user_id] }),
}));

export const system_settings = sqliteTable('system_settings', {
    key: text('key').primaryKey(),
    value: text('value'),
});

export const ua_mappings = sqliteTable('ua_mappings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ua_keyword: text('ua_keyword').notNull().unique(),
    client_type: text('client_type').notNull(),
    is_enabled: integer('is_enabled').notNull().default(1),
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const node_groups = sqliteTable('node_groups', {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    sort_order: integer('sort_order').default(0),
    is_enabled: integer('is_enabled', { mode: 'boolean' }).default(true),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
});

export const subscription_processing_logs = sqliteTable('subscription_processing_logs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    run_id: text('run_id').notNull(),
    profile_id: text('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    step_name: text('step_name').notNull(),
    step_order: integer('step_order').notNull(),
    input_count: integer('input_count').notNull(),
    output_count: integer('output_count').notNull(),
    details: text('details'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const subscription_access_logs = sqliteTable('subscription_access_logs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    profile_id: text('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    ip_address: text('ip_address'),
    user_agent: text('user_agent'),
    country: text('country'),
    city: text('city'),
    accessed_at: text('accessed_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
