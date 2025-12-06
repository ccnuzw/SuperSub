import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';
import { parseNodeLinks, ParsedNode } from '../../../src/utils/nodeParser';
import { applySubscriptionRules, parseSubscriptionContent } from './subscriptions';
import { fetchSubscriptionContent } from '../utils/network';
import { generateSubscription } from '../utils/profileGenerator';
import { Logger } from '../utils/logger';

const profiles = new Hono<{ Bindings: Env }>();

// --- START OF REFACTORED LOGIC ---

interface SelectedSource {
  type: 'subscription';
  sub: { id: string; name: string; url: string; group_id: string | null; };
}

// Represents a set of candidate subscriptions for a single group in group_polling mode
export interface CandidateSet {
  candidates: any[];
  totalInGroup: number;
  startIndex: number;
}

// The result of the strategy selection
export type StrategyResult = {
  strategy: string;
} & ({
  // For group_request, we return a map of candidate sets
  type: 'candidates';
  candidateSets: [string, CandidateSet][]; // Use an array to preserve order
} | {
  // For all other strategies, we return the final selected sources
  type: 'selection';
  selectedSources: SelectedSource[];
  updatedPollingState?: { polling_index?: number };
});


export const selectSourcesByStrategy = async (c: any, profile: any, isDryRun: boolean = false, logger: Logger): Promise<StrategyResult> => {
    const db = c.env.DB;
    const userId = profile.user_id;
    const content = JSON.parse(profile.content || '{}');
    const airportOptions = content.airport_subscription_options || {};
    const subIds = content.subscription_ids || [];
    
    let strategy = airportOptions.strategy;
    if (!strategy) {
        if (airportOptions.use_all) strategy = 'all';
        else if (airportOptions.polling) strategy = 'polling';
        else if (airportOptions.random) strategy = 'random';
        else strategy = 'all'; // Default fallback
    }
    logger.info(`使用的订阅选择策略: ${strategy}`, { airportOptions });

    if (subIds.length === 0) {
        logger.warn('此配置文件不包含任何订阅。');
        return { type: 'selection', selectedSources: [], strategy: 'none' };
    }

    // --- Group Polling Strategy (Optimized for large scale) ---
    if (strategy === 'polling' && airportOptions.polling_mode === 'group_request') {
        const CHUNK_SIZE = 50; // Safe chunk size for IN clause
        const pollingThreshold = airportOptions.polling_threshold || 5;
        const groupPollingState = JSON.parse(profile.group_polling_indices || '{}');
        logger.info(`执行 "分组轮询" 策略，每组探测 ${pollingThreshold} 个候选。`);

        // 1. Get all subscription groups in their specified order
        const { results: sortedGroups } = await db.prepare(
            'SELECT id FROM subscription_groups WHERE user_id = ? ORDER BY sort_order ASC'
        ).bind(userId).all();

        const orderedGroupIds = sortedGroups ? (sortedGroups as { id: string }[]).map(g => g.id) : [];
        logger.info('已获取有序的分组列表。', { orderedGroupIds });

        // 2. Get group counts for all *selected* subscriptions
        const groupCountsMap = new Map<string, number>();
        for (let i = 0; i < subIds.length; i += CHUNK_SIZE) {
            const chunk = subIds.slice(i, i + CHUNK_SIZE);
            const groupCountsQuery = `
                SELECT group_id, COUNT(*) as total
                FROM subscriptions
                WHERE id IN (${chunk.map(() => '?').join(',')}) AND user_id = ?
                GROUP BY group_id
            `;
            const { results: chunkGroupCounts } = await db.prepare(groupCountsQuery).bind(...chunk, userId).all();
            if (chunkGroupCounts) {
                for (const row of chunkGroupCounts as any[]) {
                    const groupId = row.group_id || 'ungrouped';
                    groupCountsMap.set(groupId, (groupCountsMap.get(groupId) || 0) + row.total);
                }
            }
        }
        logger.info('已统计所有订阅的分组情况。', { groupCounts: Object.fromEntries(groupCountsMap) });

        // Add non-ordered groups to the end of the ordered list
        const allGroupIdsInMap = Array.from(groupCountsMap.keys());
        const ungroupedIndex = allGroupIdsInMap.indexOf('ungrouped');
        if (ungroupedIndex > -1) {
            allGroupIdsInMap.splice(ungroupedIndex, 1); // remove 'ungrouped' for now
        }
        
        for (const groupId of allGroupIdsInMap) {
            if (!orderedGroupIds.includes(groupId)) {
                orderedGroupIds.push(groupId);
            }
        }
        // Always add 'ungrouped' to the very end if it exists
        if (groupCountsMap.has('ungrouped')) {
            orderedGroupIds.push('ungrouped');
        }
        
        logger.info('最终处理的分组顺序:', { finalOrder: orderedGroupIds });

        const candidateSets: [string, CandidateSet][] = [];

        // 3. For each group in the final ordered list, fetch a "candidate set"
        for (const groupId of orderedGroupIds) {
            const totalInGroup = groupCountsMap.get(groupId);
            if (!totalInGroup) continue;

            const startIndex = groupPollingState[groupId] || 0;
            const effectiveStartIndex = startIndex % totalInGroup;
            logger.info(`为分组 "${groupId}" 准备候选集...`, { totalInGroup, startIndex: effectiveStartIndex });

            const candidatesQuery = `
                SELECT id, name, url, group_id
                FROM subscriptions
                WHERE user_id = ? AND ${groupId === 'ungrouped' ? 'group_id IS NULL' : 'group_id = ?'}
                ORDER BY id
                LIMIT ? OFFSET ?
            `;
            
            const queryParams: any[] = [userId];
            if (groupId !== 'ungrouped') {
                queryParams.push(groupId);
            }
            queryParams.push(pollingThreshold, effectiveStartIndex);

            const { results: candidates } = await db.prepare(candidatesQuery).bind(...queryParams).all();
            
            if (candidates && candidates.length > 0) {
                logger.success(`已为分组 "${groupId}" 获取 ${candidates.length} 个候选订阅。`, { candidates: candidates.map((c: any) => c.name) });
                candidateSets.push([groupId, {
                    candidates,
                    totalInGroup,
                    startIndex: effectiveStartIndex
                }]);
            } else {
                logger.warn(`为分组 "${groupId}" 获取候选订阅失败。`);
            }
        }
        
        return {
            type: 'candidates',
            candidateSets,
            strategy: 'polling (group_request)'
        };
    }

    // --- Other Strategies (Still require fetching all subs, but can be optimized if needed) ---
    const CHUNK_SIZE = 50;
    let allSubs: any[] = [];
    for (let i = 0; i < subIds.length; i += CHUNK_SIZE) {
        const chunk = subIds.slice(i, i + CHUNK_SIZE);
        const query = `SELECT * FROM subscriptions WHERE id IN (${chunk.map(() => '?').join(',')}) AND user_id = ?`;
        const { results: subsInChunk } = await db.prepare(query).bind(...chunk, userId).all();
        if (subsInChunk) {
            allSubs = allSubs.concat(subsInChunk);
        }
    }
    logger.info(`已获取全部 ${allSubs.length} 个相关订阅的详细信息。`);

    let selectedSources: SelectedSource[] = [];
    const updatedPollingState: { polling_index?: number } = {};

    if (strategy === 'random') {
        const groupedSubs: Record<string, any[]> = {};
        for (const sub of allSubs) {
            const groupId = sub.group_id || 'ungrouped';
            if (!groupedSubs[groupId]) groupedSubs[groupId] = [];
            groupedSubs[groupId].push(sub);
        }
        for (const groupId in groupedSubs) {
            const subsInGroup = groupedSubs[groupId];
            const randomIndex = Math.floor(Math.random() * subsInGroup.length);
            const selected = subsInGroup[randomIndex];
            logger.success(`在分组 "${groupId}" 中随机选择了订阅: "${selected.name}"`);
            selectedSources.push({ type: 'subscription', sub: selected });
        }
    } else if (strategy === 'polling') {
        const mode = airportOptions.polling_mode || 'hourly';
        strategy = `polling (${mode})`;

        if (mode === 'request') {
            const startIndex = profile.polling_index || 0;
            const selected = allSubs[startIndex % allSubs.length];
            logger.success(`按 "请求轮询" 策略选择了第 ${startIndex} 个订阅: "${selected.name}"`);
            selectedSources.push({ type: 'subscription', sub: selected });
            updatedPollingState.polling_index = (startIndex + 1) % allSubs.length;
        } else { // hourly
            const hour = new Date().getHours();
            const selected = allSubs[hour % allSubs.length];
            logger.success(`按 "小时轮询" 策略选择了第 ${hour % allSubs.length} 个订阅: "${selected.name}"`);
            selectedSources.push({ type: 'subscription', sub: selected });
        }
    } else { // 'all' or default
        logger.info('策略为 "all"，选择所有订阅。');
        for (const sub of allSubs) {
            selectedSources.push({ type: 'subscription', sub });
        }
    }

    return { type: 'selection', selectedSources, updatedPollingState, strategy };
};


