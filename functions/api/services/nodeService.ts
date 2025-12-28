import { fetchWithTimeout } from '../utils/network';
import type { Env } from '../utils/types';
import { getDb, DrizzleDB } from '../utils/db';
import { nodes, node_groups, node_statuses } from '../drizzle/schema';
import { eq, and, asc, inArray, isNull, sql } from 'drizzle-orm';
import { parseNodeLinks, ParsedNode, regenerateLink } from '../../../src/utils/nodeParser';

// ... (Node type definition remains the same or can be inferred from schema)

export class NodeService {
    private db: DrizzleDB;

    constructor(env: Env) {
        this.db = getDb(env.DB);
    }

    async getGroupedNodes(userId: string) {
        const [allNodes, allGroups] = await Promise.all([
            this.db.select({ id: nodes.id, name: nodes.name, group_id: nodes.group_id }).from(nodes)
                .where(eq(nodes.user_id, userId))
                .orderBy(asc(nodes.name)),
            this.db.select({ id: node_groups.id, name: node_groups.name }).from(node_groups)
                .where(eq(node_groups.user_id, userId))
                .orderBy(asc(node_groups.sort_order))
        ]);

        // const allNodes = nodesResponse.results; // No longer needed
        // const allGroups = groupsResponse.results; // No longer needed

        const groupMap = new Map<string, string>();
        for (const group of allGroups) {
            groupMap.set(group.id, group.name);
        }

        const groupedNodes: { [key: string]: { id: string; name: string }[] } = {};
        const ungroupedNodes: { id: string; name: string }[] = [];

        for (const group of allGroups) {
            groupedNodes[group.name] = [];
        }

        for (const node of allNodes) {
            if (node.group_id && groupMap.has(node.group_id)) {
                const groupName = groupMap.get(node.group_id)!;
                groupedNodes[groupName].push({ id: node.id, name: node.name });
            } else {
                ungroupedNodes.push({ id: node.id, name: node.name });
            }
        }

        return {
            ...groupedNodes,
            ...(ungroupedNodes.length > 0 ? { '未分组': ungroupedNodes } : {})
        };
    }

    async getAllNodes(userId: string) {
        return await this.db.select().from(nodes)
            .where(eq(nodes.user_id, userId))
            .orderBy(asc(nodes.sort_order));
    }

    async getNode(id: string, userId: string) {
        const result = await this.db.select().from(nodes)
            .where(and(eq(nodes.id, id), eq(nodes.user_id, userId)))
            .limit(1);
        return result[0] || null;
    }

