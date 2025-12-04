import { Hono } from 'hono';
import * as yaml from 'js-yaml';
import type { Env } from '../utils/types';
import { manualAuthMiddleware } from '../middleware/auth';
import { parseNodeLinks, ParsedNode } from '../../../src/utils/nodeParser';

const subscriptions = new Hono<{ Bindings: Env }>();
subscriptions.use('*', manualAuthMiddleware);

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

// Helper function to parse subscription content into a node list
export const parseSubscriptionContent = (content: string): (ParsedNode & { id: string, raw: string })[] => {
    let nodes: (ParsedNode & { id: string, raw: string })[] = [];
    let isYaml = false;

    // 1. Try parsing as YAML
    try {
        if (content.includes('proxies:') || content.includes('proxy-groups:')) {
            const data = yaml.load(content) as any;
            if (data && Array.isArray(data.proxies)) {
                isYaml = true;
                nodes = data.proxies.map((proxy: any) => {
                    const protocol = proxy.type;
                    return {
                        id: crypto.randomUUID(),
                        name: proxy.name,
                        protocol: protocol,
                        server: proxy.server,
                        port: proxy.port,
                        type: protocol,
                        password: proxy.password || proxy.uuid,
                        protocol_params: proxy,
                        link: `clash://${protocol}/${proxy.name}`,
                        raw: `clash://${protocol}/${proxy.name}`,
                    };
                });
            }
        }
    } catch (e) {
        console.log("YAML parsing failed, trying as plain text.");
    }

    // 2. If not YAML, try parsing as base64 encoded list
    if (!isYaml) {
        try {
            const decodedContent = atob(content);
             if (decodedContent.includes('proxies:') || decodedContent.includes('proxy-groups:')) {
                 const data = yaml.load(decodedContent) as any;
                 if (data && Array.isArray(data.proxies)) {
                     isYaml = true;
                     nodes = data.proxies.map((proxy: any) => ({
                        id: crypto.randomUUID(),
                        name: proxy.name,
                        protocol: proxy.type,
                        server: proxy.server,
                        port: proxy.port,
                        type: proxy.type,
                        password: proxy.password || proxy.uuid,
                        protocol_params: proxy,
                        link: `clash://${proxy.type}/${proxy.name}`,
                        raw: `clash://${proxy.type}/${proxy.name}`,
                     }));
                 }
             } else {
                nodes = parseNodeLinks(decodedContent);
             }
        } catch (e) {
            nodes = parseNodeLinks(content);
        }
    }
    
    // 3. If still no nodes, treat as plain text list of links
    if (nodes.length === 0 && !isYaml) {
        nodes = parseNodeLinks(content);
    }

    return nodes;
};

// Helper function to get accurate node count from subscription content
const getAccurateNodeCount = (content: string): number => {
    try {
        const nodes = parseSubscriptionContent(content);
        return nodes.length;
    } catch (error) {
        console.error("Failed to get accurate node count:", error);
        return 0;
    }
};

