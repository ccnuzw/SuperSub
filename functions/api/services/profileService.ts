import { getDb, DrizzleDB } from '../utils/db';
import type { Env } from '../utils/types';
import { profiles, profile_rules, subscriptions, subscription_groups, subscription_rules, subscription_group_rules, nodes, node_groups, profile_options, profile_nodes, profile_subscriptions } from '../drizzle/schema';
import { eq, and, asc, desc, inArray, sql, count, isNull, getTableColumns } from 'drizzle-orm';
import { Logger } from '../utils/logger';
import { NodeProcessor, StrategyResult, CandidateSet } from './nodeProcessor';
export type { StrategyResult, CandidateSet };
import { ParsedNode } from '../../../src/utils/nodeParser';
import { fetchSubscriptionContent } from '../utils/network';
import { applySubscriptionRules, parseSubscriptionContent } from '../utils/subscriptionUtils';



export class ProfileService {
    private db: DrizzleDB;
    private nodeProcessor: NodeProcessor;

    constructor(env: Env) {
        this.db = getDb(env.DB);
        this.nodeProcessor = new NodeProcessor(this.db);
    }

    async getProfiles(userId: string) {
        const results = await this.db.select().from(profiles).where(eq(profiles.user_id, userId));

        return results.map(profile => {
            try {
                const content = JSON.parse(profile.content || '{}');
                return { ...profile, ...content };
            } catch (e) {
                console.error(`Failed to parse content for profile ${profile.id}:`, e);
                return profile;
            }
        });
    }

    async getProfile(id: string, userId: string) {
        const result = await this.db.select({
            profile: profiles,
            options: profile_options
        })
            .from(profiles)
            .leftJoin(profile_options, eq(profiles.id, profile_options.profile_id))
            .where(and(eq(profiles.id, id), eq(profiles.user_id, userId)))
            .limit(1)
            .then(res => res[0]);

        if (!result) return null;
        const profile = result.profile;

        try {
            // Still parse content for backward compatibility / strict fallback
            const content = JSON.parse(profile.content || '{}');

            // Fetch normalized relationships if needed (Optional: for now rely on content or options)
            // But let's attach normalized options if available
            if (result.options) {
                // We can construct the 'legacy' shape from normalized options for frontend compatibility
                const prefixSettings = {
                    enable_subscription_prefix: result.options.enable_subscription_prefix,
                    manual_node_prefix: result.options.manual_node_prefix,
                    enable_group_name_prefix: result.options.enable_group_name_prefix,
                    manual_nodes_first: result.options.manual_nodes_first,
                };
                const airportOptions = {
                    strategy: result.options.strategy,
                    polling_mode: result.options.polling_mode,
                    use_all: result.options.use_all,
                    random: result.options.random,
                    timeout: result.options.timeout,
                    polling_threshold: result.options.polling_threshold,
                    polling_interval: result.options.polling_interval
                };

                // Merge normalized data over JSON content
                return {
                    ...profile,
                    ...content,
                    node_prefix_settings: { ...content.node_prefix_settings, ...prefixSettings },
                    airport_subscription_options: { ...content.airport_subscription_options, ...airportOptions }
                };
            }

            return { ...profile, ...content };
        } catch (e) {
            console.error(`Failed to parse content for profile ${id}:`, e);
            return profile;
        }
    }

