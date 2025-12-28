import { getDb, DrizzleDB } from '../utils/db';
import { subscriptions, subscription_groups, profile_subscriptions, subscription_rules, subscription_group_rules } from '../drizzle/schema';
import { eq, and, asc, desc, inArray, isNull, isNotNull, sql } from 'drizzle-orm';
import { parseNodeLinks, ParsedNode, regenerateLink } from '../../../src/utils/nodeParser';
import type { Env } from '../utils/types';
import { parseSubscriptionContent, applySubscriptionRules } from '../utils/subscriptionUtils';

export const userAgents = [
    'clash-verge/v2.2.23',
    'clash-verge/v2.2.18',
    'clash-verge/v2.1.23',
    'ClashX Pro/1.117.1',
    'V2RayN/7.23',
    'V2RayN/7.13',
    'V2RayN/7.11',
    'ClashMi',
    'FLClash'
];

function getColumns<T extends Record<string, any>>(table: T) {
    return table; // Helper helper if strictly needed, but Drizzle usually destructures fine.
}

export class SubscriptionService {
    private db: DrizzleDB;

    constructor(env: Env) {
        this.db = getDb(env.DB);
    }

    sizeToBytes(sizeStr: string): number {
        if (!sizeStr) return 0;
        const cleanedStr = sizeStr.replace(/\+/g, ' ').trim();
        const match = cleanedStr.match(/^([\d.]+)\s*(T|G|M|K)?B?$/i);
        if (!match) return 0;

        const size = parseFloat(match[1]);
        const unit = (match[2] || '').toUpperCase();

        switch (unit) {
            case 'T': return size * Math.pow(1024, 4);
            case 'G': return size * Math.pow(1024, 3);
            case 'M': return size * Math.pow(1024, 2);
            case 'K': return size * 1024;
            default: return size;
        }
    }