// Helper function to apply rules to a list of nodes
export const applySubscriptionRules = (nodes: (ParsedNode & { id: string; raw: string; })[], rules: any[]): (ParsedNode & { id: string; raw: string; })[] => {
    let processedNodes = [...nodes];

    for (const rule of rules) {
        if (!rule.enabled) continue;

        try {
            if (rule.type === 'filter_by_name_keyword' || rule.type === 'exclude_by_name_keyword') {
                // These rules expect a simple string of keywords, separated by commas or newlines.
                const keywords = rule.value.split(/[\n,|]+/).map((k: string) => k.trim().toLowerCase()).filter(Boolean);
                if (keywords.length === 0) continue;

                if (rule.type === 'filter_by_name_keyword') {
                    processedNodes = processedNodes.filter(node => {
                        const lowerCaseName = node.name.toLowerCase();
                        return keywords.some((keyword: string) => lowerCaseName.includes(keyword));
                    });
                } else { // exclude_by_name_keyword
                    processedNodes = processedNodes.filter(node => {
                        const lowerCaseName = node.name.toLowerCase();
                        return !keywords.some((keyword: string) => lowerCaseName.includes(keyword));
                    });
                }
            }
            else if (rule.type === 'filter_by_name_regex' || rule.type === 'rename_by_regex') {
                // These rules expect a JSON string.
                const value = JSON.parse(rule.value);

                if (rule.type === 'filter_by_name_regex' && value.regex) {
                    const ignoreCase = value.regex.startsWith('(?i)');
                    const pattern = ignoreCase ? value.regex.substring(4) : value.regex;
                    const regex = new RegExp(pattern, ignoreCase ? 'i' : '');
                    processedNodes = processedNodes.filter(node => regex.test(node.name));
                }
                else if (rule.type === 'rename_by_regex' && value.regex && typeof value.format !== 'undefined') {
                    const ignoreCase = value.regex.startsWith('(?i)');
                    const pattern = ignoreCase ? value.regex.substring(4) : value.regex;
                    const regex = new RegExp(pattern, ignoreCase ? 'gi' : 'g'); // Use global flag for replace
                    processedNodes = processedNodes.map(node => {
                        return { ...node, name: node.name.replace(regex, value.format) };
                    });
                }
            }
        } catch (e) {
            console.error(`Error applying rule ${rule.id} (${rule.name}):`, e);
        }
    }

    return processedNodes;
};


// Helper to convert size string (e.g., "10.5 GB") to bytes
const sizeToBytes = (sizeStr: string): number => {
    if (!sizeStr) return 0;
    
    // Clean the string: remove '+' and trim whitespace.
    const cleanedStr = sizeStr.replace(/\+/g, ' ').trim();
    
    const match = cleanedStr.match(/^([\d.]+)\s*(T|G|M|K)?B?$/i);
    if (!match) {
        return 0;
    }

    const size = parseFloat(match[1]);
    const unit = (match[2] || '').toUpperCase();

    switch (unit) {
        case 'T': return size * Math.pow(1024, 4);
        case 'G': return size * Math.pow(1024, 3);
        case 'M': return size * Math.pow(1024, 2);
        case 'K': return size * 1024;
        default: return size;
    }
};

