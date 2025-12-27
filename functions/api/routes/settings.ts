import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';
import { SettingsService } from '../services/settingsService';
import { createErrorResponse } from '../utils/errors';

const settings = new Hono<{ Bindings: Env }>();

settings.use('*', manualAuthMiddleware);

settings.get('/', async (c) => {
    const user = c.get('jwtPayload');
    const service = new SettingsService(c.env);
    try {
        const results = await service.getSettings(user.id);
        return c.json({ success: true, data: results });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

settings.post('/', async (c) => {
    const user = c.get('jwtPayload');
    const settingsToUpdate = await c.req.json<any[]>();
    const service = new SettingsService(c.env);

    try {
        await service.updateSettings(user.id, settingsToUpdate);
        return c.json({ success: true, message: 'Settings updated successfully.' });
    } catch (error: any) {
        console.error('Failed to update settings:', error);
        return createErrorResponse(error.message, 500);
    }
});

export default settings;