export const applyAllRules = async (db: D1Database, userId: string, profileId: string, nodes: (ParsedNode & { id: string; raw: string; })[], logger: Logger): Promise<(ParsedNode & { id: string; raw: string; })[]> => {
    let processedNodes = [...nodes];
    logger.info(`准备应用配置文件全局规则，当前节点数: ${processedNodes.length}`);

    const { results: profileRules } = await db.prepare(
        'SELECT * FROM profile_rules WHERE profile_id = ? AND user_id = ? AND enabled = 1 ORDER BY sort_order ASC'
    ).bind(profileId, userId).all<any>();

    if (profileRules && profileRules.length > 0) {
        logger.info(`找到 ${profileRules.length} 条启用的全局规则。`);
        const initialCount = processedNodes.length;
        processedNodes = applySubscriptionRules(processedNodes, profileRules);
        logger.success(`全局规则应用完毕，节点数变化: ${initialCount} -> ${processedNodes.length}`);
    } else {
        logger.info('没有找到启用的全局规则。');
    }

    return processedNodes;
};


export const generateProfileNodes = async (env: Env, executionCtx: ExecutionContext, profile: any, isDryRun: boolean = false, logger: Logger): Promise<(ParsedNode & { id: string; raw: string; subscriptionName?: string; isManual?: boolean; group_name?: string; })[]> => {
    const content = JSON.parse(profile.content || '{}');
    const userId = profile.user_id;
    const airportOptions = content.airport_subscription_options || {};
    const timeout = airportOptions.timeout || 10;

    let allNodes: (ParsedNode & { id: string; raw: string; subscriptionName?: string; isManual?: boolean; group_name?: string; })[] = [];
    
    if (content.subscription_ids && content.subscription_ids.length > 0) {
        logger.info('开始处理配置文件中的订阅...');
        // Mock Hono context for selectSourcesByStrategy
        const mockContext = {
            env: { DB: env.DB },
            get: (key: string) => (key === 'jwtPayload' ? { id: userId } : undefined),
        };

        const strategyResult = await selectSourcesByStrategy(mockContext, profile, isDryRun, logger);
        const { strategy } = strategyResult;
        let updatedPollingState: { polling_index?: number; group_polling_indices?: Record<string, number> } = {};

        if (strategy === 'polling (group_request)' && strategyResult.type === 'candidates' && content.generation_mode === 'local') {
            const pollingInterval = airportOptions.polling_interval || 200;
            let groupPollingState;
            try {
                // profile.group_polling_indices might be null or an invalid JSON string
                groupPollingState = JSON.parse(profile.group_polling_indices || '{}');
            } catch (error) {
                logger.error('解析 group_polling_indices 失败，将使用空状态。', { error, rawValue: profile.group_polling_indices });
                groupPollingState = {}; // Fallback to an empty object on parsing failure
            }
            logger.info(`开始并发探测每个分组的候选订阅，探测间隔: ${pollingInterval}ms`);
            
            const findAvailableSubInGroup = async (groupId: string, candidateSet: CandidateSet): Promise<(ParsedNode & { id: string; raw: string; subscriptionName?: string; })[]> => {
                logger.info(`开始串行探测分组 "${groupId}"...`);
                for (const [index, sub] of candidateSet.candidates.entries()) {
                    try {
                        const fetchedContent = await fetchSubscriptionContent(sub.url, timeout);
                        if (fetchedContent) {
                            logger.success(`分组 "${groupId}" 的候选 "${sub.name}" 成功返回内容。`);
                            const nodes = parseSubscriptionContent(fetchedContent);
                            logger.info(`解析 "${sub.name}" 成功，获得 ${nodes.length} 个节点。`);
                            
                            const newIndex = (candidateSet.startIndex + index + 1) % candidateSet.totalInGroup;
                            groupPollingState[groupId] = newIndex;
                            logger.info(`分组 "${groupId}" 的轮询索引将更新为 ${newIndex}。`);
                            
                            // Return nodes with subscription name attached
                            return nodes.map(node => ({ ...node, subscriptionName: sub.name }));
                        } else {
                            logger.warn(`分组 "${groupId}" 的候选 "${sub.name}" 返回内容为空。`);
                        }
                    } catch (error) {
                        logger.error(`分组 "${groupId}" 的候选 "${sub.name}" 请求失败。`, { error });
                    }
                }
                logger.error(`分组 "${groupId}" 的所有候选订阅均获取失败。`);
                return []; // Return empty array if no subscription in the group is available
            };

            // candidateSets is now an ordered array
            const groupPromises = strategyResult.candidateSets.map(([groupId, cs]) => findAvailableSubInGroup(groupId, cs));
            
            const resultsFromGroups = await Promise.all(groupPromises);
            allNodes = resultsFromGroups.flat();
            logger.success(`所有分组探测完成，共获得 ${allNodes.length} 个节点。`);
            
            if (Object.keys(groupPollingState).length > 0) {
                updatedPollingState.group_polling_indices = groupPollingState;
            }

        } else if (strategyResult.type === 'selection') {
            const { selectedSources, updatedPollingState: regularPollingState } = strategyResult;
            if (regularPollingState && regularPollingState.polling_index !== undefined) {
                updatedPollingState = regularPollingState;
            }
            logger.info(`准备获取 ${selectedSources.length} 个选定订阅的内容...`);
            const fetchPromises = selectedSources.map(async (source: any) => {
                if (source.type === 'subscription') {
                    logger.info(`正在获取 "${source.sub.name}" (${source.sub.url})...`);
                    const content = await fetchSubscriptionContent(source.sub.url, timeout);
                    if (content) {
                        logger.success(`成功获取 "${source.sub.name}" 的内容。`);
                        return { ...source, content };
                    } else {
                        logger.warn(`获取 "${source.sub.name}" 的内容为空。`);
                    }
                }
                return null;
            });

            const fetchedSources = (await Promise.all(fetchPromises)).filter(Boolean);

            for (const source of fetchedSources as any[]) {
                if (source && source.content) {
                    let nodes = parseSubscriptionContent(source.content);
                    logger.info(`解析 "${source.sub.name}" 成功，获得 ${nodes.length} 个节点。`);
                    let combinedRules = [];

                    if (source.sub.group_id) {
                        const { results: groupRules } = await env.DB.prepare('SELECT * FROM subscription_group_rules WHERE group_id = ? AND user_id = ? AND enabled = 1 ORDER BY sort_order ASC').bind(source.sub.group_id, userId).all();
                        if (groupRules && groupRules.length > 0) {
                            logger.info(`"${source.sub.name}" 所在分组有 ${groupRules.length} 条规则，准备应用...`);
                            combinedRules.push(...groupRules);
                        }
                    }

                    const { results: subRules } = await env.DB.prepare('SELECT * FROM subscription_rules WHERE subscription_id = ? AND user_id = ? AND enabled = 1 ORDER BY sort_order ASC').bind(source.sub.id, userId).all();
                    if (subRules && subRules.length > 0) {
                        logger.info(`"${source.sub.name}" 自身有 ${subRules.length} 条规则，准备应用...`);
                        combinedRules.push(...subRules);
                    }

                    if (combinedRules.length > 0) {
                        const initialCount = nodes.length;
                        nodes = applySubscriptionRules(nodes, combinedRules);
                        logger.success(`订阅/分组规则应用完毕，节点数变化: ${initialCount} -> ${nodes.length}`);
                    }
                    
                    const nodesWithSubName = nodes.map((node: any) => ({ ...node, subscriptionName: source.sub.name }));
                    allNodes.push(...nodesWithSubName);
                }
            }
        }
        
        if (Object.keys(updatedPollingState).length > 0) {
            let setClauses = [];
            let bindings: (string | number | undefined)[] = [];
            if (updatedPollingState.polling_index !== undefined) {
                setClauses.push('polling_index = ?');
                bindings.push(updatedPollingState.polling_index);
            }
            if (updatedPollingState.group_polling_indices !== undefined) {
                setClauses.push('group_polling_indices = ?');
                bindings.push(JSON.stringify(updatedPollingState.group_polling_indices));
            }
            
            if (setClauses.length > 0) {
                const query = `UPDATE profiles SET ${setClauses.join(', ')} WHERE id = ?`;
                bindings.push(profile.id);
                logger.info('正在更新数据库中的轮询状态...', { state: updatedPollingState });
                executionCtx.waitUntil(env.DB.prepare(query).bind(...bindings).run());
            }
        }
    } else {
        logger.info('配置文件中未包含任何订阅。');
    }

    if (content.node_ids && content.node_ids.length > 0) {
        logger.info(`准备合并 ${content.node_ids.length} 个手动添加的节点...`);
        
        const CHUNK_SIZE = 50;
        let manualNodes: any[] = [];
        const nodeIds = content.node_ids;

        for (let i = 0; i < nodeIds.length; i += CHUNK_SIZE) {
            const chunk = nodeIds.slice(i, i + CHUNK_SIZE);
            logger.info(`正在获取第 ${i + 1} 到 ${i + chunk.length} 个手动节点...`);
            const { results: nodesInChunk } = await env.DB.prepare(`
                SELECT n.*, g.name as group_name FROM nodes n
                LEFT JOIN node_groups g ON n.group_id = g.id
                WHERE n.id IN (${chunk.map(() => '?').join(',')}) AND n.user_id = ?
            `).bind(...chunk, userId).all<any>();
            
            if (nodesInChunk) {
                manualNodes = manualNodes.concat(nodesInChunk);
            }
        }

        const parsedManualNodes = manualNodes.map((n: any) => ({
            ...parseNodeLinks(n.link)[0],
            id: n.id,
            raw: n.link,
            group_name: n.group_name,
            isManual: true,
        }));
        const nodePrefixSettings = content.node_prefix_settings || {};
        if (nodePrefixSettings.manual_nodes_first) {
            allNodes.unshift(...parsedManualNodes);
            logger.info('排序规则: 手动节点优先，已置于列表开头。');
        } else {
            allNodes.push(...parsedManualNodes);
            logger.info('排序规则: 订阅节点优先，手动节点已添加至列表末尾。');
        }
        logger.success(`成功合并 ${parsedManualNodes.length} 个手动节点。`);
    }

    allNodes = await applyAllRules(env.DB, userId, profile.id, allNodes, logger);

    const prefixSettings = content.node_prefix_settings || {};
    if (prefixSettings.enable_subscription_prefix || prefixSettings.manual_node_prefix || prefixSettings.enable_group_name_prefix) {
        logger.info('开始应用节点名称前缀...');
        let prefixAppliedCount = 0;
        allNodes = allNodes.map(node => {
            if (prefixSettings.enable_subscription_prefix && node.subscriptionName) {
                prefixAppliedCount++;
                return { ...node, name: `${node.subscriptionName} - ${node.name}` };
            }
            if (node.isManual) {
                if (prefixSettings.enable_group_name_prefix && node.group_name) {
                    prefixAppliedCount++;
                    return { ...node, name: `${node.group_name} - ${node.name}` };
                }
                if (prefixSettings.manual_node_prefix) {
                    prefixAppliedCount++;
                    return { ...node, name: `${prefixSettings.manual_node_prefix} - ${node.name}` };
                }
            }
            return node;
        });
        logger.success(`前缀应用完毕，共为 ${prefixAppliedCount} 个节点添加了前缀。`);
    } else {
        logger.info('未配置或未启用节点名称前缀。');
    }
    
    return allNodes;
};

