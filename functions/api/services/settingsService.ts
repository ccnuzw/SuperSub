import type { Env } from '../utils/types';

import { getDb, DrizzleDB } from '../utils/db';
import { settings } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

export class SettingsService {
    private db: DrizzleDB;

    constructor(env: Env) {
        this.db = getDb(env.DB);
    }

    async getSettings(userId: string) {
        return await this.db.select().from(settings).where(eq(settings.user_id, userId));
    }

    async updateSettings(userId: string, settingsToUpdate: any[]) {
        if (!Array.isArray(settingsToUpdate)) {
            throw new Error('Invalid input: settingsToUpdate must be an array.');
        }

        const now = new Date().toISOString();
        const rowsToInsert = settingsToUpdate.map(setting => ({
            key: setting.key,
            user_id: userId,
            value: setting.value,
            type: setting.type || 'string',
            category: setting.category || 'general',
            description: setting.description || '',
            created_at: now,
            updated_at: now
        }));

        if (rowsToInsert.length === 0) return;

        await this.db.insert(settings).values(rowsToInsert)
            .onConflictDoUpdate({
                target: [settings.key, settings.user_id],
                set: {
                    value: sql`excluded.value`,
                    updated_at: sql`excluded.updated_at`
                }
            });
    }
}