    async createProfile(userId: string, body: any) {
        const profileId = crypto.randomUUID();
        const now = new Date().toISOString();
        const name = body.name.trim();
        const alias = body.alias || null;
        const parsedContent = typeof body.content === 'string' ? JSON.parse(body.content || '{}') : (body.content || {});
        const rules = body.rules || [];

        const contentPayload = {
            subscription_ids: parsedContent.subscription_ids,
            node_ids: parsedContent.node_ids,
            node_prefix_settings: parsedContent.node_prefix_settings,
            airport_subscription_options: parsedContent.airport_subscription_options,
            subconverter_backend_id: parsedContent.subconverter_backend_id,
            subconverter_config_id: parsedContent.subconverter_config_id,
            generation_mode: parsedContent.generation_mode || 'local',
        };

        // Transaction removed due to D1 local dev "Failed query: begin" error
        // await this.db.transaction(async (tx) => {
        await this.db.insert(profiles).values({
            id: profileId,
            user_id: userId,
            name: name,
            alias: alias,
            content: JSON.stringify(contentPayload),
            created_at: now,
            updated_at: now
        });

        if (rules.length > 0) {
            const ruleValues = rules.map((rule: any, index: number) => ({
                user_id: userId,
                profile_id: profileId,
                name: rule.name.trim(),
                type: rule.type,
                value: rule.value,
                enabled: rule.enabled === 1 ? 1 : 0,
                sort_order: rule.sort_order ?? index,
                created_at: now,
                updated_at: now
            }));

            const CHUNK_SIZE = 50;
            for (let i = 0; i < ruleValues.length; i += CHUNK_SIZE) {
                await this.db.insert(profile_rules).values(ruleValues.slice(i, i + CHUNK_SIZE));
            }
        }

        // Normalization: Write Options
        const prefix = parsedContent.node_prefix_settings || {};
        const opts = parsedContent.airport_subscription_options || {};
        await this.db.insert(profile_options).values({
            profile_id: profileId,
            enable_subscription_prefix: !!prefix.enable_subscription_prefix,
            manual_node_prefix: prefix.manual_node_prefix || null,
            enable_group_name_prefix: !!prefix.enable_group_name_prefix,
            manual_nodes_first: !!prefix.manual_nodes_first,
            strategy: opts.strategy || 'all',
            polling_mode: opts.polling_mode || 'hourly',
            use_all: !!opts.use_all,
            random: !!opts.random,
            timeout: Number(opts.timeout) || 2000,
            polling_threshold: Number(opts.polling_threshold) || 3,
            polling_interval: Number(opts.polling_interval) || 3600
        });

        // Normalization: Write Nodes (批量优化)
        if (parsedContent.node_ids && parsedContent.node_ids.length > 0) {
            // Validate IDs exist (Chunked)
            const validIds: string[] = [];
            const idsToCheck = parsedContent.node_ids;
            const CHUNK_SIZE = 50;

            for (let i = 0; i < idsToCheck.length; i += CHUNK_SIZE) {
                const chunk = idsToCheck.slice(i, i + CHUNK_SIZE);
                const result = await this.db.select({ id: nodes.id })
                    .from(nodes)
                    .where(inArray(nodes.id, chunk));
                validIds.push(...result.map(n => n.id));
            }

            // 使用顺序多行INSERT (profile_nodes有2列,每语句可插入40行)
            // 注意: 不使用batch()API,因为它可能累加参数计数
            if (validIds.length > 0) {
                const MAX_ROWS_PER_STATEMENT = 40;
                const nodeValues = validIds.map(nodeId => ({ profile_id: profileId, node_id: nodeId }));

                for (let i = 0; i < nodeValues.length; i += MAX_ROWS_PER_STATEMENT) {
                    const chunk = nodeValues.slice(i, i + MAX_ROWS_PER_STATEMENT);
                    await this.db.insert(profile_nodes).values(chunk);
                }
            }
        }

        // Normalization: Write Subscriptions (批量优化)
        if (parsedContent.subscription_ids && parsedContent.subscription_ids.length > 0) {
            // Validate IDs exist (Chunked)
            const validIds: string[] = [];
            const idsToCheck = parsedContent.subscription_ids;
            const CHUNK_SIZE = 50;

            for (let i = 0; i < idsToCheck.length; i += CHUNK_SIZE) {
                const chunk = idsToCheck.slice(i, i + CHUNK_SIZE);
                const result = await this.db.select({ id: subscriptions.id })
                    .from(subscriptions)
                    .where(inArray(subscriptions.id, chunk));
                validIds.push(...result.map(s => s.id));
            }

            // 使用顺序多行INSERT (profile_subscriptions有2列,每语句可插入40行)
            if (validIds.length > 0) {
                const MAX_ROWS_PER_STATEMENT = 40;
                const subValues = validIds.map(subId => ({ profile_id: profileId, subscription_id: subId }));

                for (let i = 0; i < subValues.length; i += MAX_ROWS_PER_STATEMENT) {
                    const chunk = subValues.slice(i, i + MAX_ROWS_PER_STATEMENT);
                    await this.db.insert(profile_subscriptions).values(chunk);
                }
            }
        }
        // });

        return { id: profileId };
    }

