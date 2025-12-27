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
                subscriptions: result?.subscriptions ?? 0,
                nodes: result?.nodes ?? 0,
                profiles: result?.profiles ?? 0
            };
        } catch (error) {
            console.error('Failed to fetch user stats:', error);
            return {
                subscriptions: 0,
                nodes: 0,
                profiles: 0
            };
        }
    }
}

