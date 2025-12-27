import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';
import { createErrorResponse } from '../utils/errors';

const profileRules = new Hono<{ Bindings: Env }>();

profileRules.use('*', manualAuthMiddleware);

// Get all rules for a profile
profileRules.get('/:profile_id', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { profile_id } = c.req.param();
        const { results } = await c.env.DB.prepare(
            'SELECT * FROM profile_rules WHERE profile_id = ? AND user_id = ? ORDER BY sort_order ASC'
        ).bind(profile_id, user.id).all();
        return c.json({ success: true, data: results });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

// Create a new rule
profileRules.post('/', async (c) => {
    const user = c.get('jwtPayload');
    const { profile_id, name, type, value, enabled, sort_order } = await c.req.json<any>();

    if (!profile_id || !name || !type || !value) {
        return createErrorResponse('Missing required fields', 400);
    }

    const now = new Date().toISOString();
    try {
        const { meta } = await c.env.DB.prepare(
            'INSERT INTO profile_rules (user_id, profile_id, name, type, value, enabled, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(user.id, profile_id, name, type, value, enabled ?? 1, sort_order ?? 0, now, now).run();

        return c.json({ success: true, data: { id: meta.last_row_id } }, 201);
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

// Update a rule
profileRules.put('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const { name, type, value, enabled, sort_order } = await c.req.json<any>();

    if (!name || !type || !value) {
        return createErrorResponse('Missing required fields', 400);
    }

    const now = new Date().toISOString();
    try {
        await c.env.DB.prepare(
            'UPDATE profile_rules SET name = ?, type = ?, value = ?, enabled = ?, sort_order = ?, updated_at = ? WHERE id = ? AND user_id = ?'
        ).bind(name, type, value, enabled ?? 1, sort_order ?? 0, now, id, user.id).run();

        return c.json({ success: true });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

// Delete a rule
profileRules.delete('/:id', async (c) => {
    try {
        const user = c.get('jwtPayload');
        const { id } = c.req.param();
        await c.env.DB.prepare('DELETE FROM profile_rules WHERE id = ? AND user_id = ?').bind(id, user.id).run();
        return c.json({ success: true });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

export default profileRules;