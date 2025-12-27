import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { sendTelegramMessage } from '../utils/telegram';
import { manualAuthMiddleware } from '../middleware/auth';
import { createErrorResponse } from '../utils/errors';

const system = new Hono<{ Bindings: Env }>();

system.get('/settings', async (c) => {
    try {
        const { results } = await c.env.DB.prepare('SELECT key, value FROM system_settings').all();
        const settings = (results as any[]).reduce((acc, setting) => {
            // Only expose public settings
            if (setting.key === 'allow_registration') {
                acc[setting.key] = setting.value;
            }
            return acc;
        }, {});

        // If allow_registration is not in the database, default to 'true'
        if (settings.allow_registration === undefined) {
            settings.allow_registration = 'true';
        }

        return c.json({ success: true, data: settings });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

system.post('/settings/test-telegram', manualAuthMiddleware, async (c) => {
    try {
        const payload = c.get('jwtPayload');
        if (!payload || !payload.id) {
            return createErrorResponse('Invalid user session.', 401);
        }
        await sendTelegramMessage(c.env, payload.id, 'This is a test message from SuperSub.');
        return c.json({ success: true, message: 'Test message sent successfully.' });
    } catch (error: any) {
        return createErrorResponse(`Failed to send test message: ${error.message}`, 500);
    }
});

export default system;