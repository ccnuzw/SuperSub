import { DrizzleDB } from '../utils/db';
import { profiles, profile_rules, subscriptions, subscription_groups, subscription_rules, subscription_group_rules, nodes, node_groups } from '../drizzle/schema';
import { eq, and, asc, desc, inArray, sql, count, isNull, getTableColumns } from 'drizzle-orm';
import { Logger } from '../utils/logger';
import { parseNodeLinks, ParsedNode } from '../../../src/utils/nodeParser';
import { fetchSubscriptionContent } from '../utils/network';
import { applySubscriptionRules, parseSubscriptionContent } from '../utils/subscriptionUtils';

interface SelectedSource {
    type: 'subscription';
    sub: { id: string; name: string; url: string; group_id: string | null; };
}

export interface CandidateSet {
    candidates: any[];
    totalInGroup: number;
    startIndex: number;
}

export type StrategyResult = {
    strategy: string;
} & ({
    type: 'candidates';
    candidateSets: [string, CandidateSet][];
} | {
    type: 'selection';
    selectedSources: SelectedSource[];
    updatedPollingState?: { polling_index?: number };
});

export class NodeProcessor {
    private db: DrizzleDB;

    constructor(db: DrizzleDB) {
        this.db = db;
    }

    async generateProfileNodes(profile: any, isDryRun: boolean = false, logger: Logger, executionCtx?: ExecutionContext): Promise<(ParsedNode & { id: string; raw: string; subscriptionName?: string; isManual?: boolean; group_name?: string; })[]> {
        const content = JSON.parse(profile.content || '{}');
        const userId = profile.user_id;
        const airportOptions = content.airport_subscription_options || {};
        const timeout = airportOptions.timeout || 10;

        let allNodes: (ParsedNode & { id: string; raw: string; subscriptionName?: string; isManual?: boolean; group_name?: string; })[] = [];

        if (content.subscription_ids && content.subscription_ids.length > 0) {
            logger.info('开始处理配置文件中的订阅...');

            const strategyResult = await this.selectSourcesByStrategy(userId, profile, isDryRun, logger);
            const { strategy } = strategyResult;
            let updatedPollingState: { polling_index?: number; group_polling_indices?: Record<string, number> } = {};

            if (strategy === 'polling (group_request)' && strategyResult.type === 'candidates' && content.generation_mode === 'local') {
                const pollingInterval = airportOptions.polling_interval || 200;
                let groupPollingState: any;
                try {
                    groupPollingState = JSON.parse(profile.group_polling_indices || '{}');
                } catch (error) {
                    logger.error('解析 group_polling_indices 失败，将使用空状态。', { error, rawValue: profile.group_polling_indices });
                    groupPollingState = {};
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

                                return nodes.map(node => ({ ...node, subscriptionName: sub.name }));
                            } else {
                                logger.warn(`分组 "${groupId}" 的候选 "${sub.name}" 返回内容为空。`);
                            }
                        } catch (error) {
                            logger.error(`分组 "${groupId}" 的候选 "${sub.name}" 请求失败。`, { error });
                        }
                    }
                    logger.error(`分组 "${groupId}" 的所有候选订阅均获取失败。`);
                    return [];
                };

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
                const fetchedSources = await this.fetchSubscriptionContentBatch(selectedSources, timeout, logger);
                const sourceNodes = await this.applySourceRules(userId, fetchedSources, logger);
                allNodes.push(...sourceNodes);
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