    async updateProfile(id: string, userId: string, body: any) {
        const now = new Date().toISOString();
        const name = body.name.trim();
        const alias = body.alias || null;
        const parsedContent = typeof body.content === 'string' ? JSON.parse(body.content || '{}') : (body.content || {});

        const contentPayload = {
            subscription_ids: parsedContent.subscription_ids,
            node_ids: parsedContent.node_ids,
            node_prefix_settings: parsedContent.node_prefix_settings,
            airport_subscription_options: parsedContent.airport_subscription_options,
            subconverter_backend_id: parsedContent.subconverter_backend_id,
            subconverter_config_id: parsedContent.subconverter_config_id,
            generation_mode: parsedContent.generation_mode || 'local',
        };

        // Transaction removed due to D1 local dev "Failed query: begin" error
        // await this.db.transaction(async (tx) => {
        await this.db.update(profiles)
            .set({
                name: name,
                alias: alias,
                content: JSON.stringify(contentPayload),
                updated_at: now
            })
            .where(and(eq(profiles.id, id), eq(profiles.user_id, userId)));

        // Normalization: Update Options
        const prefix = parsedContent.node_prefix_settings || {};
        const opts = parsedContent.airport_subscription_options || {};

        await this.db.insert(profile_options).values({
            profile_id: id,
            enable_subscription_prefix: !!prefix.enable_subscription_prefix,
            manual_node_prefix: prefix.manual_node_prefix || null,
            enable_group_name_prefix: !!prefix.enable_group_name_prefix,
            manual_nodes_first: !!prefix.manual_nodes_first,
            strategy: opts.strategy || 'all',
            polling_mode: opts.polling_mode || 'hourly',
            use_all: !!opts.use_all,
            random: !!opts.random,
            timeout: Number(opts.timeout) || 2000,
            polling_threshold: Number(opts.polling_threshold) || 3,
            polling_interval: Number(opts.polling_interval) || 3600
        }).onConflictDoUpdate({
            target: profile_options.profile_id,
            set: {
                enable_subscription_prefix: !!prefix.enable_subscription_prefix,
                manual_node_prefix: prefix.manual_node_prefix || null,
                enable_group_name_prefix: !!prefix.enable_group_name_prefix,
                manual_nodes_first: !!prefix.manual_nodes_first,
                strategy: opts.strategy || 'all',
                polling_mode: opts.polling_mode || 'hourly',
                use_all: !!opts.use_all,
                random: !!opts.random,
                timeout: Number(opts.timeout) || 2000,
                polling_threshold: Number(opts.polling_threshold) || 3,
                polling_interval: Number(opts.polling_interval) || 3600
            }
        });

        // Normalization: Update Nodes
        await this.db.delete(profile_nodes).where(eq(profile_nodes.profile_id, id));
        if (parsedContent.node_ids && parsedContent.node_ids.length > 0) {
            const validIds: string[] = [];
            const idsToCheck = parsedContent.node_ids;
            const CHUNK_SIZE = 50;

            for (let i = 0; i < idsToCheck.length; i += CHUNK_SIZE) {
                const chunk = idsToCheck.slice(i, i + CHUNK_SIZE);
                const result = await this.db.select({ id: nodes.id })
                    .from(nodes)
                    .where(inArray(nodes.id, chunk));
                validIds.push(...result.map(n => n.id));
            }

            // 使用顺序多行INSERT (profile_nodes有2列,每语句可插入40行)
            if (validIds.length > 0) {
                const MAX_ROWS_PER_STATEMENT = 40;
                const nodeValues = validIds.map(nodeId => ({ profile_id: id, node_id: nodeId }));

                for (let i = 0; i < nodeValues.length; i += MAX_ROWS_PER_STATEMENT) {
                    const chunk = nodeValues.slice(i, i + MAX_ROWS_PER_STATEMENT);
                    await this.db.insert(profile_nodes).values(chunk).onConflictDoNothing();
                }
            }
        }

        // Normalization: Update Subscriptions (批量优化)
        await this.db.delete(profile_subscriptions).where(eq(profile_subscriptions.profile_id, id));
        if (parsedContent.subscription_ids && parsedContent.subscription_ids.length > 0) {
            const validIds: string[] = [];
            const idsToCheck = parsedContent.subscription_ids;
            const CHUNK_SIZE = 50;

            for (let i = 0; i < idsToCheck.length; i += CHUNK_SIZE) {
                const chunk = idsToCheck.slice(i, i + CHUNK_SIZE);
                const result = await this.db.select({ id: subscriptions.id })
                    .from(subscriptions)
                    .where(inArray(subscriptions.id, chunk));
                validIds.push(...result.map(s => s.id));
            }

            // 使用顺序多行INSERT (profile_subscriptions有2列,每语句可插入40行)
            if (validIds.length > 0) {
                const MAX_ROWS_PER_STATEMENT = 40;
                const subValues = validIds.map(subId => ({ profile_id: id, subscription_id: subId }));

                for (let i = 0; i < subValues.length; i += MAX_ROWS_PER_STATEMENT) {
                    const chunk = subValues.slice(i, i + MAX_ROWS_PER_STATEMENT);
                    await this.db.insert(profile_subscriptions).values(chunk).onConflictDoNothing();
                }
            }
        }
        // });
    }

    async deleteProfile(id: string, userId: string) {
        await this.db.delete(profiles).where(and(eq(profiles.id, id), eq(profiles.user_id, userId)));
    }

    async generateProfileNodes(profile: any, isDryRun: boolean = false, logger: Logger, executionCtx?: ExecutionContext): Promise<(ParsedNode & { id: string; raw: string; subscriptionName?: string; isManual?: boolean; group_name?: string; })[]> {
        return this.nodeProcessor.generateProfileNodes(profile, isDryRun, logger, executionCtx);
    }

    async selectSourcesByStrategy(userId: string, profile: any, isDryRun: boolean = false, logger: Logger): Promise<StrategyResult> {
        return this.nodeProcessor.selectSourcesByStrategy(userId, profile, isDryRun, logger);
    }

    async applyAllRules(userId: string, profileId: string, nodes: (ParsedNode & { id: string; raw: string; })[], logger: Logger): Promise<(ParsedNode & { id: string; raw: string; })[]> {
        return this.nodeProcessor.applyAllRules(userId, profileId, nodes, logger);
    }
}
