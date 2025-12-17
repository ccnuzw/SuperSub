import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { sendTelegramMessage } from '../utils/telegram';
import { manualAuthMiddleware } from '../middleware/auth';
import { SystemService } from '../services/SystemService';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

const system = new Hono<{ Bindings: Env }>();

system.get('/settings', async (c) => {
  try {
    const settings = await SystemService.getSystemSettings(c.env);

    return c.json(
      createSuccessResponse(settings)
    );
  } catch (error: any) {
    console.error('Failed to get system settings:', error);
    return c.json(
      createErrorResponse('Failed to get system settings'),
      500
    );
  }
});

system.post('/settings/test-telegram', manualAuthMiddleware, async (c) => {
    try {
        const payload = c.get('jwtPayload');
        if (!payload || !payload.id) {
            return c.json({ success: false, message: 'Invalid user session.' }, 401);
        }
        await sendTelegramMessage(c.env, payload.id, 'This is a test message from SuperSub.');
        return c.json({ success: true, message: 'Test message sent successfully.' });
    } catch (error: any) {
        return c.json({ success: false, message: `Failed to send test message: ${error.message}` }, 500);
    }
});

export default system;