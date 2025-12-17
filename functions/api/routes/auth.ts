import { Hono } from 'hono';
import { hash, compare } from 'bcrypt-ts';
import { sign, verify } from 'hono/jwt';
import type { Env } from '../utils/types';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/register', async (c) => {
    // Check if registration is allowed
    const allowRegistrationSetting = await c.env.DB.prepare(
        `SELECT value FROM system_settings WHERE key = 'allow_registration'`
    ).first<{ value: string }>();

    // Default to 'true' if the setting is not found, for backward compatibility.
    const isRegistrationAllowed = allowRegistrationSetting?.value !== 'false';

    if (!isRegistrationAllowed) {
        return c.json({ success: false, message: 'User registration is currently disabled by the administrator.' }, 403);
    }

    const { username, password } = await c.req.json();
    if (!username || !password) {
        return c.json({ success: false, message: 'Missing username or password' }, 400);
    }
    const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existingUser) {
        return c.json({ success: false, message: 'Username already exists' }, 409);
    }
    const userCountResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'system'").first<{ count: number }>();
    const userCount = userCountResult?.count ?? 0;
    let role = userCount === 0 ? 'admin' : 'user';
    const hashedPassword = await hash(password, 10);
    const id = crypto.randomUUID();
    const subToken = crypto.randomUUID();
    const now = new Date().toISOString();
    await c.env.DB.prepare('INSERT INTO users (id, username, password, role, sub_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, username, hashedPassword, role, subToken, now, now).run();
    return c.json({ success: true, data: { id, username, role } }, 201);
});

auth.post('/login', async (c) => {
    const { username, password } = await c.req.json();
    if (!username || !password) {
        return c.json({ success: false, message: 'Missing username or password' }, 400);
    }
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<any>();
    if (!user) {
        return c.json({ success: false, message: 'User not found' }, 404);
    }
    const isPasswordValid = await compare(password, user.password as string);
    if (!isPasswordValid) {
        return c.json({ success: false, message: 'Invalid password' }, 401);
    }
    const payload = { id: user.id, username: user.username, role: user.role || 'user', sub_token: user.sub_token, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) };
    const token = await sign(payload, c.env.JWT_SECRET);
    return c.json({ success: true, data: { token, user: payload } });
});

auth.get('/me', async (c) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, message: 'No authorization token provided' }, 401);
    }

    const token = authHeader.substring(7);

    try {
        const payload = await verify(token, c.env.JWT_SECRET);

        // Fetch fresh user data from database
        const user = await c.env.DB.prepare(
            'SELECT id, username, role, sub_token, created_at, updated_at FROM users WHERE id = ?'
        ).bind(payload.id).first<any>();

        if (!user) {
            return c.json({ success: false, message: 'User not found' }, 404);
        }

        return c.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role || 'user',
                    sub_token: user.sub_token
                }
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return c.json({ success: false, message: 'Invalid token' }, 401);
    }
});

auth.post('/logout', async (c) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, message: 'No authorization token provided' }, 401);
    }

    const token = authHeader.substring(7);

    try {
        // Verify token to ensure it's valid
        await verify(token, c.env.JWT_SECRET);

        // In a stateless JWT setup, logout is typically handled on the client side
        // by simply removing the token. Here we just return success to indicate
        // the logout request was processed successfully.

        return c.json({
            success: true,
            message: 'Successfully logged out'
        });
    } catch (error) {
        console.error('Token verification error during logout:', error);
        // Even if token is invalid, we still return success for logout
        // since the client wants to clear their local state anyway
        return c.json({
            success: true,
            message: 'Successfully logged out'
        });
    }
});

export default auth;