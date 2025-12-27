import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { AuthService } from '../services/authService';
import { createErrorResponse } from '../utils/errors';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/register', async (c) => {
    const { username, password } = await c.req.json();
    if (!username || !password) {
        return createErrorResponse('Missing username or password', 400);
    }

    const authService = new AuthService(c.env);
    const result = await authService.register(username, password);

    return c.json({ success: result.success, message: result.message, data: result.data }, result.status as any);
});

auth.post('/login', async (c) => {
    const { username, password } = await c.req.json();
    if (!username || !password) {
        return createErrorResponse('Missing username or password', 400);
    }

    const authService = new AuthService(c.env);
    const result = await authService.login(username, password);

    return c.json({ success: result.success, message: result.message, data: result.data }, result.status as any);
});

export default auth;