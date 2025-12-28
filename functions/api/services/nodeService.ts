import { fetchWithTimeout } from '../utils/network';
import type { Env } from '../utils/types';
import { createInClause } from '../utils/db';
import { parseNodeLinks, ParsedNode, regenerateLink } from '../../../src/utils/nodeParser';

type Node = {
    id: string;
    user_id: string;
    group_id?: string | null;
    name: string;
    link: string;
    protocol: string;
    protocol_params?: string;
    server?: string;
    port?: number;
    type?: string;
    sort_order?: number;
    created_at: string;
    updated_at: string;
};

export class NodeService {
    private db: D1Database;

    constructor(env: Env) {
        this.db = env.DB;
    }

    async getGroupedNodes(userId: string) {
        const [nodesResponse, groupsResponse] = await Promise.all([
            this.db.prepare('SELECT id, name, group_id FROM nodes WHERE user_id = ? ORDER BY name ASC').bind(userId).all<{ id: string; name: string; group_id: string | null }>(),
            this.db.prepare('SELECT id, name FROM node_groups WHERE user_id = ? ORDER BY sort_order ASC').bind(userId).all<{ id: string; name: string }>()
        ]);

        const allNodes = nodesResponse.results;
        const allGroups = groupsResponse.results;

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
        const { results } = await this.db.prepare('SELECT * FROM nodes WHERE user_id = ? ORDER BY sort_order ASC').bind(userId).all();
        return results;
    }

    async getNode(id: string, userId: string) {
        return await this.db.prepare('SELECT * FROM nodes WHERE id = ? AND user_id = ?').bind(id, userId).first();
    }

    async createNode(userId: string, body: any) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.prepare(
            `INSERT INTO nodes (id, user_id, name, link, protocol, protocol_params, server, port, type, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, userId, body.name, body.link, body.protocol, JSON.stringify(body.protocol_params), body.protocol_params?.add || '', Number(body.protocol_params?.port || 0), body.protocol, now, now).run();
        return { id };
    }

    async updateNode(id: string, userId: string, body: { name: string; link: string }) {
        const now = new Date().toISOString();
        const existingNode = await this.db.prepare('SELECT link, name FROM nodes WHERE id = ? AND user_id = ?').bind(id, userId).first<{ link: string, name: string }>();

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

            await this.db.prepare(
                `UPDATE nodes
                 SET name = ?, link = ?, protocol = ?, protocol_params = ?, server = ?, port = ?, type = ?, updated_at = ?
                 WHERE id = ? AND user_id = ?`
            ).bind(
                body.name,
                regeneratedLink,
                parsedNode.protocol,
                JSON.stringify(parsedNode.protocol_params),
                parsedNode.server,
                parsedNode.port,
                parsedNode.protocol,
                now,
                id,
                userId
            ).run();
        }
    }

    async deleteNode(id: string, userId: string) {
        await this.db.prepare('DELETE FROM nodes WHERE id = ? AND user_id = ?').bind(id, userId).run();
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

        const stmts = nodesToImport.map(node => {
            const id = crypto.randomUUID();
            const protocol = node.protocol || 'unknown';
            const name = node.name || 'Unknown Node';
            const server = node.server || '';
            const port = node.port || 0;
            const link = regenerateLink(node);

            return this.db.prepare(
                `INSERT INTO nodes (id, user_id, group_id, name, link, protocol, protocol_params, server, port, type, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(id, userId, groupId, name, link, protocol, JSON.stringify(node.protocol_params || {}), server, port, protocol, now, now);
        });

