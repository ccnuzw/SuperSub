// 简化的订阅服务实现
export class SubscriptionService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async getSubscriptions(userId: string): Promise<any[]> {
    const { results } = await this.db.prepare(`
      SELECT s.*, ps.profile_id
      FROM subscriptions s
      LEFT JOIN profile_subscriptions ps ON s.id = ps.subscription_id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).bind(userId).all();
    return results || [];
  }

  async createSubscription(userId: string, data: any): Promise<{ id: string }> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.prepare(
        `INSERT INTO subscriptions (id, user_id, name, url, updated_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
        id,
        userId,
        data.name,
        data.url,
        now,
        now
    ).run();

    return { id };
  }

  async updateSubscription(userId: string, id: string, data: any): Promise<void> {
    const now = new Date().toISOString();
    await this.db.prepare(
        `UPDATE subscriptions SET name = ?, url = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`
    ).bind(
        data.name,
        data.url,
        now,
        id,
        userId
    ).run();
  }

  async deleteSubscription(userId: string, id: string): Promise<void> {
    await this.db.prepare(
      'DELETE FROM subscriptions WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();
  }

  async getSubscriptionForPreview(url: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'clash-verge',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subscription: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    let content = decoder.decode(buffer, { stream: true });

    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }

    // Simple node parsing (basic implementation)
    let nodes = 0;
    if (content.includes('proxies:') || content.includes('proxy-groups:')) {
      // YAML format - count proxies
      const proxyMatch = content.match(/proxies:\s*\[[\s\S]*?\]/);
      if (proxyMatch) {
        const nodeMatches = proxyMatch[0].match(/-\s*name:/g);
        nodes = nodeMatches ? nodeMatches.length : 0;
      }
    } else {
      // Try base64 decode first
      try {
        const decoded = atob(content);
        const lines = decoded.split('\n').filter(line =>
          line.startsWith('vmess://') ||
          line.startsWith('ss://') ||
          line.startsWith('trojan://') ||
          line.startsWith('vless://')
        );
        nodes = lines.length;
      } catch {
        // Count links directly
        const lines = content.split('\n').filter(line =>
          line.startsWith('vmess://') ||
          line.startsWith('ss://') ||
          line.startsWith('trojan://') ||
          line.startsWith('vless://')
        );
        nodes = lines.length;
      }
    }

    return {
      nodes: nodes,
      protocols: ['unknown'], // Simplified
      regions: {}, // Simplified
    };
  }
}