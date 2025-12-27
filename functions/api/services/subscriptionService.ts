import type { Env } from '../utils/types';
import { ParsedNode } from '../../../src/utils/nodeParser';
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

export class SubscriptionService {
    private db: D1Database;

    constructor(env: Env) {
        this.db = env.DB;
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
        const { results } = await this.db.prepare(`
            SELECT s.*, ps.profile_id
            FROM subscriptions s
            LEFT JOIN profile_subscriptions ps ON s.id = ps.subscription_id
            WHERE s.user_id = ?
            ORDER BY s.created_at DESC
        `).bind(userId).all();
        return results;
    }

    async getGroupedSubscriptions(userId: string) {
        const { results: subscriptions } = await this.db.prepare(`
            SELECT s.id, s.name, sg.name as group_name, sg.sort_order
            FROM subscriptions s
            LEFT JOIN subscription_groups sg ON s.group_id = sg.id
            WHERE s.user_id = ?
            ORDER BY sg.sort_order ASC, sg.name ASC, s.name ASC
        `).bind(userId).all<{ id: string; name: string; group_name: string | null; sort_order: number | null }>();

        const grouped: Record<string, { id: string; name: string }[]> = {};
        const groupOrder: Record<string, number> = {};
        const ungroupedName = '未分组';

        if (subscriptions) {
            for (const sub of subscriptions) {
                const groupName = sub.group_name || ungroupedName;
                if (!grouped[groupName]) {
                    grouped[groupName] = [];
                    groupOrder[groupName] = sub.sort_order ?? Infinity;
                }
                grouped[groupName].push({ id: sub.id, name: sub.name });
            }
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

    async createSubscription(userId: string, body: { name: string; url: string }) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await this.db.prepare(
            `INSERT INTO subscriptions (id, user_id, name, url, updated_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(id, userId, body.name, body.url, now, now).run();
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

            await this.db.prepare(
                `UPDATE subscriptions
                 SET node_count = ?, last_updated = ?, error = NULL, expires_at = ?, subscription_info = ?, remaining_traffic = ?, remaining_days = ?
                 WHERE id = ?`
            ).bind(nodeCount, now, details.expiresAt, oldInfoString, details.remainingTraffic, details.remainingDays, sub.id).run();

            const updatedSub = await this.db.prepare('SELECT * FROM subscriptions WHERE id = ?').bind(sub.id).first();
            return { success: true, data: updatedSub };

        } catch (error: any) {
            clearTimeout(timeoutId);
            let errorMessage = `Update failed: ${error.message}`;
            if (error.name === 'AbortError') errorMessage = 'Update failed: The request timed out after 10 seconds.';

            await this.db.prepare('UPDATE subscriptions SET last_updated = ?, error = ? WHERE id = ?').bind(new Date().toISOString(), errorMessage, sub.id).run();
            const updatedSub = await this.db.prepare('SELECT * FROM subscriptions WHERE id = ?').bind(sub.id).first();
            return { success: false, error: errorMessage, data: updatedSub };
        }
    }

    async updateAllSubscriptions(userId: string) {
        const { results: subs } = await this.db.prepare(
            'SELECT id, url FROM subscriptions WHERE user_id = ? AND enabled = 1'
        ).bind(userId).all<{ id: string; url: string }>();

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
        await this.db.prepare('DELETE FROM subscriptions WHERE id = ? AND user_id = ?').bind(id, userId).run();
    }

    async updateSubscription(id: string, userId: string, body: any) {
        const now = new Date().toISOString();
        await this.db.prepare(
            `UPDATE subscriptions SET name = ?, url = ?, updated_at = ?
              WHERE id = ? AND user_id = ?`
        ).bind(body.name, body.url, now, id, userId).run();
    }
    async batchImport(userId: string, subs: any[], groupId?: string) {
        if (!Array.isArray(subs) || subs.length === 0) {
            throw new Error('No subscriptions to import');
        }

        const now = new Date().toISOString();
        const stmts = subs.map(sub => {
            const id = crypto.randomUUID();
            return this.db.prepare(
                `INSERT INTO subscriptions (id, user_id, name, url, group_id, updated_at, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
            ).bind(id, userId, sub.name, sub.url, groupId || null, now, now);
        });

        await this.db.batch(stmts);
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
            const placeholders = chunk.map(() => '?').join(',');
            const query = `DELETE FROM subscriptions WHERE user_id = ? AND id IN (${placeholders})`;
            const bindings = [userId, ...chunk];
            const { meta } = await this.db.prepare(query).bind(...bindings).run();
            totalDeleted += meta.changes || 0;
        }
        return totalDeleted;
    }

    async clearAllSubscriptions(userId: string) {
        const CHUNK_SIZE = 50;
        const { results: subs } = await this.db.prepare('SELECT id FROM subscriptions WHERE user_id = ?').bind(userId).all<{ id: string }>();

        if (!subs || subs.length === 0) return 0;

        const idsToDelete = subs.map(sub => sub.id);
        let totalDeleted = 0;

        for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
            const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
            const placeholders = chunk.map(() => '?').join(',');
            const query = `DELETE FROM subscriptions WHERE user_id = ? AND id IN (${placeholders})`;
            const bindings = [userId, ...chunk];
            const { meta: { changes } } = await this.db.prepare(query).bind(...bindings).run();
            totalDeleted += changes || 0;
        }
        return totalDeleted;
    }

    async clearSubscriptionsByGroup(userId: string, groupId: string | null) {
        let query;
        if (groupId) {
            query = this.db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND group_id = ?').bind(userId, groupId);
        } else {
            query = this.db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND group_id IS NULL').bind(userId);
        }

        const { results: subs } = await query.all<{ id: string }>();
        if (!subs || subs.length === 0) return 0;

        const idsToDelete = subs.map(sub => sub.id);
        const CHUNK_SIZE = 50;
        let totalDeleted = 0;

        for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
            const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
            const placeholders = chunk.map(() => '?').join(',');
            const deleteQuery = `DELETE FROM subscriptions WHERE user_id = ? AND id IN (${placeholders})`;
            const bindings = [userId, ...chunk];
            const { meta: { changes } } = await this.db.prepare(deleteQuery).bind(...bindings).run();
            totalDeleted += changes || 0;
        }
        return totalDeleted;
    }

    async getSubscriptionRules(subscriptionId: string, userId: string) {
        const { results } = await this.db.prepare('SELECT * FROM subscription_rules WHERE subscription_id = ? AND user_id = ? ORDER BY sort_order ASC').bind(subscriptionId, userId).all();
        return results;
    }

    async createSubscriptionRule(subscriptionId: string, userId: string, body: any) {
        const now = new Date().toISOString();
        await this.db.prepare(
            `INSERT INTO subscription_rules (subscription_id, user_id, name, type, value, enabled, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(subscriptionId, userId, body.name, body.type, body.value, body.enabled ? 1 : 0, now, now).run();
    }

    async updateSubscriptionRule(ruleId: string, userId: string, body: any) {
        const now = new Date().toISOString();
        if (typeof body.enabled !== 'undefined' && Object.keys(body).length === 1) {
            await this.db.prepare(
                `UPDATE subscription_rules SET enabled = ?, updated_at = ? WHERE id = ? AND user_id = ?`
            ).bind(body.enabled ? 1 : 0, now, ruleId, userId).run();
        } else if (typeof body.sort_order !== 'undefined' && Object.keys(body).length === 1) {
            await this.db.prepare(
                `UPDATE subscription_rules SET sort_order = ?, updated_at = ? WHERE id = ? AND user_id = ?`
            ).bind(body.sort_order, now, ruleId, userId).run();
        } else {
            await this.db.prepare(
                `UPDATE subscription_rules
                 SET name = ?, type = ?, value = ?, enabled = ?, updated_at = ?
                 WHERE id = ? AND user_id = ?`
            ).bind(body.name, body.type, body.value, body.enabled ? 1 : 0, now, ruleId, userId).run();
        }
    }

    async deleteSubscriptionRule(ruleId: string, userId: string) {
        await this.db.prepare('DELETE FROM subscription_rules WHERE id = ? AND user_id = ?').bind(ruleId, userId).run();
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

            const subscription = await this.db.prepare(
                'SELECT group_id FROM subscriptions WHERE id = ? AND user_id = ?'
            ).bind(subscriptionId, userId).first<{ group_id: string | null }>();

            if (subscription && subscription.group_id) {
                const { results: groupRules } = await this.db.prepare(
                    'SELECT * FROM subscription_group_rules WHERE group_id = ? AND user_id = ? AND enabled = 1 ORDER BY sort_order ASC'
                ).bind(subscription.group_id, userId).all();
                if (groupRules) combinedRules.push(...groupRules);
            }

            const { results: subRules } = await this.db.prepare(
                'SELECT * FROM subscription_rules WHERE subscription_id = ? AND user_id = ? AND enabled = 1 ORDER BY sort_order ASC'
            ).bind(subscriptionId, userId).all();
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

        const placeholders = subscriptionIds.map(() => '?').join(',');
        const now = new Date().toISOString();
        const query = `UPDATE subscriptions SET group_id = ?, updated_at = ? WHERE user_id = ? AND id IN (${placeholders})`;
        const bindings = [groupId ?? null, now, userId, ...subscriptionIds];

        await this.db.prepare(query).bind(...bindings).run();
    }

    async batchUpdateUrls(userId: string, updates: { id: string; url: string }[]) {
        if (!Array.isArray(updates) || updates.length === 0) {
            throw new Error('No updates provided');
        }

        const now = new Date().toISOString();
        const stmts = updates.map(update => {
            return this.db.prepare(
                'UPDATE subscriptions SET url = ?, updated_at = ? WHERE id = ? AND user_id = ?'
            ).bind(update.url, now, update.id, userId);
        });

        await this.db.batch(stmts);
    }

    async clearFailed(userId: string, groupId: string | null | 'all') {
        let query = 'DELETE FROM subscriptions WHERE user_id = ? AND error IS NOT NULL';
        const bindings: any[] = [userId];

        if (groupId && groupId !== 'all') {
            query += ' AND group_id = ?';
            bindings.push(groupId);
        } else if (groupId === null) {
            query += ' AND group_id IS NULL';
        }

        const { meta: { changes } } = await this.db.prepare(query).bind(...bindings).run();
        return changes || 0;
    }
}
