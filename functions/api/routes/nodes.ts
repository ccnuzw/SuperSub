import { Hono } from 'hono';
import { fetchWithTimeout } from '../utils/network';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';
import { parseNodeLinks, ParsedNode, regenerateLink } from '../../../src/utils/nodeParser';


const nodes = new Hono<{ Bindings: Env }>();

nodes.get('/grouped', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    
    const [nodesResponse, groupsResponse] = await Promise.all([
        c.env.DB.prepare('SELECT id, name, group_id FROM nodes WHERE user_id = ? ORDER BY name ASC').bind(user.id).all<{ id: string; name: string; group_id: string | null }>(),
        c.env.DB.prepare('SELECT id, name FROM node_groups WHERE user_id = ? ORDER BY sort_order ASC').bind(user.id).all<{ id: string; name: string }>()
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

    const responseData = {
        ...groupedNodes,
        ...(ungroupedNodes.length > 0 ? { '未分组': ungroupedNodes } : {})
    };

    return c.json({ success: true, data: responseData });
});

nodes.get('/', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { results } = await c.env.DB.prepare('SELECT * FROM nodes WHERE user_id = ? ORDER BY sort_order ASC').bind(user.id).all();
    return c.json({ success: true, data: results });
});

nodes.post('/', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const body = await c.req.json<any>();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await c.env.DB.prepare(
        `INSERT INTO nodes (id, user_id, name, link, protocol, protocol_params, server, port, type, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, user.id, body.name, body.link, body.protocol, JSON.stringify(body.protocol_params), body.protocol_params?.add || '', Number(body.protocol_params?.port || 0), body.protocol, now, now).run();
    return c.json({ success: true, data: { id } }, 201);
});

nodes.post('/batch-import', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const body = await c.req.json<{ links?: string | string[]; nodes?: ParsedNode[]; groupId?: string }>();

    let nodesToImport: ParsedNode[] = [];

    if (body.nodes && Array.isArray(body.nodes)) {
        nodesToImport = body.nodes;
    } else if (body.links) {
        // Handle both string (newline-separated) and array formats
        const linksText = Array.isArray(body.links)
            ? body.links.join('\n')  // Convert array to newline-separated string
            : body.links;             // Already a string
        nodesToImport = parseNodeLinks(linksText);
    }

    if (nodesToImport.length === 0) {
        return c.json({ success: false, message: 'No valid nodes to import' }, 400);
    }

    const now = new Date().toISOString();
    const groupId = body.groupId || null;

    const stmts = nodesToImport.map(node => {
        const id = crypto.randomUUID();
        const protocol = node.protocol || 'unknown';
        const name = node.name || 'Unknown Node';
        const server = node.server || '';
        const port = node.port || 0;
        // Regenerate the link to ensure it's in a standard format before saving.
        const link = regenerateLink(node);

        return c.env.DB.prepare(
            `INSERT INTO nodes (id, user_id, group_id, name, link, protocol, protocol_params, server, port, type, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, user.id, groupId, name, link, protocol, JSON.stringify(node.protocol_params || {}), server, port, protocol, now, now);
    });

    if (stmts.length > 0) {
        await c.env.DB.batch(stmts);
    }

    return c.json({ success: true, message: `Successfully imported ${stmts.length} nodes.`, data: { nodes: nodesToImport } });
});

