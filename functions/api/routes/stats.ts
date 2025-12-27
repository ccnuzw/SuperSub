import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';
import { StatsService } from '../services/statsService';
import { createErrorResponse } from '../utils/errors';

const stats = new Hono<{ Bindings: Env }>();

stats.use('*', manualAuthMiddleware);

stats.get('/', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const service = new StatsService(c.env);
        const data = await service.getUserStats(user.id);
        return c.json({ success: true, data });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

export default stats;