// --- END OF REFACTORED LOGIC ---


// This is a public endpoint, no auth on this specific route
profiles.get('/:identifier/subscribe', async (c) => {
    c.status(410); // Gone
    return c.text('This subscription link format is deprecated. Please use the new format: /s/{token}/{alias}/subscribe');
});


// All other routes below this line require auth
profiles.use('*', manualAuthMiddleware);

profiles.get('/:id/preview-nodes', async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const profile = await c.env.DB.prepare('SELECT * FROM profiles WHERE id = ? AND user_id = ?').bind(id, user.id).first<any>();

    if (!profile) {
        return c.json({ success: false, message: 'Profile not found' }, 404);
    }
    
    const logger = new Logger();

    // The preview route now calls the centralized generator with isPreview = true
    // The notification logic is now inside generateSubscription.
    return generateSubscription(c, profile, user, false, true, logger);
});

profiles.get('/', async (c) => {
    const user = c.get('jwtPayload');
    const { results } = await c.env.DB.prepare('SELECT * FROM profiles WHERE user_id = ?').bind(user.id).all<any>();
    
    const expandedResults = results.map(profile => {
        try {
            const content = JSON.parse(profile.content || '{}');
            return { ...profile, ...content };
        } catch (e) {
            console.error(`Failed to parse content for profile ${profile.id}:`, e);
            return profile;
        }
    });

    return c.json({ success: true, data: expandedResults });
});