    parseSubscriptionDetails(userInfoHeader: string | null, nodes: (ParsedNode & { id: string, raw: string })[]) {
        let remainingTraffic: number | null = null;
        let expiresAt: Date | null = null;

        for (const node of nodes) {
            const name = node.name;
            if (!expiresAt) {
                const expiryDateMatch = name.match(/(?:到期|套餐到期)[\:：\s]*(\d{4}-\d{2}-\d{2})/i);
                if (expiryDateMatch && expiryDateMatch[1]) {
                    const date = new Date(expiryDateMatch[1]);
                    if (!isNaN(date.getTime())) expiresAt = date;
                } else {
                    const remainingDaysMatch = name.match(/(?:距离下次重置剩余|剩余天数|剩余|可用)[\:：\s]*(\d+)\s*天/i);
                    if (remainingDaysMatch && remainingDaysMatch[1]) {
                        const days = parseInt(remainingDaysMatch[1], 10);
                        if (!isNaN(days)) {
                            const newExpiry = new Date();
                            newExpiry.setDate(newExpiry.getDate() + days);
                            expiresAt = newExpiry;
                        }
                    }
                }
            }

            if (remainingTraffic === null) {
                if (/天/i.test(name) && !/流量/i.test(name)) continue;
                const regexWithUnit = /(?:剩余流量|流量)[\:：\s]*([\d.]+[\s+]*[TGMK]?B)/i;
                const trafficMatchWithUnit = name.match(regexWithUnit);
                if (trafficMatchWithUnit && trafficMatchWithUnit[1]) {
                    remainingTraffic = this.sizeToBytes(trafficMatchWithUnit[1]);
                    continue;
                }
                const regexWithoutUnit = /(?:剩余流量|流量)[\:：\s]*(\d+(?:\.\d+)?)/i;
                const trafficMatchWithoutUnit = name.match(regexWithoutUnit);
                if (trafficMatchWithoutUnit && trafficMatchWithoutUnit[1] && typeof trafficMatchWithoutUnit.index === 'number') {
                    const startIndex = trafficMatchWithoutUnit.index;
                    const context = name.substring(startIndex, startIndex + trafficMatchWithoutUnit[0].length + 5);
                    if (!/[TGMK]B/i.test(context)) {
                        remainingTraffic = parseFloat(trafficMatchWithoutUnit[1]);
                    }
                }
            }
            if (remainingTraffic !== null && expiresAt) break;
        }

        if (userInfoHeader) {
            const info: any = {};
            userInfoHeader.split(';').forEach(part => {
                const [key, value] = part.split('=').map(s => s.trim());
                if (key && value) {
                    const parsedValue = parseFloat(value);
                    info[key] = isNaN(parsedValue) ? 0 : parsedValue;
                }
            });

            if (remainingTraffic === null && info.total) {
                const used = (info.upload || 0) + (info.download || 0);
                remainingTraffic = info.total - used;
            }
            if (!expiresAt && info.expire) {
                expiresAt = new Date(info.expire * 1000);
            }
        }

        let remainingDays: number | null = null;
        if (expiresAt) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const expiryDate = new Date(expiresAt);
            expiryDate.setHours(0, 0, 0, 0);
            const diffTime = expiryDate.getTime() - now.getTime();
            remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
            remainingTraffic,
            remainingDays,
            expiresAt: expiresAt ? expiresAt.toISOString() : null,
        };
    }

    async getSubscriptions(userId: string) {
        return await this.db.select({
            id: subscriptions.id,
            user_id: subscriptions.user_id,
            name: subscriptions.name,
            url: subscriptions.url,
            node_count: subscriptions.node_count,
            last_updated: subscriptions.last_updated,
            error: subscriptions.error,
            created_at: subscriptions.created_at,
            updated_at: subscriptions.updated_at,
            enabled: subscriptions.enabled,
            group_id: subscriptions.group_id,
            expires_at: subscriptions.expires_at,
            subscription_info: subscriptions.subscription_info,
            remaining_traffic: subscriptions.remaining_traffic,
            remaining_days: subscriptions.remaining_days,
            profile_id: profile_subscriptions.profile_id
        })
            .from(subscriptions)
            .leftJoin(profile_subscriptions, eq(subscriptions.id, profile_subscriptions.subscription_id))
            .where(eq(subscriptions.user_id, userId))
            .orderBy(desc(subscriptions.created_at));
    }

    async getGroupedSubscriptions(userId: string) {
        const results = await this.db.select({
            id: subscriptions.id,
            name: subscriptions.name,
            group_name: subscription_groups.name,
            sort_order: subscription_groups.sort_order
        })
            .from(subscriptions)
            .leftJoin(subscription_groups, eq(subscriptions.group_id, subscription_groups.id))
            .where(eq(subscriptions.user_id, userId))
            .orderBy(asc(subscription_groups.sort_order), asc(subscription_groups.name), asc(subscriptions.name));

        const grouped: Record<string, { id: string; name: string }[]> = {};
        const groupOrder: Record<string, number> = {};
        const ungroupedName = '未分组';

        for (const sub of results) {
            const groupName = sub.group_name || ungroupedName;
            if (!grouped[groupName]) {
                grouped[groupName] = [];
                groupOrder[groupName] = sub.sort_order ?? Infinity;
            }
            grouped[groupName].push({ id: sub.id, name: sub.name });
        }

        return Object.keys(grouped)
            .sort((a, b) => {
                const orderA = groupOrder[a];
                const orderB = groupOrder[b];
                if (orderA !== orderB) return orderA - orderB;
                return a.localeCompare(b);
            })
            .map(groupName => ({
                group_name: groupName,
                subscriptions: grouped[groupName],
            }));
    }

    async getSubscriptionSelectors(userId: string) {
        return await this.db.select({ id: subscriptions.id, name: subscriptions.name }).from(subscriptions).where(eq(subscriptions.user_id, userId));
    }

    async getSubscriptionById(id: string, userId: string): Promise<{ id: string; url: string } | null> {
        const res = await this.db.select({ id: subscriptions.id, url: subscriptions.url })
            .from(subscriptions)
            .where(and(eq(subscriptions.id, id), eq(subscriptions.user_id, userId)))
            .limit(1);
        return res[0] || null;
    }

    async createSubscription(userId: string, body: { name: string; url: string }) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.insert(subscriptions).values({
            id,
            user_id: userId,
            name: body.name,
            url: body.url,
            updated_at: now,
            created_at: now
        });
        return { id };
    }

    async updateSingleSubscription(sub: { id: string; url: string }): Promise<{ success: boolean; data?: any; error?: string }> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(sub.url, {
                headers: { 'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)] },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }

            const userInfoHeader = response.headers.get('subscription-userinfo');
            const rawContent = await response.text();

            try {
                const errorJson = JSON.parse(rawContent);
                if (errorJson.message || errorJson.error) {
                    throw new Error(`Provider error: ${errorJson.message || errorJson.error}`);
                }
            } catch (e) { }

            const nodes = parseSubscriptionContent(rawContent);
            const nodeCount = nodes.length;

            if (nodeCount === 0 && !userInfoHeader) {
                throw new Error('Update failed: No nodes found in subscription content and no user info provided.');
            }

            const details = this.parseSubscriptionDetails(userInfoHeader, nodes);
            const now = new Date().toISOString();
            const oldInfoString = `Parsed from headers: ${userInfoHeader || 'N/A'}. Parsed from nodes: ${nodes.map(n => n.name).join(', ')}`;

            await this.db.update(subscriptions)
                .set({
                    node_count: nodeCount,
                    last_updated: now,
                    error: null,
                    expires_at: details.expiresAt,
                    subscription_info: oldInfoString,
                    remaining_traffic: details.remainingTraffic,
                    remaining_days: details.remainingDays
                })
                .where(eq(subscriptions.id, sub.id));

            const updatedSub = await this.db.select().from(subscriptions).where(eq(subscriptions.id, sub.id)).limit(1).then(r => r[0]);
            return { success: true, data: updatedSub };

        } catch (error: any) {
            clearTimeout(timeoutId);
            let errorMessage = `Update failed: ${error.message}`;
            if (error.name === 'AbortError') errorMessage = 'Update failed: The request timed out after 10 seconds.';

            await this.db.update(subscriptions)
                .set({ last_updated: new Date().toISOString(), error: errorMessage })
                .where(eq(subscriptions.id, sub.id));

            const updatedSub = await this.db.select().from(subscriptions).where(eq(subscriptions.id, sub.id)).limit(1).then(r => r[0]);
            return { success: false, error: errorMessage, data: updatedSub };
        }
    }

    async updateAllSubscriptions(userId: string) {
        const subs = await this.db.select({ id: subscriptions.id, url: subscriptions.url })
            .from(subscriptions)
            .where(and(eq(subscriptions.user_id, userId), eq(subscriptions.enabled, 1)));

        if (!subs || subs.length === 0) return { updatedCount: 0, failedCount: 0 };

        const CONCURRENCY_LIMIT = 5;
        let updatedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < subs.length; i += CONCURRENCY_LIMIT) {
            const chunk = subs.slice(i, i + CONCURRENCY_LIMIT);
            const promises = chunk.map(sub => this.updateSingleSubscription(sub));
            const results = await Promise.all(promises);

            for (const result of results) {
                if (result.success) updatedCount++;
                else failedCount++;
            }
        }
        return { updatedCount, failedCount };
    }

    async deleteSubscription(id: string, userId: string) {
        await this.db.delete(subscriptions).where(and(eq(subscriptions.id, id), eq(subscriptions.user_id, userId)));
    }

    async updateSubscription(id: string, userId: string, body: any) {
        const now = new Date().toISOString();
        await this.db.update(subscriptions)
            .set({ name: body.name, url: body.url, updated_at: now })
            .where(and(eq(subscriptions.id, id), eq(subscriptions.user_id, userId)));
    }

    async batchImport(userId: string, subs: any[], groupId?: string) {
        if (!Array.isArray(subs) || subs.length === 0) {
            throw new Error('No subscriptions to import');
        }

        const now = new Date().toISOString();
        const values = subs.map(sub => ({
            id: crypto.randomUUID(),
            user_id: userId,
            name: sub.name,
            url: sub.url,
            group_id: groupId || null,
            updated_at: now,
            created_at: now
        }));

        const CHUNK_SIZE = 50;
        for (let i = 0; i < values.length; i += CHUNK_SIZE) {
            await this.db.insert(subscriptions).values(values.slice(i, i + CHUNK_SIZE));
        }
        return subs.length;
    }

    async batchDelete(userId: string, ids: string[]) {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error('No subscription IDs provided');
        }

        const CHUNK_SIZE = 50;
        let totalDeleted = 0;

        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            const chunk = ids.slice(i, i + CHUNK_SIZE);
            const res = await this.db.delete(subscriptions).where(and(eq(subscriptions.user_id, userId), inArray(subscriptions.id, chunk)));
            totalDeleted += res.meta.changes || 0;
        }
        return totalDeleted;
    }

    async clearAllSubscriptions(userId: string) {
        const { meta } = await this.db.delete(subscriptions).where(eq(subscriptions.user_id, userId));
        return meta.changes || 0;
    }

    async clearSubscriptionsByGroup(userId: string, groupId: string | null) {
        let whereClause;
        if (groupId) {
            whereClause = and(eq(subscriptions.user_id, userId), eq(subscriptions.group_id, groupId));
        } else {
            whereClause = and(eq(subscriptions.user_id, userId), isNull(subscriptions.group_id));
        }

        const { meta } = await this.db.delete(subscriptions).where(whereClause);
        return meta.changes || 0;
    }

    async getSubscriptionRules(subscriptionId: string, userId: string) {
        return await this.db.select().from(subscription_rules)
            .where(and(eq(subscription_rules.subscription_id, subscriptionId), eq(subscription_rules.user_id, userId)))
            .orderBy(asc(subscription_rules.sort_order));
    }

    async createSubscriptionRule(subscriptionId: string, userId: string, body: any) {
        const now = new Date().toISOString();
        await this.db.insert(subscription_rules).values({
            subscription_id: subscriptionId,
            user_id: userId,
            name: body.name,
            type: body.type,
            value: body.value,
            enabled: body.enabled ? 1 : 0,
            created_at: now,
            updated_at: now
        });
    }

    async updateSubscriptionRule(ruleId: string, userId: string, body: any) {
        const now = new Date().toISOString();
        const id = Number(ruleId); if (isNaN(id)) throw new Error('Invalid rule ID');

        if (typeof body.enabled !== 'undefined' && Object.keys(body).length === 1) {
            await this.db.update(subscription_rules)
                .set({ enabled: body.enabled ? 1 : 0, updated_at: now })
                .where(and(eq(subscription_rules.id, id), eq(subscription_rules.user_id, userId)));
        } else if (typeof body.sort_order !== 'undefined' && Object.keys(body).length === 1) {
            await this.db.update(subscription_rules)
                .set({ sort_order: body.sort_order, updated_at: now })
                .where(and(eq(subscription_rules.id, id), eq(subscription_rules.user_id, userId)));
        } else {
            await this.db.update(subscription_rules)
                .set({
                    name: body.name,
                    type: body.type,
                    value: body.value,
                    enabled: body.enabled ? 1 : 0,
                    updated_at: now
                })
                .where(and(eq(subscription_rules.id, id), eq(subscription_rules.user_id, userId)));
        }
    }

    async deleteSubscriptionRule(ruleId: string, userId: string) {
        const id = Number(ruleId);
        await this.db.delete(subscription_rules).where(and(eq(subscription_rules.id, id), eq(subscription_rules.user_id, userId)));
    }

    async previewSubscription(url: string, userId: string, subscriptionId?: string, applyRules?: boolean) {
        const response = await fetch(url, {
            headers: { 'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)] },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch subscription: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        let content = decoder.decode(buffer, { stream: true });

        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }

        let finalNodes = parseSubscriptionContent(content);

        if (applyRules && subscriptionId) {
            let combinedRules = [];

            const subscription = await this.db.select({ group_id: subscriptions.group_id })
                .from(subscriptions)
                .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.user_id, userId)))
                .limit(1)
                .then(r => r[0]);

            if (subscription && subscription.group_id) {
                const groupRules = await this.db.select().from(subscription_group_rules)
                    .where(and(
                        eq(subscription_group_rules.group_id, subscription.group_id),
                        eq(subscription_group_rules.user_id, userId),
                        eq(subscription_group_rules.enabled, 1)
                    ))
                    .orderBy(asc(subscription_group_rules.sort_order));

                if (groupRules) combinedRules.push(...groupRules);
            }

            const subRules = await this.db.select().from(subscription_rules)
                .where(and(
                    eq(subscription_rules.subscription_id, subscriptionId),
                    eq(subscription_rules.user_id, userId),
                    eq(subscription_rules.enabled, 1)
                ))
                .orderBy(asc(subscription_rules.sort_order));

            if (subRules) combinedRules.push(...subRules);

            if (combinedRules.length > 0) {
                finalNodes = applySubscriptionRules(finalNodes, combinedRules);
            }
        }

        const analysis = {
            total: finalNodes.length,
            protocols: finalNodes.reduce((acc, node) => {
                const protocol = node.protocol || 'unknown';
                acc[protocol] = (acc[protocol] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            regions: finalNodes.reduce((acc, node) => {
                const match = node.name.match(/\[(.*?)\]|\((.*?)\)|(香港|澳门|台湾|新加坡|日本|美国|英国|德国|法国|韩国|俄罗斯|IEPL|IPLC)/);
                const region = match ? (match[1] || match[2] || match[3] || 'Unknown') : 'Unknown';
                acc[region] = (acc[region] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
        };

        return { nodes: finalNodes, analysis };
    }

    async batchUpdateGroup(userId: string, subscriptionIds: string[], groupId: string | null) {
        if (!Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
            throw new Error('No subscription IDs provided');
        }

        const now = new Date().toISOString();
        await this.db.update(subscriptions)
            .set({ group_id: groupId, updated_at: now })
            .where(and(eq(subscriptions.user_id, userId), inArray(subscriptions.id, subscriptionIds)));
    }

    async batchUpdateUrls(userId: string, updates: { id: string; url: string }[]) {
        if (!Array.isArray(updates) || updates.length === 0) {
            throw new Error('No updates provided');
        }

        const now = new Date().toISOString();
        const batch = updates.map(update =>
            this.db.update(subscriptions)
                .set({ url: update.url, updated_at: now })
                .where(and(eq(subscriptions.id, update.id), eq(subscriptions.user_id, userId)))
        );

        if (batch.length > 0) {
            await this.db.batch(batch as any);
        }
    }

    async clearFailed(userId: string, groupId: string | null | 'all') {
        let whereClause;
        if (groupId && groupId !== 'all') {
            whereClause = and(eq(subscriptions.user_id, userId), isNotNull(subscriptions.error), eq(subscriptions.group_id, groupId));
        } else if (groupId === null) {
            whereClause = and(eq(subscriptions.user_id, userId), isNotNull(subscriptions.error), isNull(subscriptions.group_id));
        } else {
            whereClause = and(eq(subscriptions.user_id, userId), isNotNull(subscriptions.error));
        }

        const { meta } = await this.db.delete(subscriptions).where(whereClause);
        return meta.changes || 0;
    }
}
