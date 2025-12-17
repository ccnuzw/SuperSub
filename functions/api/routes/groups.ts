import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';

const groups = new Hono<{ Bindings: Env }>();

// GET /api/groups - 获取所有分组
groups.get('/', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { results } = await c.env.DB.prepare(
        'SELECT ng.*, COUNT(n.id) as node_count FROM node_groups ng LEFT JOIN nodes n ON ng.id = n.group_id WHERE ng.user_id = ? ORDER BY ng.sort_order ASC'
    ).bind(user.id).all();
    return c.json({ success: true, data: results });
});

// POST /api/groups - 创建新分组
groups.post('/', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { name } = await c.req.json<{ name: string }>();

    if (!name || name.trim().length === 0) {
        return c.json({ success: false, message: '分组名称不能为空' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
        await c.env.DB.prepare(
            `INSERT INTO node_groups (id, user_id, name, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)`
        ).bind(id, user.id, name.trim(), now, now).run();
        
        const newGroup = await c.env.DB.prepare('SELECT * FROM node_groups WHERE id = ?').bind(id).first();
        return c.json({ success: true, data: newGroup }, 201);
    } catch (e: any) {
        if (e.message?.includes('UNIQUE constraint failed')) {
            return c.json({ success: false, message: '该分组名称已存在' }, 409);
        }
        return c.json({ success: false, message: '创建失败，请稍后重试' }, 500);
    }
});

// PUT /api/groups/:id - 重命名分组
groups.put('/:id', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const { name } = await c.req.json<{ name: string }>();

    if (!name || name.trim().length === 0) {
        return c.json({ success: false, message: '分组名称不能为空' }, 400);
    }

    const now = new Date().toISOString();
    try {
        const result = await c.env.DB.prepare(
            'UPDATE node_groups SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?'
        ).bind(name.trim(), now, id, user.id).run();

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

// PATCH /api/groups/:id/toggle - 切换启用/禁用状态
groups.patch('/:id/toggle', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const now = new Date().toISOString();

    const result = await c.env.DB.prepare(
        'UPDATE node_groups SET is_enabled = NOT is_enabled, updated_at = ? WHERE id = ? AND user_id = ?'
    ).bind(now, id, user.id).run();

    if (result.meta.changes === 0) {
        return c.json({ success: false, message: '分组不存在或无权修改' }, 404);
    }
    return c.json({ success: true });
});

// POST /api/groups/update-order - 更新分组排序
groups.post('/update-order', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { groupIds } = await c.req.json<{ groupIds: string[] }>();

    if (!groupIds || !Array.isArray(groupIds)) {
        return c.json({ success: false, message: '无效的排序数据' }, 400);
    }

    const stmts = groupIds.map((id, index) =>
        c.env.DB.prepare('UPDATE node_groups SET sort_order = ? WHERE id = ? AND user_id = ?').bind(index, id, user.id)
    );

    if (stmts.length > 0) {
        await c.env.DB.batch(stmts);
    }

    return c.json({ success: true, message: '分组顺序已更新' });
});

// DELETE /api/groups/:id - 删除分组
groups.delete('/:id', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();

    // The ON DELETE SET NULL constraint will handle un-grouping nodes automatically.
    const result = await c.env.DB.prepare(
        'DELETE FROM node_groups WHERE id = ? AND user_id = ?'
    ).bind(id, user.id).run();

    if (result.meta.changes === 0) {
        return c.json({ success: false, message: '分组不存在或无权删除' }, 404);
    }

    return c.body(null, 204);
});

export default groups;