profiles.post('/', async (c) => {
    const user = c.get('jwtPayload');
    const body = await c.req.json<any>();
    const profileId = crypto.randomUUID();
    const now = new Date().toISOString();

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
        return c.json({ success: false, message: 'Profile name is required.' }, 400);
    }

    const name = body.name.trim();
    const alias = body.alias || null;
    const content = JSON.parse(body.content || '{}');
    const rules = body.rules || [];

    const contentPayload = {
        subscription_ids: content.subscription_ids,
        node_ids: content.node_ids,
        node_prefix_settings: content.node_prefix_settings,
        airport_subscription_options: content.airport_subscription_options,
        subconverter_backend_id: content.subconverter_backend_id,
        subconverter_config_id: content.subconverter_config_id,
        generation_mode: content.generation_mode || 'local',
    };

    try {
        const statements = [];

        // 1. Insert the profile
        statements.push(
            c.env.DB.prepare(
                `INSERT INTO profiles (id, user_id, name, alias, content, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
            ).bind(profileId, user.id, name, alias, JSON.stringify(contentPayload), now, now)
        );

        // 2. Insert the rules, if any
        if (rules.length > 0) {
            const ruleInsertStm = c.env.DB.prepare(
                `INSERT INTO profile_rules (user_id, profile_id, name, type, value, enabled, sort_order, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            );
            for (const [index, rule] of rules.entries()) {
                const { name, type, value, enabled, sort_order } = rule;

                // Data validation
                if (!name || typeof name !== 'string' || name.trim() === '') {
                    return c.json({ success: false, message: `Rule ${index + 1} is missing a name.` }, 400);
                }
                if (!type || typeof type !== 'string') {
                    return c.json({ success: false, message: `Rule "${name}" is missing a type.` }, 400);
                }
                if (value === undefined || value === null || typeof value !== 'string') {
                     return c.json({ success: false, message: `Rule "${name}" is missing a value.` }, 400);
                }

                statements.push(
                    ruleInsertStm.bind(
                        user.id,
                        profileId,
                        name.trim(),
                        type,
                        value,
                        enabled === 1 ? 1 : 0,
                        sort_order ?? index,
                        now,
                        now
                    )
                );
            }
        }

        await c.env.DB.batch(statements);

        return c.json({ success: true, data: { id: profileId } }, 201);

    } catch (e: any) {
        console.error('Failed to create profile with rules:', e.message);
        return c.json({ success: false, message: 'Failed to create profile.', error: e.message }, 500);
    }
});