nodes.post('/health-check', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { nodeIds } = await c.req.json<{ nodeIds: string[] }>();

    if (!nodeIds || nodeIds.length === 0) {
        return c.json({ success: false, message: 'No nodes selected for health check' }, 400);
    }

    const runHealthChecks = async () => {
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
                    // New requirement: if latency > 5000ms, it's also unhealthy.
                    if (latency > 5000) {
                        status = 'unhealthy';
                    }
                } catch (e) { /* Error implies unhealthy */ }
            }
            
            const now = new Date().toISOString();
            await c.env.DB.prepare(
                `INSERT INTO node_statuses (node_id, user_id, status, latency, checked_at)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(node_id, user_id) DO UPDATE SET
                 status = excluded.status,
                 latency = excluded.latency,
                 checked_at = excluded.checked_at`
            ).bind(node.id, user.id, status, latency, now).run();
        };

        const BATCH_SIZE = 30; // Process 30 nodes at a time
        const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds
        const CONCURRENCY_LIMIT = 10; // Test 10 nodes concurrently within a batch

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

        // Process nodes in batches of 30
        for (let i = 0; i < nodeIds.length; i += BATCH_SIZE) {
            const batchNodeIds = nodeIds.slice(i, i + BATCH_SIZE);

            // 1. Set current batch to 'testing'
            const now = new Date().toISOString();
            const updateStmts = batchNodeIds.map(id => c.env.DB.prepare(
                `INSERT INTO node_statuses (node_id, user_id, status, latency, checked_at)
                 VALUES (?, ?, 'testing', NULL, ?)
                 ON CONFLICT(node_id, user_id) DO UPDATE SET status = 'testing', latency = NULL, checked_at = ?`
            ).bind(id, user.id, now, now));
            
            for (const stmt of updateStmts) {
                await stmt.run();
            }

            // 2. Fetch node info for the current batch
            const placeholders = batchNodeIds.map(() => '?').join(',');
            const nodesInBatch = await c.env.DB.prepare(
                `SELECT id, server, port FROM nodes WHERE id IN (${placeholders}) AND user_id = ?`
            ).bind(...batchNodeIds, user.id).all<{ id: string; server: string; port: number }>();

            if (!nodesInBatch.results || nodesInBatch.results.length === 0) {
                continue; // Skip if no valid nodes found in this batch
            }

            // 3. Execute tests for the current batch with concurrency control
            const testTasks = nodesInBatch.results.map(node => () => testNodeAndSave(node));
            await executeInParallel(testTasks);

            // 4. Wait for 2 seconds before starting the next batch (if it's not the last one)
            if (i + BATCH_SIZE < nodeIds.length) {
                await new Promise(res => setTimeout(res, DELAY_BETWEEN_BATCHES));
            }
        }
    };

    c.executionCtx.waitUntil(runHealthChecks());

    return c.json({ success: true, message: `Health check started for ${nodeIds.length} nodes.` });
});

nodes.post('/batch-update-group', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const body = await c.req.json<{ nodeIds?: string[]; groupId?: string | null }>();

    if (!body.nodeIds || body.nodeIds.length === 0) {
        return c.json({ success: false, message: 'No nodes selected' }, 400);
    }

    const now = new Date().toISOString();
    const groupId = body.groupId || null;

    // D1's `in` operator doesn't work well with `?` binding for arrays.
    // We need to create the placeholders manually.
    const placeholders = body.nodeIds.map(() => '?').join(',');

    await c.env.DB.prepare(
        `UPDATE nodes
         SET group_id = ?, updated_at = ?
         WHERE id IN (${placeholders}) AND user_id = ?`
    ).bind(groupId, now, ...body.nodeIds, user.id).run();

    return c.json({ success: true, message: 'Nodes moved successfully' });
});

nodes.post('/batch-delete', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { ids } = await c.req.json<{ ids: string[] }>();
    const CHUNK_SIZE = 50;

    if (!ids || ids.length === 0) {
        return c.json({ success: false, message: 'No nodes selected for deletion' }, 400);
    }

    try {
        let totalDeleted = 0;
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            const chunk = ids.slice(i, i + CHUNK_SIZE);
            const placeholders = chunk.map(() => '?').join(',');
            const query = `DELETE FROM nodes WHERE id IN (${placeholders}) AND user_id = ?`;
            const bindings = [...chunk, user.id];
            const { meta: { changes } } = await c.env.DB.prepare(query).bind(...bindings).run();
            totalDeleted += changes || 0;
        }
        return c.json({ success: true, message: `Successfully deleted ${totalDeleted} nodes.` });
    } catch (error: any) {
        console.error('Failed to batch delete nodes:', error);
        return c.json({ success: false, message: `Database error: ${error.message}` }, 500);
    }
});

