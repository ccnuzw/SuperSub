
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../functions/api/drizzle/schema';
import { eq } from 'drizzle-orm';

const dbPath = './.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ce2958c72097c2ac98fc7f0be8805e881569237f6d51821121a68c1c4a150f41.sqlite';
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

async function migrate() {
    console.log('Starting migration...');
    const profiles = await db.select().from(schema.profiles);
    console.log(`Found ${profiles.length} profiles.`);

    for (const profile of profiles) {
        if (!profile.content) {
            console.log(`Skipping profile ${profile.id} (no content)`);
            continue;
        }

        try {
            const content = JSON.parse(profile.content);
            console.log(`Migrating profile ${profile.name} (${profile.id})...`);

            // 1. Migrate Options
            const opts = content.airport_subscription_options || {};
            const prefix = content.node_prefix_settings || {};

            const optionsValues = {
                profile_id: profile.id,
                // Prefix settings
                enable_subscription_prefix: !!prefix.enable_subscription_prefix,
                manual_node_prefix: prefix.manual_node_prefix || '',
                enable_group_name_prefix: !!prefix.enable_group_name_prefix,
                manual_nodes_first: !!prefix.manual_nodes_first,
                // Airport Options
                strategy: opts.strategy || 'all',
                polling_mode: opts.polling_mode || 'hourly',
                use_all: !!opts.use_all,
                random: !!opts.random,
                timeout: Number(opts.timeout) || 2000,
                polling_threshold: Number(opts.polling_threshold) || 3,
                polling_interval: Number(opts.polling_interval) || 3600
            };

            await db.insert(schema.profile_options)
                .values(optionsValues)
                .onConflictDoUpdate({
                    target: schema.profile_options.profile_id,
                    set: optionsValues
                });

            // 2. Migrate Linked Nodes
            if (Array.isArray(content.node_ids) && content.node_ids.length > 0) {
                console.log(`  Linking ${content.node_ids.length} nodes...`);
                // Clear existing first to avoid dupes/stale
                await db.delete(schema.profile_nodes).where(eq(schema.profile_nodes.profile_id, profile.id));

                for (const nodeId of content.node_ids) {
                    try {
                        await db.insert(schema.profile_nodes).values({
                            profile_id: profile.id,
                            node_id: nodeId
                        }).onConflictDoNothing();
                    } catch (e) {
                        // Ignore FK errors if node doesn't exist
                    }
                }
            }

            // 3. Migrate Linked Subscriptions
            if (Array.isArray(content.subscription_ids) && content.subscription_ids.length > 0) {
                console.log(`  Linking ${content.subscription_ids.length} subscriptions...`);
                await db.delete(schema.profile_subscriptions).where(eq(schema.profile_subscriptions.profile_id, profile.id));

                for (const subId of content.subscription_ids) {
                    try {
                        await db.insert(schema.profile_subscriptions).values({
                            profile_id: profile.id,
                            subscription_id: subId
                        }).onConflictDoNothing();
                    } catch (e) {
                        // Ignore FK errors
                    }
                }
            }

        } catch (e) {
            console.error(`Failed to parse/migrate profile ${profile.id}:`, e);
        }
    }
    console.log('Migration complete.');
}

migrate();