// Handle PUT requests sent as POST with X-HTTP-Method-Override header
profiles.post('/:id', async (c) => {
    const methodOverride = c.req.header('X-HTTP-Method-Override');
    if (methodOverride && methodOverride.toUpperCase() === 'PUT') {
        // Recreate the PUT handler logic here since we can't call it directly
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        const body = await c.req.json<any>();
        const now = new Date().toISOString();

        if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
            return c.json({ success: false, message: 'Profile name is required.' }, 400);
        }

        const name = body.name.trim();
        const alias = body.alias || null;
        const content = JSON.parse(body.content || '{}');

        const contentPayload = {
            subscription_ids: content.subscription_ids,
            node_ids: content.node_ids,
            node_prefix_settings: content.node_prefix_settings,
            airport_subscription_options: content.airport_subscription_options,
            subconverter_backend_id: content.subconverter_backend_id,
            subconverter_config_id: content.subconverter_config_id,
            generation_mode: content.generation_mode || 'local',
        };

        await c.env.DB.prepare(
            `UPDATE profiles SET name = ?, alias = ?, content = ?, updated_at = ?
             WHERE id = ? AND user_id = ?`
        ).bind(name, alias, JSON.stringify(contentPayload), now, id, user.id).run();

        return c.json({ success: true });
    }
    return c.json({ success: false, message: 'Method not allowed' }, 405);
});

