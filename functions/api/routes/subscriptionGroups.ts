import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';
import { createErrorResponse } from '../utils/errors';
import { SubscriptionGroupService } from '../services/subscriptionGroupService';

const subscriptionGroups = new Hono<{ Bindings: Env }>();

// GET /api/subscription-groups - 获取所有订阅分组
subscriptionGroups.get('/', manualAuthMiddleware, async (c) => {
    try {
        const user = c.get('jwtPayload');
        const service = new SubscriptionGroupService(c.env);
        const results = await service.getGroups(user.id);
        return c.json({ success: true, data: results });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

// POST /api/subscription-groups - 创建新分组
subscriptionGroups.post('/', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { name, description } = await c.req.json<{ name: string, description?: string }>();

    if (!name || name.trim().length === 0) {
        return createErrorResponse('分组名称不能为空', 400);
    }

    try {
        const service = new SubscriptionGroupService(c.env);
        const newGroup = await service.createGroup(user.id, name, description);
        return c.json({ success: true, data: newGroup }, 201);
    } catch (e: any) {
        if (e.message?.includes('UNIQUE constraint failed')) {
            return createErrorResponse('该分组名称已存在', 409);
        }
        return createErrorResponse('创建失败，请稍后重试', 500);
    }
});

// PUT /api/subscription-groups/:id - 重命名分组
subscriptionGroups.put('/:id', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const { name, description } = await c.req.json<{ name?: string, description?: string }>();

    try {
        const service = new SubscriptionGroupService(c.env);
        const success = await service.updateGroup(user.id, id, { name, description });

        if (!success) {
            return createErrorResponse('分组不存在或无权修改', 404);
        }
        return c.json({ success: true });
    } catch (e: any) {
        if (e.message?.includes('UNIQUE constraint failed')) {
            return createErrorResponse('该分组名称已存在', 409);
        }
        return createErrorResponse('更新失败，请稍后重试', 500);
    }
});

// --- Group Rules CRUD ---

// GET /api/subscription-groups/:id/rules - 获取分组规则
subscriptionGroups.get('/:id/rules', manualAuthMiddleware, async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        const service = new SubscriptionGroupService(c.env);
        const results = await service.getGroupRules(user.id, id);
        return c.json({ success: true, data: results });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

// POST /api/subscription-groups/:id/rules - 创建分组规则
subscriptionGroups.post('/:id/rules', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id: group_id } = c.req.param();
    const { name, type, value, enabled } = await c.req.json<any>();

    if (!name || !type || !value) {
        return createErrorResponse('缺少必要参数', 400);
    }

    try {
        const service = new SubscriptionGroupService(c.env);
        await service.createGroupRule(user.id, group_id, { name, type, value, enabled });
        return c.json({ success: true }, 201);
    } catch (e) {
        return createErrorResponse('创建失败', 500);
    }
});

// PUT /api/subscription-groups/:id/rules/:ruleId - 更新分组规则
subscriptionGroups.put('/:id/rules/:ruleId', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { ruleId } = c.req.param();
    const body = await c.req.json<any>();

    try {
        const service = new SubscriptionGroupService(c.env);
        const success = await service.updateGroupRule(user.id, ruleId, body);

        if (!success) {
            return createErrorResponse('规则不存在或无权修改', 404);
        }
        return c.json({ success: true });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

// DELETE /api/subscription-groups/:id/rules/:ruleId - 删除分组规则
subscriptionGroups.delete('/:id/rules/:ruleId', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { ruleId } = c.req.param();
    try {
        const service = new SubscriptionGroupService(c.env);
        const success = await service.deleteGroupRule(user.id, ruleId);

        if (!success) {
            return createErrorResponse('规则不存在或无权删除', 404);
        }
        return c.json({ success: true });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});


// PATCH /api/subscription-groups/:id/toggle - 切换启用/禁用状态
subscriptionGroups.patch('/:id/toggle', manualAuthMiddleware, async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        const service = new SubscriptionGroupService(c.env);
        const success = await service.toggleGroup(user.id, id);

        if (!success) {
            return createErrorResponse('分组不存在或无权修改', 404);
        }
        return c.json({ success: true });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

// POST /api/subscription-groups/update-order - 更新分组排序
subscriptionGroups.post('/update-order', manualAuthMiddleware, async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { groupIds } = await c.req.json<{ groupIds: string[] }>();

        if (!groupIds || !Array.isArray(groupIds)) {
            return createErrorResponse('无效的排序数据', 400);
        }

        const service = new SubscriptionGroupService(c.env);
        await service.updateSortOrder(user.id, groupIds);

        return c.json({ success: true, message: '分组顺序已更新' });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

// DELETE /api/subscription-groups/:id - 删除分组
subscriptionGroups.delete('/:id', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();

    try {
        const service = new SubscriptionGroupService(c.env);
        const success = await service.deleteGroup(user.id, id);

        if (!success) {
            return createErrorResponse('分组不存在或无权删除', 404);
        }

        return c.body(null, 204);
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

export default subscriptionGroups;