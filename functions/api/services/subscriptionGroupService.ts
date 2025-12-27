import type { Env } from '../utils/types';

export class SubscriptionGroupService {
    private db: D1Database;

    constructor(env: Env) {
        this.db = env.DB;
    }

    async getGroups(userId: string) {
        const { results } = await this.db.prepare(
            'SELECT * FROM subscription_groups WHERE user_id = ? ORDER BY sort_order ASC'
        ).bind(userId).all();
        return results;
    }

    async createGroup(userId: string, name: string, description?: string) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.db.prepare(
            `INSERT INTO subscription_groups (id, user_id, name, description, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(id, userId, name.trim(), description || null, now, now).run();

        return await this.db.prepare('SELECT * FROM subscription_groups WHERE id = ?').bind(id).first();
    }

    async updateGroup(userId: string, id: string, data: { name?: string, description?: string }) {
        const now = new Date().toISOString();
        const updates: string[] = [];
        const bindings: (string | null)[] = [];

        if (data.name && data.name.trim().length > 0) {
            updates.push('name = ?');
            bindings.push(data.name.trim());
        }

        if (data.description !== undefined) {
            updates.push('description = ?');
            bindings.push(data.description);
        }

        if (updates.length === 0) return null;

        updates.push('updated_at = ?');
        bindings.push(now, id, userId);

        const result = await this.db.prepare(
            `UPDATE subscription_groups SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
        ).bind(...bindings).run();

        return result.meta.changes > 0;
    }

    async deleteGroup(userId: string, id: string) {
        const result = await this.db.prepare(
            'DELETE FROM subscription_groups WHERE id = ? AND user_id = ?'
        ).bind(id, userId).run();
        return result.meta.changes > 0;
    }

    async toggleGroup(userId: string, id: string) {
        const now = new Date().toISOString();
        const result = await this.db.prepare(
            'UPDATE subscription_groups SET is_enabled = NOT is_enabled, updated_at = ? WHERE id = ? AND user_id = ?'
        ).bind(now, id, userId).run();
        return result.meta.changes > 0;
    }

    async updateSortOrder(userId: string, groupIds: string[]) {
        const stmts = groupIds.map((id, index) =>
            this.db.prepare('UPDATE subscription_groups SET sort_order = ? WHERE id = ? AND user_id = ?').bind(index, id, userId)
        );
        if (stmts.length > 0) {
            await this.db.batch(stmts);
        }
    }

    // Rules
    async getGroupRules(userId: string, groupId: string) {
        const { results } = await this.db.prepare(
            'SELECT * FROM subscription_group_rules WHERE group_id = ? AND user_id = ? ORDER BY sort_order ASC'
        ).bind(groupId, userId).all();
        return results;
    }

    async createGroupRule(userId: string, groupId: string, data: { name: string, type: string, value: string, enabled: boolean }) {
        const now = new Date().toISOString();
        await this.db.prepare(
            `INSERT INTO subscription_group_rules (user_id, group_id, name, type, value, enabled, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(userId, groupId, data.name, data.type, data.value, data.enabled ? 1 : 0, now, now).run();
    }

    async updateGroupRule(userId: string, ruleId: string, data: { name?: string, type?: string, value?: string, enabled?: boolean, sort_order?: number }) {
        const now = new Date().toISOString();
        const fields = ['name', 'type', 'value', 'enabled', 'sort_order'];
        const updates: string[] = [];
        const bindings: any[] = [];

        for (const field of fields) {
            // @ts-ignore
            if (data[field] !== undefined) {
                updates.push(`${field} = ?`);
                const val = (data as any)[field];
                bindings.push(field === 'enabled' ? (val ? 1 : 0) : val);
            }
        }

        if (updates.length === 0) return null;

        updates.push('updated_at = ?');
        bindings.push(now, ruleId, userId);

        const result = await this.db.prepare(
            `UPDATE subscription_group_rules SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
        ).bind(...bindings).run();

        return result.meta.changes > 0;
    }

    async deleteGroupRule(userId: string, ruleId: string) {
        const result = await this.db.prepare(
            'DELETE FROM subscription_group_rules WHERE id = ? AND user_id = ?'
        ).bind(ruleId, userId).run();
        return result.meta.changes > 0;
    }
}