profiles.get('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const profile: any = await c.env.DB.prepare('SELECT * FROM profiles WHERE id = ? AND user_id = ?').bind(id, user.id).first();
    if (!profile) return c.json({ success: false, message: 'Profile not found' }, 404);

    try {
        const content = JSON.parse(profile.content || '{}');
        const expandedProfile = { ...profile, ...content };
        return c.json({ success: true, data: expandedProfile });
    } catch (e) {
        console.error(`Failed to parse content for profile ${id}:`, e);
        return c.json({ success: true, data: profile });
    }
});

profiles.put('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const body = await c.req.json<any>();
    const now = new Date().toISOString();

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
        return c.json({ success: false, message: 'Profile name is required.' }, 400);
    }

    const name = body.name.trim();
    const alias = body.alias || null;
    const content = JSON.parse(body.content || '{}');

    const contentPayload = {
        subscription_ids: content.subscription_ids,
        node_ids: content.node_ids,
        node_prefix_settings: content.node_prefix_settings,
        airport_subscription_options: content.airport_subscription_options,
        subconverter_backend_id: content.subconverter_backend_id,
        subconverter_config_id: content.subconverter_config_id,
        generation_mode: content.generation_mode || 'local',
    };

    await c.env.DB.prepare(
        `UPDATE profiles SET name = ?, alias = ?, content = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`
    ).bind(name, alias, JSON.stringify(contentPayload), now, id, user.id).run();

    return c.json({ success: true });
});

profiles.delete('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    await c.env.DB.prepare('DELETE FROM profiles WHERE id = ? AND user_id = ?').bind(id, user.id).run();
    return c.json({ success: true });
});

export default profiles;