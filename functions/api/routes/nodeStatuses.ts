import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';
import { NodeService } from '../services/nodeService';
import { createErrorResponse } from '../utils/errors';

const nodeStatuses = new Hono<{ Bindings: Env }>();

nodeStatuses.get('/', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const nodeService = new NodeService(c.env);

    try {
        const data = await nodeService.getNodeStatuses(user.id);
        return c.json({ success: true, data });
    } catch (error: any) {
        console.error('Failed to get node statuses:', error);
        return createErrorResponse(`Database error: ${error.message}`, 500);
    }
});

export default nodeStatuses;
