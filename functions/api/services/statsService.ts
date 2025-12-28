import type { Env } from '../utils/types';

import { getDb, DrizzleDB } from '../utils/db';
import { subscriptions, nodes, profiles } from '../drizzle/schema';
import { eq, count } from 'drizzle-orm';

export class StatsService {
    private db: DrizzleDB;

    constructor(env: Env) {
        this.db = getDb(env.DB);
    }

    async getUserStats(userId: string) {
        try {
            const [subsCountResult, nodesCountResult, profilesCountResult] = await Promise.all([
                this.db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.user_id, userId)),
                this.db.select({ count: count() }).from(nodes).where(eq(nodes.user_id, userId)),
                this.db.select({ count: count() }).from(profiles).where(eq(profiles.user_id, userId))
            ]);

            return {
                total_subscriptions: subsCountResult[0]?.count ?? 0,
                total_nodes: nodesCountResult[0]?.count ?? 0,
                total_profiles: profilesCountResult[0]?.count ?? 0
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

