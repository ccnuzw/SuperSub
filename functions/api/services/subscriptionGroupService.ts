import { getDb, DrizzleDB } from '../utils/db';
import type { Env } from '../utils/types';
import { subscription_groups, subscription_group_rules } from '../drizzle/schema';
import { eq, and, asc, not } from 'drizzle-orm';

export class SubscriptionGroupService {
    private db: DrizzleDB;

    constructor(env: Env) {
        this.db = getDb(env.DB);
    }

    async getGroups(userId: string) {
        return await this.db.select().from(subscription_groups)
            .where(eq(subscription_groups.user_id, userId))
            .orderBy(asc(subscription_groups.sort_order));
    }

    async createGroup(userId: string, name: string, description?: string) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.db.insert(subscription_groups).values({
            id: id,
            user_id: userId,
            name: name.trim(),
            description: description || null,
            created_at: now,
            updated_at: now,
            sort_order: 0 // Default sort order
        });

        return await this.db.select().from(subscription_groups).where(eq(subscription_groups.id, id)).get();
    }

    async updateGroup(userId: string, id: string, data: { name?: string, description?: string }) {
        const now = new Date().toISOString();
        const updateData: any = { updated_at: now };

        if (data.name && data.name.trim().length > 0) {
            updateData.name = data.name.trim();
        }

        if (data.description !== undefined) {
            updateData.description = data.description;
        }

        if (Object.keys(updateData).length <= 1) return null; // Only updated_at

        const result = await this.db.update(subscription_groups)
            .set(updateData)
            .where(and(eq(subscription_groups.id, id), eq(subscription_groups.user_id, userId)))
            .run();

        return result.meta.changes > 0;
    }

    async deleteGroup(userId: string, id: string) {
        const result = await this.db.delete(subscription_groups)
            .where(and(eq(subscription_groups.id, id), eq(subscription_groups.user_id, userId)))
            .run();
        return result.meta.changes > 0;
    }

    async toggleGroup(userId: string, id: string) {
        const now = new Date().toISOString();
        const result = await this.db.update(subscription_groups)
            .set({
                is_enabled: not(subscription_groups.is_enabled),
                updated_at: now
            })
            .where(and(eq(subscription_groups.id, id), eq(subscription_groups.user_id, userId)))
            .run();
        return result.meta.changes > 0;
    }

    async updateSortOrder(userId: string, groupIds: string[]) {
        if (groupIds.length === 0) return;

        await this.db.transaction(async (tx) => {
            for (const [index, id] of groupIds.entries()) {
                await tx.update(subscription_groups)
                    .set({ sort_order: index })
                    .where(and(eq(subscription_groups.id, id), eq(subscription_groups.user_id, userId)));
            }
        });
    }

    // Rules
    async getGroupRules(userId: string, groupId: string) {
        return await this.db.select().from(subscription_group_rules)
            .where(and(eq(subscription_group_rules.group_id, groupId), eq(subscription_group_rules.user_id, userId)))
            .orderBy(asc(subscription_group_rules.sort_order));
    }

    async createGroupRule(userId: string, groupId: string, data: { name: string, type: string, value: string, enabled: boolean }) {
        const now = new Date().toISOString();
        const countRes = await this.db.select({ count: subscription_group_rules.id }).from(subscription_group_rules)
            .where(and(eq(subscription_group_rules.group_id, groupId), eq(subscription_group_rules.user_id, userId)))
            .all();
        const sortOrder = countRes.length;

        await this.db.insert(subscription_group_rules).values({
            user_id: userId,
            group_id: groupId,
            name: data.name,
            type: data.type,
            value: data.value,
            enabled: data.enabled ? 1 : 0,
            sort_order: sortOrder,
            created_at: now,
            updated_at: now
        });
    }

    async updateGroupRule(userId: string, ruleId: string, data: { name?: string, type?: string, value?: string, enabled?: boolean, sort_order?: number }) {
        const now = new Date().toISOString();
        const updateData: any = { updated_at: now };

        if (data.name !== undefined) updateData.name = data.name;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.value !== undefined) updateData.value = data.value;
        if (data.enabled !== undefined) updateData.enabled = data.enabled ? 1 : 0;
        if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

        const result = await this.db.update(subscription_group_rules)
            .set(updateData)
            .where(and(eq(subscription_group_rules.id, Number(ruleId)), eq(subscription_group_rules.user_id, userId)))
            .run();

        return result.meta.changes > 0;
    }

    async deleteGroupRule(userId: string, ruleId: string) {
        const result = await this.db.delete(subscription_group_rules)
            .where(and(eq(subscription_group_rules.id, Number(ruleId)), eq(subscription_group_rules.user_id, userId)))
            .run();
        return result.meta.changes > 0;
    }
}