// New, more robust parser for subscription details
const parseSubscriptionDetails = (
    userInfoHeader: string | null,
    nodes: (ParsedNode & { id: string, raw: string })[]
): { remainingTraffic: number | null; remainingDays: number | null; expiresAt: string | null } => {
    let remainingTraffic: number | null = null;
    let expiresAt: Date | null = null;

    // ---
    // Step 1: Parse from node names first, as they are often more accurate.
    // ---
    for (const node of nodes) {
        const name = node.name;

        // Parse expiry date if not already found
        if (!expiresAt) {
            const expiryDateMatch = name.match(/(?:到期|套餐到期)[\:：\s]*(\d{4}-\d{2}-\d{2})/i);
            if (expiryDateMatch && expiryDateMatch[1]) {
                const date = new Date(expiryDateMatch[1]);
                if (!isNaN(date.getTime())) {
                    expiresAt = date;
                }
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

        // Parse traffic if not already found
        if (remainingTraffic === null) {
            // Skip nodes that are clearly about time to avoid confusion
            if (/天/i.test(name) && !/流量/i.test(name)) {
                continue;
            }

            // Try to match with units first (e.g., "50 GB", "1024 MB")
            const regexWithUnit = /(?:剩余流量|流量)[\:：\s]*([\d.]+[\s+]*[TGMK]?B)/i;
            const trafficMatchWithUnit = name.match(regexWithUnit);
            if (trafficMatchWithUnit && trafficMatchWithUnit[1]) {
                remainingTraffic = sizeToBytes(trafficMatchWithUnit[1]);
                continue; // Found it, continue to next node to potentially find expiry
            }

            // If no unit match, try to match unitless numbers (specifically for "0" or other raw numbers)
            const regexWithoutUnit = /(?:剩余流量|流量)[\:：\s]*(\d+(?:\.\d+)?)/i;
            const trafficMatchWithoutUnit = name.match(regexWithoutUnit);
            if (trafficMatchWithoutUnit && trafficMatchWithoutUnit[1] && typeof trafficMatchWithoutUnit.index === 'number') {
                // Check context to avoid misinterpreting other numbers as traffic
                const startIndex = trafficMatchWithoutUnit.index;
                const context = name.substring(startIndex, startIndex + trafficMatchWithoutUnit[0].length + 5);
                if (!/[TGMK]B/i.test(context)) {
                    remainingTraffic = parseFloat(trafficMatchWithoutUnit[1]);
                }
            }
        }
        
        // If both are found, we can stop iterating
        if (remainingTraffic !== null && expiresAt) {
            break;
        }
    }

    // ---
    // Step 2: Fallback to subscription-userinfo header if data is still missing.
    // ---
    if (userInfoHeader) {
        const info: any = {};
        userInfoHeader.split(';').forEach(part => {
            const [key, value] = part.split('=').map(s => s.trim());
            if (key && value) {
                const parsedValue = parseFloat(value);
                info[key] = isNaN(parsedValue) ? 0 : parsedValue;
            }
        });

        // Only use header data if it wasn't found in the node names
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
        // Set time to 00:00:00 to compare dates only
        now.setHours(0, 0, 0, 0);
        const expiryDate = new Date(expiresAt);
        expiryDate.setHours(0, 0, 0, 0);
        
        const diffTime = expiryDate.getTime() - now.getTime();
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const result = {
        remainingTraffic: remainingTraffic,
        remainingDays: remainingDays,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
    };
    return result;
};


subscriptions.get('/', async (c) => {
    const user = c.get('jwtPayload');
    const { results } = await c.env.DB.prepare(`
      SELECT s.*, ps.profile_id
      FROM subscriptions s
      LEFT JOIN profile_subscriptions ps ON s.id = ps.subscription_id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).bind(user.id).all();
    return c.json({ success: true, data: results });
});

subscriptions.get('/for-select', async (c) => {
    const user = c.get('jwtPayload');
    const { results } = await c.env.DB.prepare('SELECT id, name FROM subscriptions WHERE user_id = ?').bind(user.id).all();
    return c.json({ success: true, data: results });
});
subscriptions.get('/grouped', async (c) => {
    const user = c.get('jwtPayload');
    const { results: subscriptions } = await c.env.DB.prepare(`
        SELECT s.id, s.name, sg.name as group_name, sg.sort_order
        FROM subscriptions s
        LEFT JOIN subscription_groups sg ON s.group_id = sg.id
        WHERE s.user_id = ?
        ORDER BY sg.sort_order ASC, sg.name ASC, s.name ASC
    `).bind(user.id).all<{ id: string; name: string; group_name: string | null; sort_order: number | null }>();

    const grouped: Record<string, { id: string; name: string }[]> = {};
    const groupOrder: Record<string, number> = {};
    const ungroupedName = '未分组';

    if (subscriptions) {
        for (const sub of subscriptions) {
            const groupName = sub.group_name || ungroupedName;
            if (!grouped[groupName]) {
                grouped[groupName] = [];
                // Assign a large number for sort_order if it's null (ungrouped) to push it to the end.
                groupOrder[groupName] = sub.sort_order ?? Infinity;
            }
            grouped[groupName].push({ id: sub.id, name: sub.name });
        }
    }

    const sortedGroupedSubscriptions = Object.keys(grouped)
        .sort((a, b) => {
            const orderA = groupOrder[a];
            const orderB = groupOrder[b];
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            // Fallback to localeCompare if order is the same (e.g., multiple groups with no sort_order)
            return a.localeCompare(b);
        })
        .map(groupName => ({
            group_name: groupName,
            subscriptions: grouped[groupName],
        }));


    return c.json({ success: true, data: sortedGroupedSubscriptions });
});

subscriptions.post('/', async (c) => {
    const user = c.get('jwtPayload');
    const body = await c.req.json<any>();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await c.env.DB.prepare(
        `INSERT INTO subscriptions (id, user_id, name, url, updated_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
        id,
        user.id,
        body.name,
        body.url,
        now,
        now
    ).run();
    return c.json({ success: true, data: { id } }, 201);
});

subscriptions.post('/batch-import', async (c) => {
    const user = c.get('jwtPayload');
    const { subscriptions: subs, groupId } = await c.req.json<{ subscriptions: any[], groupId?: string }>();

    if (!Array.isArray(subs) || subs.length === 0) {
        return c.json({ success: false, message: 'No subscriptions to import' }, 400);
    }

    const now = new Date().toISOString();
    const stmts = subs.map(sub => {
        const id = crypto.randomUUID();
        return c.env.DB.prepare(
            `INSERT INTO subscriptions (id, user_id, name, url, group_id, updated_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, user.id, sub.name, sub.url, groupId || null, now, now);
    });

    await c.env.DB.batch(stmts);

    return c.json({ success: true, data: { message: `Successfully imported ${subs.length} subscriptions.` } });
});

// This function will be called by both individual and batch updates.
const updateSingleSubscription = async (db: D1Database, sub: { id: string; url: string }): Promise<{ success: boolean; data?: any; error?: string }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

    try {
        const response = await fetch(sub.url, {
            headers: { 'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)] },
            signal: controller.signal,
        });
        clearTimeout(timeoutId); // Clear the timeout if the fetch completes in time

        if (!response.ok) {
            const error = `Failed to fetch: ${response.status} ${response.statusText}`;
            await db.prepare('UPDATE subscriptions SET last_updated = ?, error = ? WHERE id = ?').bind(new Date().toISOString(), error, sub.id).run();
            const updatedSub = await db.prepare('SELECT * FROM subscriptions WHERE id = ?').bind(sub.id).first();
            return { success: false, error, data: updatedSub };
        }

        const userInfoHeader = response.headers.get('subscription-userinfo');
        const rawContent = await response.text();

        // Early check for JSON error messages from the provider
        try {
            const errorJson = JSON.parse(rawContent);
            if (errorJson.message || errorJson.error) {
                const errorMessage = `Provider error: ${errorJson.message || errorJson.error}`;
                await db.prepare('UPDATE subscriptions SET last_updated = ?, error = ? WHERE id = ?').bind(new Date().toISOString(), errorMessage, sub.id).run();
                const updatedSub = await db.prepare('SELECT * FROM subscriptions WHERE id = ?').bind(sub.id).first();
                return { success: false, error: errorMessage, data: updatedSub };
            }
        } catch (e) {
            // Not a JSON error, proceed as normal
        }

        // 1. Parse content into structured nodes
        const nodes = parseSubscriptionContent(rawContent);
        const nodeCount = nodes.length;

        // If no nodes were parsed and there's no user info header, it's likely an invalid or empty subscription.
        if (nodeCount === 0 && !userInfoHeader) {
            const error = 'Update failed: No nodes found in subscription content and no user info provided.';
            await db.prepare('UPDATE subscriptions SET last_updated = ?, error = ? WHERE id = ?').bind(new Date().toISOString(), error, sub.id).run();
            const updatedSub = await db.prepare('SELECT * FROM subscriptions WHERE id = ?').bind(sub.id).first();
            return { success: false, error, data: updatedSub };
        }

        // 2. Parse subscription details using the new robust parser
        const details = parseSubscriptionDetails(userInfoHeader, nodes);

        // 3. Prepare data for database update
        const now = new Date().toISOString();
        const oldInfoString = `Parsed from headers: ${userInfoHeader || 'N/A'}. Parsed from nodes: ${nodes.map(n => n.name).join(', ')}`;

        await db.prepare(
            `UPDATE subscriptions
             SET
                node_count = ?,
                last_updated = ?,
                error = NULL,
                expires_at = ?,
                subscription_info = ?,
                remaining_traffic = ?,
                remaining_days = ?
             WHERE id = ?`
        ).bind(
            nodeCount,
            now,
            details.expiresAt,
            oldInfoString, // Store original info for debugging if needed
            details.remainingTraffic,
            details.remainingDays,
            sub.id
        ).run();

        const updatedSub = await db.prepare('SELECT * FROM subscriptions WHERE id = ?').bind(sub.id).first();

        return { success: true, data: updatedSub };

    } catch (error: any) {
        clearTimeout(timeoutId);
        let errorMessage = `Update failed: ${error.message}`;
        if (error.name === 'AbortError') {
            errorMessage = 'Update failed: The request timed out after 10 seconds.';
        }
        await db.prepare('UPDATE subscriptions SET last_updated = ?, error = ? WHERE id = ?').bind(new Date().toISOString(), errorMessage, sub.id).run();
        const updatedSub = await db.prepare('SELECT * FROM subscriptions WHERE id = ?').bind(sub.id).first();
        return { success: false, error: errorMessage, data: updatedSub };
    }
};


subscriptions.post('/update-all', async (c) => {
    const user = c.get('jwtPayload');
    const { results: subs } = await c.env.DB.prepare(
        'SELECT id, url FROM subscriptions WHERE user_id = ? AND enabled = 1'
    ).bind(user.id).all<{ id: string; url: string }>();

    if (!subs || subs.length === 0) {
        return c.json({ success: true, message: 'No enabled subscriptions to update.' });
    }

    const CONCURRENCY_LIMIT = 5;
    let updatedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < subs.length; i += CONCURRENCY_LIMIT) {
        const chunk = subs.slice(i, i + CONCURRENCY_LIMIT);
        const promises = chunk.map(sub => updateSingleSubscription(c.env.DB, sub));
        
        const results = await Promise.all(promises);

        for (const result of results) {
            if (result.success) {
                updatedCount++;
            } else {
                failedCount++;
            }
        }
    }

    return c.json({ success: true, message: `Update complete. ${updatedCount} succeeded, ${failedCount} failed.` });
});

subscriptions.post('/preview', async (c) => {
    const user = c.get('jwtPayload');
    const { url, subscription_id, apply_rules } = await c.req.json<{ url: string, subscription_id?: string, apply_rules?: boolean }>();
    
    if (!url) {
        return c.json({ success: false, message: 'Missing subscription URL' }, 400);
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'clash-verge',
            },
        });

        if (!response.ok) {
            return c.json({ success: false, message: `Failed to fetch subscription: ${response.status} ${response.statusText}` }, 502);
        }

        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        let content = decoder.decode(buffer, { stream: true });

        // Remove BOM if present
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }

        let finalNodes = parseSubscriptionContent(content);

        if (apply_rules && subscription_id) {
            let combinedRules = [];

            // Fetch group_id for the subscription
            const subscription = await c.env.DB.prepare(
                'SELECT group_id FROM subscriptions WHERE id = ? AND user_id = ?'
            ).bind(subscription_id, user.id).first<{ group_id: string | null }>();

            // Fetch and add group rules first
            if (subscription && subscription.group_id) {
                const { results: groupRules } = await c.env.DB.prepare(
                    'SELECT * FROM subscription_group_rules WHERE group_id = ? AND user_id = ? AND enabled = 1 ORDER BY sort_order ASC'
                ).bind(subscription.group_id, user.id).all();
                if (groupRules) {
                    combinedRules.push(...groupRules);
                }
            }

            // Fetch and add subscription-specific rules
            const { results: subRules } = await c.env.DB.prepare(
                'SELECT * FROM subscription_rules WHERE subscription_id = ? AND user_id = ? AND enabled = 1 ORDER BY sort_order ASC'
            ).bind(subscription_id, user.id).all();
            if (subRules) {
                combinedRules.push(...subRules);
            }

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

        return c.json({ success: true, data: { nodes: finalNodes, analysis } });

    } catch (error: any) {
        console.error(`Error fetching/parsing subscription from ${url}:`, error);
        // Provide a more user-friendly message for network or fetch-related errors
        const errorMessage = error.cause?.message?.includes('ECONNRESET') || error.message?.includes('Network connection lost')
            ? '获取订阅超时或网络连接失败'
            : `处理订阅时出错: ${error.message}`;
        return c.json({ success: false, message: errorMessage }, 500);
    }
});

subscriptions.post('/:id/update', async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();

    const subscription = await c.env.DB.prepare('SELECT id, url FROM subscriptions WHERE id = ? AND user_id = ?').bind(id, user.id).first<{ id: string, url: string }>();
    if (!subscription) {
        return c.json({ success: false, message: 'Subscription not found' }, 404);
    }

    const result = await updateSingleSubscription(c.env.DB, subscription);

    if (result.success) {
        return c.json({ success: true, message: `Subscription updated successfully.`, data: result.data });
    } else {
        // Even on failure, we return a 200 OK with success: false
        // The frontend can then handle the error message and update the specific subscription's state
        return c.json({ success: false, message: result.error, data: result.data });
    }
});

subscriptions.get('/:id/rules', async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const { results } = await c.env.DB.prepare('SELECT * FROM subscription_rules WHERE subscription_id = ? AND user_id = ? ORDER BY sort_order ASC').bind(id, user.id).all();
    return c.json({ success: true, data: results });
});

subscriptions.post('/:id/rules', async (c) => {
    const user = c.get('jwtPayload');
    const { id: subscription_id } = c.req.param();
    const body = await c.req.json<any>();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
        `INSERT INTO subscription_rules (subscription_id, user_id, name, type, value, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(subscription_id, user.id, body.name, body.type, body.value, body.enabled ? 1 : 0, now, now).run();

    return c.json({ success: true }, 201);
});

subscriptions.put('/:id/rules/:ruleId', async (c) => {
    const user = c.get('jwtPayload');
    const { ruleId } = c.req.param();
    const body = await c.req.json<any>();
    const now = new Date().toISOString();

    // Check if only 'enabled' or 'sort_order' is being updated for a lighter update
    if (typeof body.enabled !== 'undefined' && Object.keys(body).length === 1) {
        await c.env.DB.prepare(
            `UPDATE subscription_rules SET enabled = ?, updated_at = ? WHERE id = ? AND user_id = ?`
        ).bind(body.enabled ? 1 : 0, now, ruleId, user.id).run();
    } else if (typeof body.sort_order !== 'undefined' && Object.keys(body).length === 1) {
        await c.env.DB.prepare(
            `UPDATE subscription_rules SET sort_order = ?, updated_at = ? WHERE id = ? AND user_id = ?`
        ).bind(body.sort_order, now, ruleId, user.id).run();
    } else {
        await c.env.DB.prepare(
            `UPDATE subscription_rules
             SET name = ?, type = ?, value = ?, enabled = ?, updated_at = ?
             WHERE id = ? AND user_id = ?`
        ).bind(body.name, body.type, body.value, body.enabled ? 1 : 0, now, ruleId, user.id).run();
    }
    
    return c.json({ success: true });
});

subscriptions.delete('/:id/rules/:ruleId', async (c) => {
    const user = c.get('jwtPayload');
    const { ruleId } = c.req.param();

    await c.env.DB.prepare(
        'DELETE FROM subscription_rules WHERE id = ? AND user_id = ?'
    ).bind(ruleId, user.id).run();

    return c.json({ success: true });
});

// Catch-all POST route for /:id to debug the issue
subscriptions.post('/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.text();
    console.log(`DEBUG: Invalid POST request to /subscriptions/${id}`);
    console.log(`Request body: ${body}`);
    console.log(`Content-Type: ${c.req.header('content-type')}`);

    return c.json({
        success: false,
        message: `Invalid route. To update subscription info, use PUT /subscriptions/${id}. To refresh subscription content, use POST /subscriptions/${id}/update.`,
        error: {
            route: `POST /subscriptions/${id}`,
            availableRoutes: [
                `PUT /subscriptions/${id} (update subscription info)`,
                `POST /subscriptions/${id}/update (refresh subscription content)`,
                `DELETE /subscriptions/${id} (delete subscription)`
            ]
        }
    }, 404);
});

subscriptions.put('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    const body = await c.req.json<any>();
    const now = new Date().toISOString();
    await c.env.DB.prepare(
        `UPDATE subscriptions SET name = ?, url = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`
    ).bind(
        body.name,
        body.url,
        now,
        id,
        user.id
    ).run();
    return c.json({ success: true });
});

subscriptions.delete('/:id', async (c) => {
    const user = c.get('jwtPayload');
    const { id } = c.req.param();
    await c.env.DB.prepare('DELETE FROM subscriptions WHERE id = ? AND user_id = ?').bind(id, user.id).run();
    return c.json({ success: true });
});

subscriptions.post('/batch-delete', async (c) => {
    const user = c.get('jwtPayload');
    const { ids } = await c.req.json<{ ids: string[] }>();

    if (!Array.isArray(ids) || ids.length === 0) {
        return c.json({ success: false, message: 'No subscription IDs provided' }, 400);
    }

    const CHUNK_SIZE = 50; // Set a reasonable chunk size to avoid SQL variable limits
    let totalDeleted = 0;

    try {
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            const chunk = ids.slice(i, i + CHUNK_SIZE);
            const placeholders = chunk.map(() => '?').join(',');
            const query = `DELETE FROM subscriptions WHERE user_id = ? AND id IN (${placeholders})`;
            const bindings = [user.id, ...chunk];
            const { meta } = await c.env.DB.prepare(query).bind(...bindings).run();
            totalDeleted += meta.changes || 0;
        }

        return c.json({ success: true, message: `Successfully deleted ${totalDeleted} subscriptions.` });
    } catch (error: any) {
        console.error('Error during batch delete:', error);
        return c.json({ success: false, message: 'An error occurred during batch deletion.' }, 500);
    }
});

// Route to clear all subscriptions for the user
subscriptions.post('/clear-all', async (c) => {
    const user = c.get('jwtPayload');
    const CHUNK_SIZE = 50;

    try {
        // First, get all subscription IDs for the user
        const { results: subs } = await c.env.DB.prepare(
            'SELECT id FROM subscriptions WHERE user_id = ?'
        ).bind(user.id).all<{ id: string }>();

        if (!subs || subs.length === 0) {
            return c.json({ success: true, message: 'No subscriptions to clear.' });
        }

        const idsToDelete = subs.map(sub => sub.id);
        let totalDeleted = 0;

        // Process in chunks
        for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
            const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
            const placeholders = chunk.map(() => '?').join(',');
            const query = `DELETE FROM subscriptions WHERE user_id = ? AND id IN (${placeholders})`;
            const bindings = [user.id, ...chunk];
            const { meta: { changes } } = await c.env.DB.prepare(query).bind(...bindings).run();
            totalDeleted += changes || 0;
        }

        return c.json({ success: true, message: `Successfully cleared ${totalDeleted} subscriptions.` });

    } catch (error: any) {
        console.error('Error clearing all subscriptions:', error);
        return c.json({ success: false, message: 'Failed to clear subscriptions.' }, 500);
    }
});

// Route to clear subscriptions by group ID
subscriptions.post('/clear-by-group', async (c) => {
    const user = c.get('jwtPayload');
    const { groupId } = await c.req.json<{ groupId: string | null }>();
    const CHUNK_SIZE = 50;

    try {
        let query;
        if (groupId) {
            query = c.env.DB.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND group_id = ?').bind(user.id, groupId);
        } else { // For 'ungrouped'
            query = c.env.DB.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND group_id IS NULL').bind(user.id);
        }

        const { results: subs } = await query.all<{ id: string }>();

        if (!subs || subs.length === 0) {
            return c.json({ success: true, message: 'No subscriptions to clear in this group.' });
        }

        const idsToDelete = subs.map(sub => sub.id);
        let totalDeleted = 0;

        // Process in chunks
        for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
            const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
            const placeholders = chunk.map(() => '?').join(',');
            const deleteQuery = `DELETE FROM subscriptions WHERE user_id = ? AND id IN (${placeholders})`;
            const bindings = [user.id, ...chunk];
            const { meta: { changes } } = await c.env.DB.prepare(deleteQuery).bind(...bindings).run();
            totalDeleted += changes || 0;
        }

        return c.json({ success: true, message: `Successfully cleared ${totalDeleted} subscriptions from the group.` });

    } catch (error: any) {
        console.error(`Error clearing subscriptions for group ${groupId}:`, error);
        return c.json({ success: false, message: 'Failed to clear subscriptions from the group.' }, 500);
    }
});

// Route to clear failed subscriptions, optionally by group
subscriptions.post('/clear-failed', async (c) => {
    const user = c.get('jwtPayload');
    const { groupId } = await c.req.json<{ groupId?: string | null }>();
    const CHUNK_SIZE = 50;

    try {
        let query;
        let bindings: (string | number)[] = [user.id];

        if (groupId === 'all' || groupId === undefined) {
            // Clear all failed subscriptions
            query = 'SELECT id FROM subscriptions WHERE user_id = ? AND error IS NOT NULL';
        } else if (groupId === 'ungrouped' || groupId === null) {
            // Clear ungrouped failed subscriptions
            query = 'SELECT id FROM subscriptions WHERE user_id = ? AND group_id IS NULL AND error IS NOT NULL';
        } else {
            // Clear failed subscriptions in a specific group
            query = 'SELECT id FROM subscriptions WHERE user_id = ? AND group_id = ? AND error IS NOT NULL';
            bindings.push(groupId);
        }

        const { results: subs } = await c.env.DB.prepare(query).bind(...bindings).all<{ id: string }>();

        if (!subs || subs.length === 0) {
            return c.json({ success: true, message: '该分组内没有检测到失败的订阅。' });
        }

        const idsToDelete = subs.map(sub => sub.id);
        let totalDeleted = 0;

        // Process in chunks
        for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
            const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
            const deletePlaceholders = chunk.map(() => '?').join(',');
            const deleteQuery = `DELETE FROM subscriptions WHERE user_id = ? AND id IN (${deletePlaceholders})`;
            const deleteBindings = [user.id, ...chunk];
            const { meta: { changes } } = await c.env.DB.prepare(deleteQuery).bind(...deleteBindings).run();
            totalDeleted += changes || 0;
        }

        return c.json({ success: true, message: `成功清除了 ${totalDeleted} 个失败的订阅。` });

    } catch (error: any) {
        console.error('Error clearing failed subscriptions:', error);
        return c.json({ success: false, message: '清除失败的订阅时出错。' }, 500);
    }
});


subscriptions.post('/batch-update-group', async (c) => {
    const user = c.get('jwtPayload');
    const { subscriptionIds, groupId } = await c.req.json<{ subscriptionIds: string[], groupId: string | null }>();

    if (!Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
        return c.json({ success: false, message: 'No subscription IDs provided' }, 400);
    }

    const placeholders = subscriptionIds.map(() => '?').join(',');
    const query = `UPDATE subscriptions SET group_id = ? WHERE user_id = ? AND id IN (${placeholders})`;
    
    const bindings = [groupId, user.id, ...subscriptionIds];
    
    await c.env.DB.prepare(query).bind(...bindings).run();

    return c.json({ success: true, message: 'Subscriptions moved successfully.' });
});

subscriptions.post('/batch-update-urls', async (c) => {
    const user = c.get('jwtPayload');
    const { updates } = await c.req.json<{ updates: { id: string, url: string }[] }>();

    if (!Array.isArray(updates) || updates.length === 0) {
        return c.json({ success: false, message: 'No updates provided' }, 400);
    }

    const now = new Date().toISOString();
    const stmts = updates.map(update => {
        return c.env.DB.prepare(
            `UPDATE subscriptions SET url = ?, updated_at = ? WHERE id = ? AND user_id = ?`
        ).bind(update.url, now, update.id, user.id);
    });

    await c.env.DB.batch(stmts);

    return c.json({ success: true, message: `Successfully updated ${updates.length} subscriptions.` });
});

export default subscriptions;