        if (stmts.length > 0) {
            await this.db.batch(stmts);
        }
        return stmts.length;
    }

    async batchUpdateGroup(userId: string, nodeIds: string[], groupId: string | null) {
        const now = new Date().toISOString();
        const placeholders = createInClause(nodeIds.length);

        await this.db.prepare(
            `UPDATE nodes
             SET group_id = ?, updated_at = ?
             WHERE id IN (${placeholders}) AND user_id = ?`
        ).bind(groupId, now, ...nodeIds, userId).run();
    }

    async batchDelete(userId: string, ids: string[]) {
        const CHUNK_SIZE = 50;
        let totalDeleted = 0;
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            const chunk = ids.slice(i, i + CHUNK_SIZE);
            const placeholders = createInClause(chunk.length);
            const query = `DELETE FROM nodes WHERE id IN (${placeholders}) AND user_id = ?`;
            const bindings = [...chunk, userId];
            const { meta: { changes } } = await this.db.prepare(query).bind(...bindings).run();
            totalDeleted += changes || 0;
        }
        return totalDeleted;
    }

    async updateOrder(userId: string, nodeIds: string[]) {
        const stmts = nodeIds.map((id, index) => {
            return this.db.prepare(
                'UPDATE nodes SET sort_order = ? WHERE id = ? AND user_id = ?'
            ).bind(index, id, userId);
        });

        if (stmts.length > 0) {
            await this.db.batch(stmts);
        }
    }

    // Advanced Batch Actions
    async clearNodes(userId: string, groupId: string) {
        let idQuery;
        if (groupId === 'all') {
            idQuery = this.db.prepare('SELECT id FROM nodes WHERE user_id = ?').bind(userId);
        } else if (groupId === 'ungrouped') {
            idQuery = this.db.prepare('SELECT id FROM nodes WHERE user_id = ? AND group_id IS NULL').bind(userId);
        } else {
            idQuery = this.db.prepare('SELECT id FROM nodes WHERE user_id = ? AND group_id = ?').bind(userId, groupId);
        }

        const { results: nodesToClear } = await idQuery.all<{ id: string }>();

        if (!nodesToClear || nodesToClear.length === 0) {
            return 0;
        }

        const idsToDelete = nodesToClear.map(n => n.id);
        return await this.batchDelete(userId, idsToDelete);
    }

    async sortNodes(userId: string, groupId: string) {
        let nodesQuery;
        const baseQuery = `
            SELECT n.id, ns.status, ns.latency
            FROM nodes n
            LEFT JOIN node_statuses ns ON n.id = ns.node_id AND n.user_id = ns.user_id
            WHERE n.user_id = ?
        `;

        if (groupId === 'all') {
            nodesQuery = this.db.prepare(baseQuery).bind(userId);
        } else if (groupId === 'ungrouped') {
            nodesQuery = this.db.prepare(`${baseQuery} AND n.group_id IS NULL`).bind(userId);
        } else {
            nodesQuery = this.db.prepare(`${baseQuery} AND n.group_id = ?`).bind(userId, groupId);
        }

        const { results: nodesToSort } = await nodesQuery.all<{ id: string; status: string | null; latency: number | null }>();

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

        const updateStmts = nodesToSort.map((node, index) =>
            this.db.prepare('UPDATE nodes SET sort_order = ? WHERE id = ? AND user_id = ?')
                .bind(index, node.id, userId)
        );

        if (updateStmts.length > 0) {
            await this.db.batch(updateStmts);
        }

        return nodesToSort.length;
    }

    async deduplicateNodes(userId: string, groupId: string) {
        let nodesQuery;
        const baseQuery = 'SELECT id, server, port, protocol, created_at FROM nodes WHERE user_id = ?';

        if (groupId === 'all') {
            nodesQuery = this.db.prepare(baseQuery).bind(userId);
        } else if (groupId === 'ungrouped') {
            nodesQuery = this.db.prepare(`${baseQuery} AND group_id IS NULL`).bind(userId);
        } else {
            nodesQuery = this.db.prepare(`${baseQuery} AND group_id = ?`).bind(userId, groupId);
        }

        const { results: nodesToDeduplicate } = await nodesQuery.all<{ id: string; server: string; port: number; protocol: string; created_at: string }>();

        if (!nodesToDeduplicate || nodesToDeduplicate.length < 2) {
            return 0;
        }

        const uniqueNodes = new Map<string, { id: string; createdAt: Date }>();
        const idsToDelete: string[] = [];

        for (const node of nodesToDeduplicate) {
            const uniqueKey = `${node.server}:${node.port}:${node.protocol}`;
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
        const { results } = await this.db.prepare('SELECT * FROM node_statuses WHERE user_id = ?').bind(userId).all<any>();

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

                const now = new Date().toISOString();
                await this.db.prepare(
                    `INSERT INTO node_statuses (node_id, user_id, status, latency, checked_at)
                     VALUES (?, ?, ?, ?, ?)
                     ON CONFLICT(node_id, user_id) DO UPDATE SET
                     status = excluded.status,
                     latency = excluded.latency,
                     checked_at = excluded.checked_at`
                ).bind(node.id, userId, status, latency, now).run();
            };

            for (let i = 0; i < nodeIds.length; i += BATCH_SIZE) {
                const batchNodeIds = nodeIds.slice(i, i + BATCH_SIZE);
                const now = new Date().toISOString();

                // 1. Set testing status
                const updateStmts = batchNodeIds.map(id => this.db.prepare(
                    `INSERT INTO node_statuses (node_id, user_id, status, latency, checked_at)
                     VALUES (?, ?, 'testing', NULL, ?)
                     ON CONFLICT(node_id, user_id) DO UPDATE SET status = 'testing', latency = NULL, checked_at = ?`
                ).bind(id, userId, now, now));

                for (const stmt of updateStmts) {
                    await stmt.run();
                }

                // 2. Fetch node info
                const placeholders = createInClause(batchNodeIds.length);
                const nodesInBatch = await this.db.prepare(
                    `SELECT id, server, port FROM nodes WHERE id IN (${placeholders}) AND user_id = ?`
                ).bind(...batchNodeIds, userId).all<{ id: string; server: string; port: number }>();

                if (!nodesInBatch.results || nodesInBatch.results.length === 0) {
                    continue;
                }

                // 3. Test in parallel
                const testTasks = nodesInBatch.results.map(node => () => testNodeAndSave(node));
                await executeInParallel(testTasks);

                // 4. Delay
                if (i + BATCH_SIZE < nodeIds.length) {
                    await new Promise(res => setTimeout(res, DELAY_BETWEEN_BATCHES));
                }
            }
        };
    }
}