nodes.post('/batch-actions', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { action, groupId } = await c.req.json<{ action: string; groupId: string }>();
    const CHUNK_SIZE = 50;

    if (action === 'clear') {
        try {
            let idQuery;
            if (groupId === 'all') {
                idQuery = c.env.DB.prepare('SELECT id FROM nodes WHERE user_id = ?').bind(user.id);
            } else if (groupId === 'ungrouped') {
                idQuery = c.env.DB.prepare('SELECT id FROM nodes WHERE user_id = ? AND group_id IS NULL').bind(user.id);
            } else {
                idQuery = c.env.DB.prepare('SELECT id FROM nodes WHERE user_id = ? AND group_id = ?').bind(user.id, groupId);
            }

            const { results: nodesToClear } = await idQuery.all<{ id: string }>();

            if (!nodesToClear || nodesToClear.length === 0) {
                return c.json({ success: true, message: 'No nodes to clear.' });
            }

            const idsToDelete = nodesToClear.map(n => n.id);
            let totalDeleted = 0;

            for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
                const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
                const placeholders = chunk.map(() => '?').join(',');
                const deleteQuery = `DELETE FROM nodes WHERE id IN (${placeholders}) AND user_id = ?`;
                const bindings = [...chunk, user.id];
                const { meta: { changes } } = await c.env.DB.prepare(deleteQuery).bind(...bindings).run();
                totalDeleted += changes || 0;
            }

            return c.json({ success: true, message: `Successfully cleared ${totalDeleted} nodes.` });
        } catch (error: any) {
            console.error('Failed to clear nodes:', error);
            return c.json({ success: false, message: `Database error: ${error.message}` }, 500);
        }
    } else if (action === 'sort') {
        try {
            // 1. Get all relevant nodes with their statuses
            let nodesQuery;
            const baseQuery = `
                SELECT n.id, ns.status, ns.latency
                FROM nodes n
                LEFT JOIN node_statuses ns ON n.id = ns.node_id AND n.user_id = ns.user_id
                WHERE n.user_id = ?
            `;

            if (groupId === 'all') {
                nodesQuery = c.env.DB.prepare(baseQuery).bind(user.id);
            } else if (groupId === 'ungrouped') {
                nodesQuery = c.env.DB.prepare(`${baseQuery} AND n.group_id IS NULL`).bind(user.id);
            } else {
                nodesQuery = c.env.DB.prepare(`${baseQuery} AND n.group_id = ?`).bind(user.id, groupId);
            }

            const { results: nodesToSort } = await nodesQuery.all<{ id: string; status: string | null; latency: number | null }>();

            if (!nodesToSort || nodesToSort.length === 0) {
                return c.json({ success: true, message: 'No nodes to sort.' });
            }

            // 2. Sort the nodes
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

                const aLatency = a.latency ?? Infinity;
                const bLatency = b.latency ?? Infinity;

                return aLatency - bLatency;
            });

            // 3. Create batch update statements for sort_order
            const updateStmts = nodesToSort.map((node, index) =>
                c.env.DB.prepare('UPDATE nodes SET sort_order = ? WHERE id = ? AND user_id = ?')
                  .bind(index, node.id, user.id)
            );

            // 4. Execute batch update
            if (updateStmts.length > 0) {
                await c.env.DB.batch(updateStmts);
            }

            return c.json({ success: true, message: `Successfully sorted ${nodesToSort.length} nodes.` });
        } catch (error: any) {
            console.error('Failed to sort nodes:', error);
            return c.json({ success: false, message: `Database error: ${error.message}` }, 500);
        }
    } else if (action === 'deduplicate') {
        try {
            // 1. Get all relevant nodes
            let nodesQuery;
            const baseQuery = 'SELECT id, server, port, protocol, created_at FROM nodes WHERE user_id = ?';

            if (groupId === 'all') {
                nodesQuery = c.env.DB.prepare(baseQuery).bind(user.id);
            } else if (groupId === 'ungrouped') {
                nodesQuery = c.env.DB.prepare(`${baseQuery} AND group_id IS NULL`).bind(user.id);
            } else {
                nodesQuery = c.env.DB.prepare(`${baseQuery} AND group_id = ?`).bind(user.id, groupId);
            }

            const { results: nodesToDeduplicate } = await nodesQuery.all<{ id: string; server: string; port: number; protocol: string; created_at: string }>();

            if (!nodesToDeduplicate || nodesToDeduplicate.length < 2) {
                return c.json({ success: true, message: 'No duplicates found.' });
            }

            // 2. Identify duplicates in-memory
            const uniqueNodes = new Map<string, { id: string; createdAt: Date }>();
            const idsToDelete: string[] = [];

            for (const node of nodesToDeduplicate) {
                // A simple unique key. For more complex scenarios, you might need to hash protocol_params.
                const uniqueKey = `${node.server}:${node.port}:${node.protocol}`;
                const createdAt = new Date(node.created_at);

                if (uniqueNodes.has(uniqueKey)) {
                    const existingNode = uniqueNodes.get(uniqueKey)!;
                    // Keep the newest node, delete the older one
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
                return c.json({ success: true, message: 'No duplicates found.' });
            }

            // 3. Batch delete the identified duplicates
            let totalDeleted = 0;
            for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
                const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
                const placeholders = chunk.map(() => '?').join(',');
                const deleteQuery = `DELETE FROM nodes WHERE id IN (${placeholders}) AND user_id = ?`;
                const bindings = [...chunk, user.id];
                const { meta: { changes } } = await c.env.DB.prepare(deleteQuery).bind(...bindings).run();
                totalDeleted += changes || 0;
            }

            return c.json({ success: true, message: `Successfully removed ${totalDeleted} duplicate nodes.` });

        } catch (error: any) {
            console.error('Failed to deduplicate nodes:', error);
            return c.json({ success: false, message: `Database error: ${error.message}` }, 500);
        }
    } else {
        return c.json({ success: false, message: 'Invalid action' }, 400);
    }
});

