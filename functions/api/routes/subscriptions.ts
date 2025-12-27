import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';
import { SubscriptionService } from '../services/subscriptionService';

import { createErrorResponse } from '../utils/errors';

const subscriptions = new Hono<{ Bindings: Env }>();
subscriptions.use('*', manualAuthMiddleware);

subscriptions.get('/', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const service = new SubscriptionService(c.env);
        const data = await service.getSubscriptions(user.id);
        return c.json({ success: true, data });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.get('/for-select', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const service = new SubscriptionService(c.env);
        const results = await service.getSubscriptionSelectors(user.id);
        return c.json({ success: true, data: results });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.get('/grouped', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const service = new SubscriptionService(c.env);
        const data = await service.getGroupedSubscriptions(user.id);
        return c.json({ success: true, data });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.post('/', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const body = await c.req.json<any>();
        const service = new SubscriptionService(c.env);
        const result = await service.createSubscription(user.id, body);
        return c.json({ success: true, data: result }, 201);
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.post('/batch-import', async (c) => {
    const user = c.get('jwtPayload');
    const { subscriptions: subs, groupId } = await c.req.json<{ subscriptions: any[], groupId?: string }>();
    const service = new SubscriptionService(c.env);
    try {
        const count = await service.batchImport(user.id, subs, groupId);
        return c.json({ success: true, data: { message: `Successfully imported ${count} subscriptions.` } });
    } catch (e: any) {
        return createErrorResponse(e.message, 400);
    }
});

subscriptions.post('/update-all', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const service = new SubscriptionService(c.env);
        const { updatedCount, failedCount } = await service.updateAllSubscriptions(user.id);
        return c.json({ success: true, message: `Update complete. ${updatedCount} succeeded, ${failedCount} failed.` });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.post('/preview', async (c) => {
    const user = c.get('jwtPayload');
    const { url, subscription_id, apply_rules } = await c.req.json<{ url: string, subscription_id?: string, apply_rules?: boolean }>();

    if (!url) {
        return createErrorResponse('Missing subscription URL', 400);
    }

    const service = new SubscriptionService(c.env);
    try {
        const data = await service.previewSubscription(url, user.id, subscription_id, apply_rules);
        return c.json({ success: true, data });
    } catch (error: any) {
        console.error(`Error fetching/parsing subscription from ${url}:`, error);
        const errorMessage = error.cause?.message?.includes('ECONNRESET') || error.message?.includes('Network connection lost')
            ? '获取订阅超时或网络连接失败'
            : `处理订阅时出错: ${error.message}`;
        return createErrorResponse(errorMessage, 500);
    }
});

subscriptions.post('/:id/update', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        const service = new SubscriptionService(c.env);

        const subscription = await service.getSubscriptionById(id, user.id);
        if (!subscription) {
            return createErrorResponse('Subscription not found', 404);
        }

        const result = await service.updateSingleSubscription(subscription);

        if (!result.success) {
            return c.json({ success: false, message: result.error, data: result.data }); // Keep original structure for now as frontend might depend on data
        }
        return c.json({ success: true, message: `Subscription updated successfully.`, data: result.data });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.get('/:id/rules', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        const service = new SubscriptionService(c.env);
        const data = await service.getSubscriptionRules(id, user.id);
        return c.json({ success: true, data });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.post('/:id/rules', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id: subscription_id } = c.req.param();
        const body = await c.req.json<any>();
        const service = new SubscriptionService(c.env);
        await service.createSubscriptionRule(subscription_id, user.id, body);
        return c.json({ success: true }, 201);
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.put('/:id/rules/:ruleId', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { ruleId } = c.req.param();
        const body = await c.req.json<any>();
        const service = new SubscriptionService(c.env);
        await service.updateSubscriptionRule(ruleId, user.id, body);
        return c.json({ success: true });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.delete('/:id/rules/:ruleId', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { ruleId } = c.req.param();
        const service = new SubscriptionService(c.env);
        await service.deleteSubscriptionRule(ruleId, user.id);
        return c.json({ success: true });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.put('/:id', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        const body = await c.req.json<any>();
        const service = new SubscriptionService(c.env);
        await service.updateSubscription(id, user.id, body);
        return c.json({ success: true });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.delete('/:id', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        const service = new SubscriptionService(c.env);
        await service.deleteSubscription(id, user.id);
        return c.json({ success: true });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.post('/batch-delete', async (c) => {
    const user = c.get('jwtPayload');
    const { ids } = await c.req.json<{ ids: string[] }>();
    const service = new SubscriptionService(c.env);
    try {
        const count = await service.batchDelete(user.id, ids);
        return c.json({ success: true, message: `Successfully deleted ${count} subscriptions.` });
    } catch (e: any) {
        return createErrorResponse(e.message, 400);
    }
});

subscriptions.post('/clear-all', async (c) => {
    const user = c.get('jwtPayload');
    const service = new SubscriptionService(c.env);
    try {
        const count = await service.clearAllSubscriptions(user.id);
        return c.json({ success: true, message: `Successfully cleared ${count} subscriptions.` });
    } catch (e: any) {
        return createErrorResponse('Failed to clear subscriptions.', 500);
    }
});

subscriptions.post('/clear-by-group', async (c) => {
    const user = c.get('jwtPayload');
    const { groupId } = await c.req.json<{ groupId: string | null }>();
    const service = new SubscriptionService(c.env);
    try {
        const count = await service.clearSubscriptionsByGroup(user.id, groupId);
        return c.json({ success: true, message: `Successfully cleared ${count} subscriptions in this group.` });
    } catch (e: any) {
        return createErrorResponse('Failed to clear subscriptions.', 500);
    }
});



subscriptions.post('/batch-update-group', async (c) => {
    const user = c.get('jwtPayload');
    const { subscriptionIds, groupId } = await c.req.json<{ subscriptionIds: string[], groupId: string | null }>();
    const service = new SubscriptionService(c.env);
    try {
        await service.batchUpdateGroup(user.id, subscriptionIds, groupId);
        return c.json({ success: true, message: 'Subscriptions moved successfully.' });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.post('/batch-update-urls', async (c) => {
    const user = c.get('jwtPayload');
    const { updates } = await c.req.json<{ updates: { id: string; url: string }[] }>();
    const service = new SubscriptionService(c.env);
    try {
        await service.batchUpdateUrls(user.id, updates);
        return c.json({ success: true, message: 'Subscription URLs updated successfully.' });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

subscriptions.post('/clear-failed', async (c) => {
    const user = c.get('jwtPayload');
    const { groupId } = await c.req.json<{ groupId: string | null | 'all' }>();
    const service = new SubscriptionService(c.env);
    try {
        const count = await service.clearFailed(user.id, groupId);
        return c.json({ success: true, message: `Successfully cleared ${count} failed subscriptions.` });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

export default subscriptions;