    async createNode(userId: string, body: any) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.insert(nodes).values({
            id,
            user_id: userId,
            name: body.name,
            link: body.link,
            protocol: body.protocol,
            protocol_params: JSON.stringify(body.protocol_params),
            server: body.protocol_params?.add || '',
            port: Number(body.protocol_params?.port || 0),
            type: body.protocol,
            created_at: now,
            updated_at: now,
        });
        return { id };
    }

    async updateNode(id: string, userId: string, body: { name: string; link: string }) {
        const now = new Date().toISOString();
        // Check existence
        const existingNode = await this.db.select({ link: nodes.link, name: nodes.name }).from(nodes)
            .where(and(eq(nodes.id, id), eq(nodes.user_id, userId)))
            .limit(1)
            .then(res => res[0]);

        if (!existingNode) {
            throw new Error('Node not found');
        }

        if (existingNode.link !== body.link || existingNode.name !== body.name) {
            const parsedNodes = parseNodeLinks(body.link);
            if (parsedNodes.length === 0) {
                throw new Error('Invalid node link provided');
            }
            if (parsedNodes.length > 1) {
                throw new Error('Editing with multiple node links is not supported');
            }

            const parsedNode = parsedNodes[0];
            parsedNode.name = body.name;
            const regeneratedLink = regenerateLink(parsedNode);

            await this.db.update(nodes).set({
                name: body.name,
                link: regeneratedLink,
                protocol: parsedNode.protocol,
                protocol_params: JSON.stringify(parsedNode.protocol_params),
                server: parsedNode.server,
                port: parsedNode.port,
                type: parsedNode.protocol,
                updated_at: now,
            }).where(and(eq(nodes.id, id), eq(nodes.user_id, userId)));
        }
    }

    async deleteNode(id: string, userId: string) {
        await this.db.delete(nodes).where(and(eq(nodes.id, id), eq(nodes.user_id, userId)));
    }

    async batchImport(userId: string, body: { links?: string; nodes?: ParsedNode[]; groupId?: string }) {
        let nodesToImport: ParsedNode[] = [];

        if (body.nodes && Array.isArray(body.nodes)) {
            nodesToImport = body.nodes;
        } else if (body.links) {
            nodesToImport = parseNodeLinks(body.links);
        }

        if (nodesToImport.length === 0) {
            throw new Error('No valid nodes to import');
        }

        const now = new Date().toISOString();
        const groupId = body.groupId || null;

        const values = nodesToImport.map(node => {
            return {
                id: crypto.randomUUID(),
                user_id: userId,
                group_id: groupId, // Drizzle handles null correctly
                name: node.name || 'Unknown Node',
                link: regenerateLink(node),
                protocol: node.protocol || 'unknown',
                protocol_params: JSON.stringify(node.protocol_params || {}),
                server: node.server || '',
                port: node.port || 0,
                type: node.protocol || 'unknown',
                created_at: now,
                updated_at: now,
            };
        });

        // SQLite has limit on number of variables. Drizzle might handle batching internally or not?
        // Safe bet is to chunk it ourselves if list is huge, but let's trust simple batch insert for reasonable sizes first,
        // or just slice it. The D1 limit is 100 statements or something.
        // Actually Drizzle's .values(array) creates one big INSERT statement. SQLite limit is 32766 params.
        // With 12 columns, we can safely insert ~2700 rows.

        if (values.length > 0) {
            // For safety against large imports, simple chunking
            const CHUNK_SIZE = 100;
            for (let i = 0; i < values.length; i += CHUNK_SIZE) {
                await this.db.insert(nodes).values(values.slice(i, i + CHUNK_SIZE));
            }
        }
        return values.length;
    }

    async batchUpdateGroup(userId: string, nodeIds: string[], groupId: string | null) {
        const now = new Date().toISOString();
        // Drizzle's `inArray` handles the IN clause safely
        await this.db.update(nodes)
            .set({ group_id: groupId, updated_at: now })
            .where(and(inArray(nodes.id, nodeIds), eq(nodes.user_id, userId)));
    }

    async batchDelete(userId: string, ids: string[]) {
        if (ids.length === 0) return 0;

        // Drizzle usually handles chunking for internal params? Explicit chunking is safer for `inArray` if massive.
        const CHUNK_SIZE = 50;
        let totalDeleted = 0;
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            const chunk = ids.slice(i, i + CHUNK_SIZE);
            const res = await this.db.delete(nodes)
                .where(and(inArray(nodes.id, chunk), eq(nodes.user_id, userId)));
            totalDeleted += res.meta.changes || 0;
        }
        return totalDeleted;
    }

    async updateOrder(userId: string, nodeIds: string[]) {
        // Batch updating different values for different rows is usually done via CASE statements or multiple queries.
        // Drizzle batch API: db.batch([ ... ])
        const batch = nodeIds.map((id, index) =>
            this.db.update(nodes).set({ sort_order: index }).where(and(eq(nodes.id, id), eq(nodes.user_id, userId)))
        );
        if (batch.length > 0) {
            await this.db.batch(batch as any); // Type assertion might be needed if batch array is dynamic
        }
    }

    // Advanced Batch Actions
    async clearNodes(userId: string, groupId: string) {
        let whereClause;
        if (groupId === 'all') {
            whereClause = eq(nodes.user_id, userId);
        } else if (groupId === 'ungrouped') {
            whereClause = and(eq(nodes.user_id, userId), isNull(nodes.group_id));
        } else {
            whereClause = and(eq(nodes.user_id, userId), eq(nodes.group_id, groupId));
        }

        const nodesToClear = await this.db.select({ id: nodes.id }).from(nodes).where(whereClause);

        if (!nodesToClear || nodesToClear.length === 0) {
            return 0;
        }

        const idsToDelete = nodesToClear.map(n => n.id);
        return await this.batchDelete(userId, idsToDelete);
    }

    async sortNodes(userId: string, groupId: string) {
        let whereClause;
        if (groupId === 'all') {
            whereClause = eq(nodes.user_id, userId);
        } else if (groupId === 'ungrouped') {
            whereClause = and(eq(nodes.user_id, userId), isNull(nodes.group_id));
        } else {
            whereClause = and(eq(nodes.user_id, userId), eq(nodes.group_id, groupId));
        }

        // Assuming node_statuses is joined manually or we fetch both. 
        // For Drizzle, left join:
        const nodesToSort = await this.db.select({
            id: nodes.id,
            status: node_statuses.status,
            latency: node_statuses.latency
        })
            .from(nodes)
            .leftJoin(node_statuses, and(eq(nodes.id, node_statuses.node_id), eq(nodes.user_id, node_statuses.user_id)))
            .where(whereClause);

        if (!nodesToSort || nodesToSort.length === 0) {
            return 0;
        }

        nodesToSort.sort((a, b) => {
            const statusOrder = { 'healthy': 1, 'testing': 2, 'unhealthy': 3 };
            const aStatus = a.status || 'unhealthy';
            const bStatus = b.status || 'unhealthy';
            // @ts-ignore
            const aStatusOrder = statusOrder[aStatus] || 4;
            // @ts-ignore
            const bStatusOrder = statusOrder[bStatus] || 4;

            if (aStatusOrder !== bStatusOrder) {
                return aStatusOrder - bStatusOrder;
            }
            return (a.latency ?? Infinity) - (b.latency ?? Infinity);
        });

        const batch = nodesToSort.map((node, index) =>
            this.db.update(nodes).set({ sort_order: index }).where(eq(nodes.id, node.id))
        );

        if (batch.length > 0) {
            await this.db.batch(batch as any);
        }

        return nodesToSort.length;
    }

    async deduplicateNodes(userId: string, groupId: string) {
        let whereClause;
        if (groupId === 'all') {
            whereClause = eq(nodes.user_id, userId);
        } else if (groupId === 'ungrouped') {
            whereClause = and(eq(nodes.user_id, userId), isNull(nodes.group_id));
        } else {
            whereClause = and(eq(nodes.user_id, userId), eq(nodes.group_id, groupId));
        }

        const nodesToDeduplicate = await this.db.select({
            id: nodes.id,
            server: nodes.server,
            port: nodes.port,
            protocol: nodes.protocol,
            created_at: nodes.created_at
        }).from(nodes).where(whereClause);

        if (!nodesToDeduplicate || nodesToDeduplicate.length < 2) {
            return 0;
        }

        const uniqueNodes = new Map<string, { id: string; createdAt: Date }>();
        const idsToDelete: string[] = [];

        for (const node of nodesToDeduplicate) {
            // Null checks for server/port since I defined them as optional in schema but logic expects them
            const uniqueKey = `${node.server || ''}:${node.port || 0}:${node.protocol}`;
            const createdAt = new Date(node.created_at);

            if (uniqueNodes.has(uniqueKey)) {
                const existingNode = uniqueNodes.get(uniqueKey)!;
                if (createdAt > existingNode.createdAt) {
                    idsToDelete.push(existingNode.id);
                    uniqueNodes.set(uniqueKey, { id: node.id, createdAt });
                } else {
                    idsToDelete.push(node.id);
                }
            } else {
                uniqueNodes.set(uniqueKey, { id: node.id, createdAt });
            }
        }

        if (idsToDelete.length === 0) {
            return 0;
        }

        return await this.batchDelete(userId, idsToDelete);
    }

    async getNodeStatuses(userId: string) {
        const results = await this.db.select().from(node_statuses).where(eq(node_statuses.user_id, userId));

        const now = Date.now();
        const TESTING_TIMEOUT = 2 * 60 * 1000;

        return results.map(r => {
            if (r.status === 'testing') {
                const checkedAt = new Date(r.checked_at).getTime();
                if (now - checkedAt > TESTING_TIMEOUT) {
                    return { ...r, status: 'pending', latency: null };
                }
            }
            return r;
        });
    }

    // Health Check Logic
    // This returns a function that can be passed to executionCtx.waitUntil
    getHealthCheckTask(userId: string, nodeIds: string[]) {
        return async () => {
            const BATCH_SIZE = 30;
            const DELAY_BETWEEN_BATCHES = 2000;
            const CONCURRENCY_LIMIT = 10;

            const executeInParallel = async (tasks: (() => Promise<any>)[]) => {
                const executing = new Set<Promise<any>>();
                for (const task of tasks) {
                    const promise = task().finally(() => executing.delete(promise));
                    executing.add(promise);
                    if (executing.size >= CONCURRENCY_LIMIT) {
                        await Promise.race(executing);
                    }
                }
                await Promise.all(executing);
            };

            const testNodeAndSave = async (node: { id: string; server: string; port: number }) => {
                const healthCheckUrl = 'https://www.google.com/generate_204';
                const timeout = 5000;
                let status: 'healthy' | 'unhealthy' = 'unhealthy';
                let latency: number | null = null;

                if (node.server && node.port) {
                    const startTime = Date.now();
                    try {
                        const resp = await fetchWithTimeout(healthCheckUrl, {
                            method: 'HEAD',
                            // @ts-ignore-next-line
                            connect: { hostname: node.server, port: node.port },
                        }, timeout);
                        latency = Date.now() - startTime;
                        if (resp.status >= 200 && resp.status < 400) {
                            status = 'healthy';
                        }
                        if (latency > 5000) {
                            status = 'unhealthy';
                        }
                    } catch (e) { /* Error implies unhealthy */ }
                }

                // const now = new Date().toISOString(); // Already declared outside loop in previous context, but wait, this is inside `getHealthCheckTask`.
                // Actually `getHealthCheckTask` returns an async function.
                // The issue is likely that `now` was declared twice in the same scope due to bad copy-paste or me not seeing the full context.
                // Let's look at the previous chunk. 
                // Line 396 and 397 in previous error...
                // One 'now' was line 391.
                // Ah, in `testNodeAndSave`, `now` is declared.
                // In generic loop, `now` is declared at 391.
                // Then I inserted a block that used `now` but maybe I pasted `const now = ...` again?
                // Let's just fix the usage. `now` at 391 should be enough for the batch update.

                // Oops, I can't see the file content right now to be 100% sure where the duplicate is without scrolling up.
                // But looking at my previous `batch` replacement, I replaced:
                // `const updateStmts = ... bind(id, userId, now, now));`
                // with:
                // `const batch = ... checked_at: now ...`

                // wait, the error says "Unable to redeclare block-scoped variable 'now'." at line 396/397.
                // This implies I have `const now = ...` twice.
                // Let's just use `const checkTime` to be safe/clear.
                const checkTime = new Date().toISOString();
                await this.db.insert(node_statuses).values({
                    node_id: node.id,
                    user_id: userId,
                    status: status,
                    latency: latency,
                    checked_at: checkTime
                }).onConflictDoUpdate({
                    target: [node_statuses.node_id, node_statuses.user_id],
                    set: { status: status, latency: latency, checked_at: checkTime }
                });
            };

            for (let i = 0; i < nodeIds.length; i += BATCH_SIZE) {
                const batchNodeIds = nodeIds.slice(i, i + BATCH_SIZE);
                const now = new Date().toISOString();

                // 1. Set testing status
                const batch = batchNodeIds.map(id =>
                    this.db.insert(node_statuses).values({
                        node_id: id,
                        user_id: userId,
                        status: 'testing',
                        latency: null,
                        checked_at: now
                    }).onConflictDoUpdate({
                        target: [node_statuses.node_id, node_statuses.user_id],
                        set: { status: 'testing', latency: null, checked_at: now }
                    })
                );

                if (batch.length > 0) {
                    await this.db.batch(batch as any);
                }

                // 2. Fetch node info
                const nodesInBatch = await this.db.select({ id: nodes.id, server: nodes.server, port: nodes.port })
                    .from(nodes)
                    .where(and(inArray(nodes.id, batchNodeIds), eq(nodes.user_id, userId)));

                if (!nodesInBatch || nodesInBatch.length === 0) {
                    continue;
                }

                // 3. Test in parallel
                const testTasks = nodesInBatch.map(node => () => testNodeAndSave(node as any));
                await executeInParallel(testTasks);

                // 4. Delay
                if (i + BATCH_SIZE < nodeIds.length) {
                    await new Promise(res => setTimeout(res, DELAY_BETWEEN_BATCHES));
                }
            }
        };
    }
}
