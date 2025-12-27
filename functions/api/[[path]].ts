import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import type { Env } from './utils/types';
import { methodOverrideMiddleware } from './middleware/methodOverride';

// Import routes
import authRoutes from './routes/auth';
import nodeRoutes from './routes/nodes';
import subscriptionRoutes from './routes/subscriptions';
import profileRoutes from './routes/profiles';
import adminRoutes from './routes/admin';
import assetRoutes from './routes/assets';
import groupRoutes from './routes/groups';
import subscriptionGroupRoutes from './routes/subscriptionGroups';
import systemRoutes from './routes/system';
import userRoutes from './routes/user';
import publicRoutes from './routes/public';
import profileRules from './routes/profileRules';
import nodeStatusRoutes from './routes/nodeStatuses';
import statsRoutes from './routes/stats';
import settingsRoutes from './routes/settings';

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
api.route('/profiles', profileRoutes);
api.route('/admin', adminRoutes);
api.route('/assets', assetRoutes);
api.route('/groups', groupRoutes);
api.route('/subscription-groups', subscriptionGroupRoutes);
api.route('/profile-rules', profileRules);
api.route('/user', userRoutes);
api.route('/node-statuses', nodeStatusRoutes);
api.route('/stats', statsRoutes);
api.route('/settings', settingsRoutes);

export const onRequest = handle(app);
