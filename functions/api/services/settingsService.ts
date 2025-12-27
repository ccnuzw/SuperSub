import type { Env } from '../utils/types';

export class SettingsService {
    private db: D1Database;

    constructor(env: Env) {
        this.db = env.DB;
    }

    async getSettings(userId: string) {
        const { results } = await this.db.prepare('SELECT * FROM settings WHERE user_id = ?').bind(userId).all();
        return results;
    }

    async updateSettings(userId: string, settingsToUpdate: any[]) {
        if (!Array.isArray(settingsToUpdate)) {
            throw new Error('Invalid input: settingsToUpdate must be an array.');
        }

        const now = new Date().toISOString();
        const stmts = settingsToUpdate.map(setting => {
            return this.db.prepare(
                `INSERT INTO settings (key, user_id, value, type, category, description, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(key, user_id) DO UPDATE SET
                    value = excluded.value,
                    updated_at = excluded.updated_at`
            ).bind(
                setting.key,
                userId,
                setting.value,
                setting.type || 'string',
                setting.category || 'general',
                setting.description || '',
                now,
                now
            );
        });

        await this.db.batch(stmts);
    }
}
