import { Hono } from 'hono';
import type { Env } from '../utils/types';
import { manualAuthMiddleware, adminAuthMiddleware } from '../middleware/auth';

import { createErrorResponse } from '../utils/errors';

const admin = new Hono<{ Bindings: Env }>();

// All routes in this group require auth and admin role
admin.use('*', manualAuthMiddleware, adminAuthMiddleware);

admin.get('/users', async (c) => {
    try {
        const { results } = await c.env.DB.prepare("SELECT id, username, role, created_at, updated_at FROM users WHERE role != 'system'").all();
        return c.json({ success: true, data: results });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

admin.put('/users/:id', async (c) => {
    const userId = c.req.param('id');
    const { role } = await c.req.json();

    if (!['admin', 'user'].includes(role)) {
        return createErrorResponse('Invalid role', 400);
    }

    try {
        const { success } = await c.env.DB.prepare(
            'UPDATE users SET role = ? WHERE id = ?'
        ).bind(role, userId).run();

        if (success) {
            return c.json({ success: true, message: 'User role updated successfully' });
        } else {
            return createErrorResponse('User not found or no changes made', 404);
        }
    } catch (error: any) {
        console.error('Failed to update user role:', error);
        return createErrorResponse(`Database error: ${error.message}`, 500);
    }
});

admin.delete('/users/:id', async (c) => {
    const userId = c.req.param('id');

    try {
        const { success } = await c.env.DB.prepare(
            'DELETE FROM users WHERE id = ?'
        ).bind(userId).run();

        if (success) {
            return c.json({ success: true, message: 'User deleted successfully' });
        } else {
            return createErrorResponse('User not found', 404);
        }
    } catch (error: any) {
        console.error('Failed to delete user:', error);
        return createErrorResponse(`Database error: ${error.message}`, 500);
    }
});

admin.get('/system-settings', async (c) => {
    try {
        const { results } = await c.env.DB.prepare('SELECT * FROM system_settings').all();
        const settings = (results as any[]).reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
        return c.json({ success: true, data: settings });
    } catch (e: any) {
        return createErrorResponse(e.message, 500);
    }
});

admin.post('/system-settings', async (c) => {
    const body = await c.req.json();
    const key = 'allow_registration';
    const value = String(body[key]);

    if (value !== 'true' && value !== 'false') {
        return createErrorResponse('Invalid value for allow_registration', 400);
    }

    try {
        // Use INSERT OR REPLACE to create the setting if it doesn't exist, or update it if it does.
        await c.env.DB.prepare(
            `INSERT INTO system_settings (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value`
        ).bind(key, value).run();

        return c.json({ success: true, message: 'Settings updated successfully' });
    } catch (error: any) {
        console.error('Failed to update system settings:', error);
        return createErrorResponse(`Database error: ${error.message}`, 500);
    }
});


admin.get('/logs/profile/:profileId', async (c) => {
    const { profileId } = c.req.param();
    const { page = '1', limit = '10' } = c.req.query();
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    try {
        // Core Metrics
        const totalAccessPromise = c.env.DB.prepare('SELECT COUNT(*) as count FROM subscription_access_logs WHERE profile_id = ?').bind(profileId).first<{ count: number }>();
        const uniqueIpsPromise = c.env.DB.prepare('SELECT COUNT(DISTINCT ip_address) as count FROM subscription_access_logs WHERE profile_id = ?').bind(profileId).first<{ count: number }>();

        // Trends (last 30 days)
        const dailyTrendPromise = c.env.DB.prepare(`
            SELECT strftime('%Y-%m-%d', accessed_at) as date, COUNT(*) as count
            FROM subscription_access_logs
            WHERE profile_id = ? AND accessed_at >= date('now', '-30 days')
            GROUP BY date
            ORDER BY date ASC
        `).bind(profileId).all();

        // Country Distribution
        const countryDistPromise = c.env.DB.prepare(`
            SELECT country, COUNT(*) as count
            FROM subscription_access_logs
            WHERE profile_id = ?
            GROUP BY country
            ORDER BY count DESC
            LIMIT 10
        `).bind(profileId).all();

        // Detailed Logs (paginated)
        const logsPromise = c.env.DB.prepare(
            'SELECT ip_address, user_agent, country, city, accessed_at FROM subscription_access_logs WHERE profile_id = ? ORDER BY accessed_at DESC LIMIT ? OFFSET ?'
        ).bind(profileId, limitNum, offset).all();
        const totalLogsCountPromise = c.env.DB.prepare('SELECT COUNT(*) as count FROM subscription_access_logs WHERE profile_id = ?').bind(profileId).first<{ count: number }>();

        const [
            totalAccess,
            uniqueIps,
            dailyTrend,
            countryDist,
            logs,
            totalLogsCount
        ] = await Promise.all([
            totalAccessPromise,
            uniqueIpsPromise,
            dailyTrendPromise,
            countryDistPromise,
            logsPromise,
            totalLogsCountPromise
        ]);

        return c.json({
            success: true,
            data: {
                metrics: {
                    totalAccess: totalAccess?.count ?? 0,
                    uniqueIps: uniqueIps?.count ?? 0,
                },
                trends: dailyTrend.results,
                distribution: {
                    countries: countryDist.results,
                },
                logs: {
                    data: logs.results,
                    total: totalLogsCount?.count ?? 0,
                    page: pageNum,
                    limit: limitNum,
                }
            }
        });

    } catch (error: any) {
        console.error('Failed to get profile logs:', error);
        return createErrorResponse(`Database error: ${error.message}`, 500);
    }
});

admin.get('/logs/summary', async (c) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayISO = todayStart.toISOString();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const sevenDaysAgoISO = sevenDaysAgo.toISOString();

        const todayAccessPromise = c.env.DB.prepare(
            "SELECT COUNT(*) as count FROM subscription_access_logs WHERE accessed_at >= ?"
        ).bind(todayISO).first<{ count: number }>();

        const weeklyUniqueIpsPromise = c.env.DB.prepare(
            "SELECT COUNT(DISTINCT ip_address) as count FROM subscription_access_logs WHERE accessed_at >= ?"
        ).bind(sevenDaysAgoISO).first<{ count: number }>();

        const [todayAccess, weeklyUniqueIps] = await Promise.all([todayAccessPromise, weeklyUniqueIpsPromise]);

        return c.json({
            success: true,
            data: {
                todayAccess: todayAccess?.count ?? 0,
                weeklyUniqueIps: weeklyUniqueIps?.count ?? 0,
            }
        });
    } catch (error: any) {
        console.error('Failed to get logs summary:', error);
        return createErrorResponse(`Database error: ${error.message}`, 500);
    }
});
export default admin;