nodes.post('/update-order', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { nodeIds } = await c.req.json<{ nodeIds: string[] }>();

    if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) {
        return c.json({ success: false, message: 'Invalid node IDs provided' }, 400);
    }

    try {
        const stmts = nodeIds.map((id, index) => {
            return c.env.DB.prepare(
                'UPDATE nodes SET sort_order = ? WHERE id = ? AND user_id = ?'
            ).bind(index, id, user.id);
        });

        if (stmts.length > 0) {
            await c.env.DB.batch(stmts);
        }

        return c.json({ success: true, message: 'Node order updated successfully.' });
    } catch (error: any) {
        console.error('Failed to update node order:', error);
        return c.json({ success: false, message: `Database error: ${error.message}` }, 500);
    }
});

nodes.get('/:id', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const node = await c.env.DB.prepare('SELECT * FROM nodes WHERE id = ? AND user_id = ?').bind(id, user.id).first();
    if (!node) return c.json({ success: false, message: 'Node not found' }, 404);
    return c.json({ success: true, data: node });
});

nodes.put('/:id', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const body = await c.req.json<{ name: string; link: string }>();
    const now = new Date().toISOString();

    const existingNode = await c.env.DB.prepare('SELECT link, name FROM nodes WHERE id = ? AND user_id = ?').bind(id, user.id).first<{ link: string, name: string }>();

    if (!existingNode) {
        return c.json({ success: false, message: 'Node not found' }, 404);
    }

    // If link or name has changed, we need to re-parse and regenerate the link.
    if (existingNode.link !== body.link || existingNode.name !== body.name) {
        const parsedNodes = parseNodeLinks(body.link);
        if (parsedNodes.length === 0) {
            return c.json({ success: false, message: 'Invalid node link provided' }, 400);
        }
        if (parsedNodes.length > 1) {
            return c.json({ success: false, message: 'Editing with multiple node links is not supported' }, 400);
        }
        
        // The parsed node may have a different name, but we respect the name from the form.
        const parsedNode = parsedNodes[0];
        parsedNode.name = body.name;

        // Regenerate the link with the potentially new name to ensure the hash part is updated.
        const regeneratedLink = regenerateLink(parsedNode);
        
        await c.env.DB.prepare(
            `UPDATE nodes
             SET name = ?, link = ?, protocol = ?, protocol_params = ?, server = ?, port = ?, type = ?, updated_at = ?
             WHERE id = ? AND user_id = ?`
        ).bind(
            body.name, // Use the name from the body
            regeneratedLink, // Use the newly regenerated link
            parsedNode.protocol,
            JSON.stringify(parsedNode.protocol_params),
            parsedNode.server,
            parsedNode.port,
            parsedNode.protocol,
            now,
            id,
            user.id
        ).run();
    }
    // No need for an else block, if nothing changed, we do nothing.
    // If only the name changed, the above block handles it correctly.

    return c.json({ success: true });
});

nodes.delete('/:id', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    await c.env.DB.prepare('DELETE FROM nodes WHERE id = ? AND user_id = ?').bind(id, user.id).run();
    return c.json({ success: true });
});

export default nodes;