import { Hono } from 'hono';
import { hash } from 'bcrypt-ts';
import { sign } from 'hono/jwt';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';
import { createErrorResponse } from '../utils/errors';

const user = new Hono<{ Bindings: Env }>();

user.use('*', manualAuthMiddleware);

// GET /api/user/defaults - Get user's default assets
user.get('/defaults', async (c) => {
  const payload = c.get('jwtPayload');
  try {
    const defaults = await c.env.DB.prepare(
      'SELECT default_backend_id, default_config_id FROM user_default_assets WHERE user_id = ?'
    ).bind(payload.id).first();

    return c.json({ success: true, data: defaults || {} });
  } catch (error: any) {
    console.error('Failed to get user defaults:', error);
    return createErrorResponse(`Database error: ${error.message}`, 500);
  }
});

// PUT /api/user/defaults - Set user's default assets
user.put('/defaults', async (c) => {
  const payload = c.get('jwtPayload');
  const { default_backend_id, default_config_id } = await c.req.json();

  try {
    const existing = await c.env.DB.prepare(
      'SELECT * FROM user_default_assets WHERE user_id = ?'
    ).bind(payload.id).first();

    if (existing) {
      // Update existing record
      const newBackendId = default_backend_id !== undefined ? default_backend_id : (existing as any).default_backend_id;
      const newConfigId = default_config_id !== undefined ? default_config_id : (existing as any).default_config_id;

      await c.env.DB.prepare(
        'UPDATE user_default_assets SET default_backend_id = ?, default_config_id = ? WHERE user_id = ?'
      ).bind(newBackendId, newConfigId, payload.id).run();

    } else {
      // Insert new record
      await c.env.DB.prepare(
        'INSERT INTO user_default_assets (user_id, default_backend_id, default_config_id) VALUES (?, ?, ?)'
      ).bind(
        payload.id,
        default_backend_id !== undefined ? default_backend_id : null,
        default_config_id !== undefined ? default_config_id : null
      ).run();
    }

    return c.json({ success: true, message: 'Default assets updated successfully.' });
  } catch (error: any) {
    console.error('Failed to update user defaults:', error);
    return createErrorResponse(`Database error: ${error.message}`, 500);
  }
});

// GET /api/user/me - Get user's profile
user.get('/me', (c) => {
  const user = c.get('jwtPayload');
  return c.json({ success: true, data: user });
});

// GET /api/user/sub-token - Get or create user's subscription token
user.get('/sub-token', async (c) => {
  const userPayload = c.get('jwtPayload');

  // 1. Check JWT first
  if (userPayload.sub_token) {
    return c.json({ success: true, data: { token: userPayload.sub_token } });
  }

  // 2. If not in JWT, check DB
  const userFromDb = await c.env.DB.prepare('SELECT sub_token FROM users WHERE id = ?').bind(userPayload.id).first<{ sub_token: string }>();
  if (userFromDb && userFromDb.sub_token) {
    return c.json({ success: true, data: { token: userFromDb.sub_token } });
  }

  // 3. If not in DB, create, save, and return
  const newToken = crypto.randomUUID();
  try {
    await c.env.DB.prepare('UPDATE users SET sub_token = ? WHERE id = ?').bind(newToken, userPayload.id).run();
    return c.json({ success: true, data: { token: newToken } });
  } catch (error) {
    console.error("Failed to create and save new sub_token:", error);
    return createErrorResponse('Failed to generate subscription token.', 500);
  }
});

// POST /api/user/sub-token/reset - Reset user's subscription token
user.post('/sub-token/reset', async (c) => {
  const userPayload = c.get('jwtPayload');
  const newSubToken = crypto.randomUUID();

  await c.env.DB.prepare('UPDATE users SET sub_token = ? WHERE id = ?').bind(newSubToken, userPayload.id).run();

  // Re-sign the JWT with the new sub_token
  const { iat, ...payloadWithoutIat } = userPayload as Record<string, unknown>;
  const newPayload = { ...payloadWithoutIat, sub_token: newSubToken, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) };
  const newJwt = await sign(newPayload, c.env.JWT_SECRET);

  return c.json({ success: true, data: { token: newSubToken, jwt: newJwt, user: newPayload } });
});

// PUT /api/user/sub-token - Update user's subscription token
user.put('/sub-token', async (c) => {
  const userPayload = c.get('jwtPayload');
  const { token } = await c.req.json();

  const urlSafeRegex = /^[a-zA-Z0-9_-]+$/;
  if (typeof token !== 'string' || !urlSafeRegex.test(token)) {
    return createErrorResponse('令牌只能包含字母、数字、下划线和连字符。', 400);
  }

  try {
    await c.env.DB.prepare('UPDATE users SET sub_token = ? WHERE id = ?').bind(token, userPayload.id).run();

    // Re-sign the JWT with the new sub_token
    const { iat, ...payloadWithoutIat } = userPayload as Record<string, unknown>;
    const newPayload = { ...payloadWithoutIat, sub_token: token, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) };
    const newJwt = await sign(newPayload, c.env.JWT_SECRET);

    return c.json({ success: true, message: 'Subscription token updated successfully.', data: { jwt: newJwt, user: newPayload } });
  } catch (error: any) {
    console.error("Failed to update sub_token:", error);
    return createErrorResponse(`Database error: ${error.message}`, 500);
  }
});

// PUT /api/user/password - Update user's password
user.put('/password', async (c) => {
  const userPayload = c.get('jwtPayload');
  const { password } = await c.req.json();

  if (typeof password !== 'string') {
    return createErrorResponse('Password must be a string.', 400);
  }

  try {
    const hashedPassword = await hash(password, 10);
    await c.env.DB.prepare('UPDATE users SET password = ? WHERE id = ?').bind(hashedPassword, userPayload.id).run();
    return c.json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    console.error("Failed to update password:", error);
    return createErrorResponse(`Database error: ${error.message}`, 500);
  }
});

export default user;