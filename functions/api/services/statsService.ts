import type { Env } from '../utils/types';

export class StatsService {
    private db: D1Database;

    constructor(env: Env) {
        this.db = env.DB;
    }

    async getUserStats(userId: string) {

        const query = `
            SELECT
                (SELECT COUNT(*) FROM subscriptions WHERE user_id = ?) as subscriptions,
                (SELECT COUNT(*) FROM nodes WHERE user_id = ?) as nodes,
                (SELECT COUNT(*) FROM profiles WHERE user_id = ?) as profiles
        `;

        try {
            const result = await this.db.prepare(query).bind(userId, userId, userId).first<{ subscriptions: number; nodes: number; profiles: number }>();

            return {
                total_subscriptions: result?.subscriptions ?? 0,
                total_nodes: result?.nodes ?? 0,
                total_profiles: result?.profiles ?? 0
            };
        } catch (error) {
            console.error('Failed to fetch user stats:', error);
            return {
                total_subscriptions: 0,
                total_nodes: 0,
                total_profiles: 0
            };
        }
    }
}

