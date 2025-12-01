import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import type { Env } from './utils/types';
import { methodOverrideMiddleware } from './middleware/methodOverride';
import { manualAuthMiddleware } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import nodeRoutes from './routes/nodes';
import subscriptionRoutes from './routes/subscriptions';
import subscriptionServiceRoutes from './routes/subscriptionsService'; // New service-based routes
import profileRoutes from './routes/profiles';
import adminRoutes from './routes/admin';
import assetRoutes from './routes/assets';
import groupRoutes from './routes/groups';
import subscriptionGroupRoutes from './routes/subscriptionGroups';
import systemRoutes from './routes/system';
import userRoutes from './routes/user';
import publicRoutes from './routes/public';
import profileRules from './routes/profileRules';

export const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('/api/*', methodOverrideMiddleware(app));

// API routes
const api = app.basePath('/api');

// Public API routes
api.route('/auth', authRoutes);
api.route('/system', systemRoutes);
api.route('/public', publicRoutes);

// Authenticated API routes
api.route('/nodes', nodeRoutes);
api.route('/subscriptions', subscriptionRoutes);
api.route('/subscriptions-service', subscriptionServiceRoutes); // New service-based routes
api.route('/profiles', profileRoutes);
api.route('/admin', adminRoutes);
api.route('/assets', assetRoutes);
api.route('/groups', groupRoutes);
api.route('/subscription-groups', subscriptionGroupRoutes);
api.route('/profile-rules', profileRules);
api.route('/user', userRoutes);

// Other remaining routes from the original file
api.get('/stats', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const [subscriptions, nodes, profiles] = await Promise.all([
        c.env.DB.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ?').bind(user.id).first<{ count: number }>(),
        c.env.DB.prepare('SELECT COUNT(*) as count FROM nodes WHERE user_id = ?').bind(user.id).first<{ count: number }>(),
        c.env.DB.prepare('SELECT COUNT(*) as count FROM profiles WHERE user_id = ?').bind(user.id).first<{ count: number }>()
    ]);
    return c.json({ success: true, data: { subscriptions: subscriptions?.count ?? 0, nodes: nodes?.count ?? 0, profiles: profiles?.count ?? 0 } });
});

api.get('/node-statuses', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    try {
        const { results } = await c.env.DB.prepare(
            'SELECT * FROM node_statuses WHERE user_id = ?'
        ).bind(user.id).all<any>();

        const now = Date.now();
        const TESTING_TIMEOUT = 2 * 60 * 1000; // 2 minutes

        const sanitizedResults = results.map((r: any) => {
            if (r.status === 'testing') {
                const checkedAt = new Date(r.checked_at).getTime();
                if (now - checkedAt > TESTING_TIMEOUT) {
                    // If status is 'testing' for too long, consider it failed/pending.
                    return { ...r, status: 'pending', latency: null };
                }
            }
            return r;
        });

        return c.json({ success: true, data: sanitizedResults });
    } catch (error: any) {
        console.error('Failed to get node statuses:', error);
        return c.json({ success: false, message: `Database error: ${error.message}` }, 500);
    }
});

api.get('/settings', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const { results } = await c.env.DB.prepare('SELECT * FROM settings WHERE user_id = ?').bind(user.id).all();
    return c.json({ success: true, data: results });
});

api.post('/settings', manualAuthMiddleware, async (c) => {
    const user = c.get('jwtPayload');
    const settingsToUpdate = await c.req.json<any[]>();

    if (!Array.isArray(settingsToUpdate)) {
        return c.json({ success: false, message: 'Invalid request body. Expected an array of settings.' }, 400);
    }

    const now = new Date().toISOString();
    const stmts = settingsToUpdate.map(setting => {
        return c.env.DB.prepare(
            `INSERT INTO settings (key, user_id, value, type, category, description, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(key, user_id) DO UPDATE SET
                value = excluded.value,
                updated_at = excluded.updated_at`
        ).bind(
            setting.key,
            user.id,
            setting.value,
            setting.type || 'string',
            setting.category || 'general',
            setting.description || '',
            now,
            now
        );
    });

    try {
        await c.env.DB.batch(stmts);
        return c.json({ success: true, message: 'Settings updated successfully.' });
    } catch (error: any) {
        console.error('Failed to update settings:', error);
        return c.json({ success: false, message: `Database error: ${error.message}` }, 500);
    }
});

export const onRequest = handle(app);
