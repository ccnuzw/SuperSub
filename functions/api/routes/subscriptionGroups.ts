import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';

const subscriptionGroups = new Hono<{ Bindings: Env }>();

// GET /api/subscription-groups - 获取所有订阅分组
subscriptionGroups.get('/', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { results } = await c.env.DB.prepare(
        'SELECT sg.*, COUNT(s.id) as subscription_count FROM subscription_groups sg LEFT JOIN subscriptions s ON sg.id = s.group_id WHERE sg.user_id = ? GROUP BY sg.id ORDER BY sg.sort_order ASC'
    ).bind(user.id).all();
    return c.json({ success: true, data: results });
});

// POST /api/subscription-groups - 创建新分组
subscriptionGroups.post('/', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { name, description } = await c.req.json<{ name: string, description?: string }>();

    if (!name || name.trim().length === 0) {
        return c.json({ success: false, message: '分组名称不能为空' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
        await c.env.DB.prepare(
            `INSERT INTO subscription_groups (id, user_id, name, description, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(id, user.id, name.trim(), description || null, now, now).run();
        
        const newGroup = await c.env.DB.prepare('SELECT * FROM subscription_groups WHERE id = ?').bind(id).first();
        return c.json({ success: true, data: newGroup }, 201);
    } catch (e: any) {
        if (e.message?.includes('UNIQUE constraint failed')) {
            return c.json({ success: false, message: '该分组名称已存在' }, 409);
        }
        return c.json({ success: false, message: '创建失败，请稍后重试' }, 500);
    }
});

// PUT /api/subscription-groups/:id - 重命名分组
subscriptionGroups.put('/:id', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const { name, description } = await c.req.json<{ name?: string, description?: string }>();
    const now = new Date().toISOString();
    const updates: string[] = [];
    const bindings: (string | null)[] = [];

    if (name && name.trim().length > 0) {
        updates.push('name = ?');
        bindings.push(name.trim());
    }

    if (description !== undefined) {
        updates.push('description = ?');
        bindings.push(description);
    }

    if (updates.length === 0) {
        return c.json({ success: false, message: '没有要更新的字段' }, 400);
    }

    updates.push('updated_at = ?');
    bindings.push(now, id, user.id);

    try {
        const result = await c.env.DB.prepare(
            `UPDATE subscription_groups SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
        ).bind(...bindings).run();

        if (result.meta.changes === 0) {
            return c.json({ success: false, message: '分组不存在或无权修改' }, 404);
        }
        return c.json({ success: true });
    } catch (e: any) {
        if (e.message?.includes('UNIQUE constraint failed')) {
            return c.json({ success: false, message: '该分组名称已存在' }, 409);
        }
        return c.json({ success: false, message: '更新失败，请稍后重试' }, 500);
    }
});

// --- Group Rules CRUD ---

// GET /api/subscription-groups/:id/rules - 获取分组规则
subscriptionGroups.get('/:id/rules', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const { results } = await c.env.DB.prepare(
        'SELECT * FROM subscription_group_rules WHERE group_id = ? AND user_id = ? ORDER BY sort_order ASC'
    ).bind(id, user.id).all();
    return c.json({ success: true, data: results });
});

// POST /api/subscription-groups/:id/rules - 创建分组规则
subscriptionGroups.post('/:id/rules', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id: group_id } = c.req.param();
    const { name, type, value, enabled } = await c.req.json<any>();

    if (!name || !type || !value) {
        return c.json({ success: false, message: '缺少必要参数' }, 400);
    }

    const now = new Date().toISOString();
    try {
        await c.env.DB.prepare(
            `INSERT INTO subscription_group_rules (user_id, group_id, name, type, value, enabled, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(user.id, group_id, name, type, value, enabled === false ? 0 : 1, now, now).run();
        return c.json({ success: true }, 201);
    } catch (e) {
        return c.json({ success: false, message: '创建失败' }, 500);
    }
});

// PUT /api/subscription-groups/:id/rules/:ruleId - 更新分组规则
subscriptionGroups.put('/:id/rules/:ruleId', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { ruleId } = c.req.param();
    const body = await c.req.json<any>();
    const now = new Date().toISOString();

    const fields = ['name', 'type', 'value', 'enabled', 'sort_order'];
    const updates = [];
    const bindings = [];

    for (const field of fields) {
        if (body[field] !== undefined) {
            updates.push(`${field} = ?`);
            bindings.push(field === 'enabled' ? (body[field] ? 1 : 0) : body[field]);
        }
    }

    if (updates.length === 0) {
        return c.json({ success: false, message: '没有要更新的字段' }, 400);
    }

    updates.push('updated_at = ?');
    bindings.push(now, ruleId, user.id);

    const result = await c.env.DB.prepare(
        `UPDATE subscription_group_rules SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    ).bind(...bindings).run();

    if (result.meta.changes === 0) {
        return c.json({ success: false, message: '规则不存在或无权修改' }, 404);
    }
    return c.json({ success: true });
});

// DELETE /api/subscription-groups/:id/rules/:ruleId - 删除分组规则
subscriptionGroups.delete('/:id/rules/:ruleId', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { ruleId } = c.req.param();
    const result = await c.env.DB.prepare(
        'DELETE FROM subscription_group_rules WHERE id = ? AND user_id = ?'
    ).bind(ruleId, user.id).run();

    if (result.meta.changes === 0) {
        return c.json({ success: false, message: '规则不存在或无权删除' }, 404);
    }
    return c.json({ success: true });
});


// PATCH /api/subscription-groups/:id/toggle - 切换启用/禁用状态
subscriptionGroups.patch('/:id/toggle', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const now = new Date().toISOString();

    const result = await c.env.DB.prepare(
        'UPDATE subscription_groups SET is_enabled = NOT is_enabled, updated_at = ? WHERE id = ? AND user_id = ?'
    ).bind(now, id, user.id).run();

    if (result.meta.changes === 0) {
        return c.json({ success: false, message: '分组不存在或无权修改' }, 404);
    }
    return c.json({ success: true });
});

// POST /api/subscription-groups/update-order - 更新分组排序
subscriptionGroups.post('/update-order', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { groupIds } = await c.req.json<{ groupIds: string[] }>();

    if (!groupIds || !Array.isArray(groupIds)) {
        return c.json({ success: false, message: '无效的排序数据' }, 400);
    }

    const stmts = groupIds.map((id, index) =>
        c.env.DB.prepare('UPDATE subscription_groups SET sort_order = ? WHERE id = ? AND user_id = ?').bind(index, id, user.id)
    );

    if (stmts.length > 0) {
        await c.env.DB.batch(stmts);
    }

    return c.json({ success: true, message: '分组顺序已更新' });
});

// DELETE /api/subscription-groups/:id - 删除分组
subscriptionGroups.delete('/:id', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();

    // The ON DELETE SET NULL constraint will handle un-grouping subscriptions automatically.
    const result = await c.env.DB.prepare(
        'DELETE FROM subscription_groups WHERE id = ? AND user_id = ?'
    ).bind(id, user.id).run();

    if (result.meta.changes === 0) {
        return c.json({ success: false, message: '分组不存在或无权删除' }, 404);
    }

    return c.body(null, 204);
});

export default subscriptionGroups;