                if (executionCtx) {
                    executionCtx.waitUntil(
                        this.db.update(profiles)
                            .set(updatedPollingState as any) // Drizzle might complain about partial types, casting generally safe if shape matches
                            .where(eq(profiles.id, profile.id))
                    );
                } else {
                    await this.db.update(profiles)
                        .set(updatedPollingState as any)
                        .where(eq(profiles.id, profile.id));
                }
            }
        } else {
            logger.info('配置文件中未包含任何订阅。');
        }

        if (content.node_ids && content.node_ids.length > 0) {
            const prefixSettings = content.node_prefix_settings || {};
            allNodes = await this.mergeManualNodes(userId, content.node_ids, prefixSettings, logger, allNodes);
        }

        allNodes = await this.applyAllRules(userId, profile.id, allNodes, logger);

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
    }

    async selectSourcesByStrategy(userId: string, profile: any, isDryRun: boolean = false, logger: Logger): Promise<StrategyResult> {
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
            const sortedGroups = await this.db.select({ id: subscription_groups.id })
                .from(subscription_groups)
                .where(eq(subscription_groups.user_id, userId))
                .orderBy(asc(subscription_groups.sort_order));

            const orderedGroupIds = sortedGroups.map(g => g.id);
            logger.info('已获取有序的分组列表。', { orderedGroupIds });

            // 2. Get group counts for all *selected* subscriptions
            const groupCountsMap = new Map<string, number>();
            for (let i = 0; i < subIds.length; i += CHUNK_SIZE) {
                const chunk = subIds.slice(i, i + CHUNK_SIZE);
                // SELECT group_id, COUNT(*) as total FROM subscriptions WHERE id IN (...) AND user_id = ... GROUP BY group_id
                const chunkGroupCounts = await this.db.select({
                    group_id: subscriptions.group_id,
                    total: count(subscriptions.id)
                })
                    .from(subscriptions)
                    .where(and(inArray(subscriptions.id, chunk), eq(subscriptions.user_id, userId)))
                    .groupBy(subscriptions.group_id);

                for (const row of chunkGroupCounts) {
                    const groupId = row.group_id || 'ungrouped';
                    groupCountsMap.set(groupId, (groupCountsMap.get(groupId) || 0) + row.total);
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

                let whereClause;
                if (groupId === 'ungrouped') {
                    whereClause = and(eq(subscriptions.user_id, userId), isNull(subscriptions.group_id));
                } else {
                    whereClause = and(eq(subscriptions.user_id, userId), eq(subscriptions.group_id, groupId));
                }

                const candidates = await this.db.select({
                    id: subscriptions.id,
                    name: subscriptions.name,
                    url: subscriptions.url,
                    group_id: subscriptions.group_id
                })
                    .from(subscriptions)
                    .where(whereClause)
                    .orderBy(asc(subscriptions.id))
                    .limit(pollingThreshold)
                    .offset(effectiveStartIndex);

                if (candidates && candidates.length > 0) {
                    logger.success(`已为分组 "${groupId}" 获取 ${candidates.length} 个候选订阅。`, { candidates: candidates.map(c => c.name) });
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
            const subsInChunk = await this.db.select().from(subscriptions).where(and(inArray(subscriptions.id, chunk), eq(subscriptions.user_id, userId)));
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
    }

    async applyAllRules(userId: string, profileId: string, nodes: (ParsedNode & { id: string; raw: string; })[], logger: Logger): Promise<(ParsedNode & { id: string; raw: string; })[]> {
        let processedNodes = [...nodes];
        logger.info(`准备应用配置文件全局规则，当前节点数: ${processedNodes.length}`);

        const profileRules = await this.db.select().from(profile_rules)
            .where(and(eq(profile_rules.profile_id, profileId), eq(profile_rules.user_id, userId), eq(profile_rules.enabled, 1)))
            .orderBy(asc(profile_rules.sort_order));

        if (profileRules && profileRules.length > 0) {
            logger.info(`找到 ${profileRules.length} 条启用的全局规则。`);
            const initialCount = processedNodes.length;
            processedNodes = applySubscriptionRules(processedNodes, profileRules);
            logger.success(`全局规则应用完毕，节点数变化: ${initialCount} -> ${processedNodes.length}`);
        } else {
            logger.info('没有找到启用的全局规则。');
        }

        return processedNodes;
    }

    async fetchSubscriptionContentBatch(selectedSources: SelectedSource[], timeout: number, logger: Logger): Promise<any[]> {
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
        return (await Promise.all(fetchPromises)).filter(Boolean);
    }

    async applySourceRules(userId: string, fetchedSources: any[], logger: Logger): Promise<(ParsedNode & { id: string; raw: string; subscriptionName?: string; })[]> {
        const fetchedSubIds: string[] = [];
        const fetchedGroupIds: string[] = [];
        fetchedSources.forEach((s: any) => {
            if (s.sub.id) fetchedSubIds.push(s.sub.id);
            if (s.sub.group_id) fetchedGroupIds.push(s.sub.group_id);
        });

        // Batch fetch group rules
        let groupRulesMap = new Map<string, any[]>();
        if (fetchedGroupIds.length > 0) {
            const uniqueGroupIds = [...new Set(fetchedGroupIds)];
            const chunkSize = 50;
            for (let i = 0; i < uniqueGroupIds.length; i += chunkSize) {
                const chunk = uniqueGroupIds.slice(i, i + chunkSize);
                const results = await this.db.select().from(subscription_group_rules)
                    .where(and(
                        inArray(subscription_group_rules.group_id, chunk),
                        eq(subscription_group_rules.user_id, userId),
                        eq(subscription_group_rules.enabled, 1)
                    ))
                    .orderBy(asc(subscription_group_rules.sort_order));

                if (results) {
                    results.forEach((rule: any) => {
                        const list = groupRulesMap.get(rule.group_id) || [];
                        list.push(rule);
                        groupRulesMap.set(rule.group_id, list);
                    });
                }
            }
        }

        // Batch fetch subscription rules
        let subRulesMap = new Map<string, any[]>();
        if (fetchedSubIds.length > 0) {
            const uniqueSubIds = [...new Set(fetchedSubIds)];
            const chunkSize = 50;
            for (let i = 0; i < uniqueSubIds.length; i += chunkSize) {
                const chunk = uniqueSubIds.slice(i, i + chunkSize);
                const results = await this.db.select().from(subscription_rules)
                    .where(and(
                        inArray(subscription_rules.subscription_id, chunk),
                        eq(subscription_rules.user_id, userId),
                        eq(subscription_rules.enabled, 1)
                    ))
                    .orderBy(asc(subscription_rules.sort_order));

                if (results) {
                    results.forEach((rule: any) => {
                        const list = subRulesMap.get(rule.subscription_id) || [];
                        list.push(rule);
                        subRulesMap.set(rule.subscription_id, list);
                    });
                }
            }
        }

        let allNodes: any[] = [];
        for (const source of fetchedSources) {
            if (source && source.content) {
                let nodes = parseSubscriptionContent(source.content);
                logger.info(`解析 "${source.sub.name}" 成功，获得 ${nodes.length} 个节点。`);
                let combinedRules: any[] = [];

                if (source.sub.group_id) {
                    const groupRules = groupRulesMap.get(source.sub.group_id);
                    if (groupRules && groupRules.length > 0) {
                        logger.info(`"${source.sub.name}" 所在分组有 ${groupRules.length} 条规则，准备应用...`);
                        combinedRules.push(...groupRules);
                    }
                }

                const subRules = subRulesMap.get(source.sub.id);
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
        return allNodes;
    }

    async mergeManualNodes(userId: string, nodeIds: string[], nodePrefixSettings: any, logger: Logger, existingNodes: any[]): Promise<any[]> {
        logger.info(`准备合并 ${nodeIds.length} 个手动添加的节点...`);
        const CHUNK_SIZE = 50;
        let manualNodes: any[] = [];

        for (let i = 0; i < nodeIds.length; i += CHUNK_SIZE) {
            const chunk = nodeIds.slice(i, i + CHUNK_SIZE);
            logger.info(`正在获取第 ${i + 1} 到 ${i + chunk.length} 个手动节点...`);

            // Join nodes and node_groups
            const nodesInChunk = await this.db.select({
                ...getTableColumns(nodes),
                group_name: node_groups.name
            })
                .from(nodes)
                .leftJoin(node_groups, eq(nodes.group_id, node_groups.id))
                .where(and(inArray(nodes.id, chunk), eq(nodes.user_id, userId)));

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

        let result = [...existingNodes];
        if (nodePrefixSettings.manual_nodes_first) {
            result.unshift(...parsedManualNodes);
            logger.info('排序规则: 手动节点优先，已置于列表开头。');
        } else {
            result.push(...parsedManualNodes);
            logger.info('排序规则: 订阅节点优先，手动节点已添加至列表末尾。');
        }
        logger.success(`成功合并 ${parsedManualNodes.length} 个手动节点。`);
        return result;
    }
}
