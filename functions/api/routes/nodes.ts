import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';
import { NodeService } from '../services/nodeService';

import { createErrorResponse } from '../utils/errors';
import { zValidator } from '@hono/zod-validator';
import { nodeSchema, batchImportSchema, idListSchema, batchUpdateGroupSchema, batchActionSchema, updateOrderSchema, updateNodeSchema } from '../schema';

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

nodes.post('/', manualAuthMiddleware, zValidator('json', nodeSchema), async (c) => {
    try {
        const user = c.get('jwtPayload');
        const body = c.req.valid('json');
        const nodeService = new NodeService(c.env);
        const result = await nodeService.createNode(user.id, body);
        return c.json({ success: true, data: result }, 201);
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

nodes.post('/batch-import', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const rawBody = await c.req.json();
    const validation = batchImportSchema.safeParse(rawBody);

    if (!validation.success) {
        console.error('Batch import validation failed:', JSON.stringify(validation.error, null, 2));
        return c.json({ success: false, message: 'Validation failed', errors: validation.error }, 400);
    }

    const body = validation.data;
    const nodeService = new NodeService(c.env);
    const normalizedBody = {
        ...body,
        groupId: body.groupId === null ? undefined : body.groupId
    };
    try {
        const count = await nodeService.batchImport(user.id, normalizedBody);
        return c.json({ success: true, message: `Successfully imported ${count} nodes.` });
    } catch (e: any) {
        console.error('Batch import failed:', e);
        return createErrorResponse(e.message, 400);
    }
});

nodes.post('/check-health', manualAuthMiddleware, zValidator('json', idListSchema), async (c) => {
    const user = c.get('jwtPayload');
    const { ids } = c.req.valid('json');

    const nodeService = new NodeService(c.env);
    const task = nodeService.getHealthCheckTask(user.id, ids);
    c.executionCtx.waitUntil(task());

    return c.json({ success: true, message: `Health check started for ${ids.length} nodes.` });
});

nodes.post('/batch-update-group', manualAuthMiddleware, zValidator('json', batchUpdateGroupSchema), async (c) => {
    try {
        const user = c.get('jwtPayload');
        const body = c.req.valid('json');
        const nodeService = new NodeService(c.env);
        await nodeService.batchUpdateGroup(user.id, body.nodeIds, body.groupId || null);
        return c.json({ success: true, message: 'Nodes moved successfully' });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

nodes.post('/batch-delete', manualAuthMiddleware, zValidator('json', idListSchema), async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { ids } = c.req.valid('json');
        const nodeService = new NodeService(c.env);
        const count = await nodeService.batchDelete(user.id, ids);
        return c.json({ success: true, message: `Successfully deleted ${count} nodes.` });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

nodes.post('/batch-actions', manualAuthMiddleware, zValidator('json', batchActionSchema), async (c) => {
    const user = c.get('jwtPayload');
    const { action, groupId } = c.req.valid('json');
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

nodes.post('/update-order', manualAuthMiddleware, zValidator('json', updateOrderSchema), async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { nodeIds } = c.req.valid('json');
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

nodes.put('/:id', manualAuthMiddleware, zValidator('json', updateNodeSchema), async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const body = c.req.valid('json');
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