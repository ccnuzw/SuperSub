import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';
import { NodeService } from '../services/nodeService';

import { createErrorResponse } from '../utils/errors';

const nodes = new Hono<{ Bindings: Env }>();

nodes.get('/grouped', manualAuthMiddleware, async (c) => {
    try {
        const user = c.get('jwtPayload');
        const nodeService = new NodeService(c.env);
        const data = await nodeService.getGroupedNodes(user.id);
        return c.json({ success: true, data });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

nodes.get('/', manualAuthMiddleware, async (c) => {
    try {
        const user = c.get('jwtPayload');
        const nodeService = new NodeService(c.env);
        const data = await nodeService.getAllNodes(user.id);
        return c.json({ success: true, data });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

nodes.post('/', manualAuthMiddleware, async (c) => {
    try {
        const user = c.get('jwtPayload');
        const body = await c.req.json<any>();
        const nodeService = new NodeService(c.env);
        const result = await nodeService.createNode(user.id, body);
        return c.json({ success: true, data: result }, 201);
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

nodes.post('/batch-import', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const body = await c.req.json<any>();
    const nodeService = new NodeService(c.env);
    try {
        const count = await nodeService.batchImport(user.id, body);
        return c.json({ success: true, message: `Successfully imported ${count} nodes.` });
    } catch (e: any) {
        return createErrorResponse(e.message, 400);
    }
});

nodes.post('/health-check', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { nodeIds } = await c.req.json<{ nodeIds: string[] }>();

    if (!nodeIds || nodeIds.length === 0) {
        return createErrorResponse('No nodes selected for health check', 400);
    }

    const nodeService = new NodeService(c.env);
    const task = nodeService.getHealthCheckTask(user.id, nodeIds);
    c.executionCtx.waitUntil(task());

    return c.json({ success: true, message: `Health check started for ${nodeIds.length} nodes.` });
});

nodes.post('/batch-update-group', manualAuthMiddleware, async (c) => {
    try {
        const user = c.get('jwtPayload');
        const body = await c.req.json<any>();
        if (!body.nodeIds || body.nodeIds.length === 0) {
            return createErrorResponse('No nodes selected', 400);
        }
        const nodeService = new NodeService(c.env);
        await nodeService.batchUpdateGroup(user.id, body.nodeIds, body.groupId || null);
        return c.json({ success: true, message: 'Nodes moved successfully' });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

nodes.post('/batch-delete', manualAuthMiddleware, async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { ids } = await c.req.json<{ ids: string[] }>();
        if (!ids || ids.length === 0) {
            return createErrorResponse('No nodes selected for deletion', 400);
        }
        const nodeService = new NodeService(c.env);
        const count = await nodeService.batchDelete(user.id, ids);
        return c.json({ success: true, message: `Successfully deleted ${count} nodes.` });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

nodes.post('/batch-actions', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { action, groupId } = await c.req.json<{ action: string; groupId: string }>();
    const nodeService = new NodeService(c.env);

    try {
        let message = '';
        if (action === 'clear') {
            const count = await nodeService.clearNodes(user.id, groupId);
            message = `Successfully cleared ${count} nodes.`;
        } else if (action === 'sort') {
            const count = await nodeService.sortNodes(user.id, groupId);
            message = `Successfully sorted ${count} nodes.`;
        } else if (action === 'deduplicate') {
            const count = await nodeService.deduplicateNodes(user.id, groupId);
            message = `Successfully removed ${count} duplicate nodes.`;
        } else {
            return createErrorResponse('Invalid action', 400);
        }
        return c.json({ success: true, message });
    } catch (error: any) {
        console.error(`Failed to ${action} nodes:`, error);
        return createErrorResponse(`Database error: ${error.message}`, 500);
    }
});

nodes.post('/update-order', manualAuthMiddleware, async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { nodeIds } = await c.req.json<{ nodeIds: string[] }>();
        if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) {
            return createErrorResponse('Invalid node IDs provided', 400);
        }
        const nodeService = new NodeService(c.env);
        await nodeService.updateOrder(user.id, nodeIds);
        return c.json({ success: true, message: 'Node order updated successfully.' });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

nodes.get('/:id', manualAuthMiddleware, async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        const nodeService = new NodeService(c.env);
        const node = await nodeService.getNode(id, user.id);
        if (!node) return createErrorResponse('Node not found', 404);
        return c.json({ success: true, data: node });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

nodes.put('/:id', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const body = await c.req.json<{ name: string; link: string }>();
    const nodeService = new NodeService(c.env);
    try {
        await nodeService.updateNode(id, user.id, body);
        return c.json({ success: true });
    } catch (e: any) {
        if (e.message === 'Node not found') return createErrorResponse(e.message, 404);
        return createErrorResponse(e.message, 400);
    }
});

nodes.delete('/:id', manualAuthMiddleware, async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        const nodeService = new NodeService(c.env);
        await nodeService.deleteNode(id, user.id);
        return c.json({ success: true });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

export default nodes;