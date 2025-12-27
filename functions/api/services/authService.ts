import { hash, compare } from 'bcrypt-ts';
import { sign } from 'hono/jwt';
import type { Env } from '../utils/types';

export class AuthService {
    private db: D1Database;
    private jwtSecret: string;

    constructor(env: Env) {
        this.db = env.DB;
        this.jwtSecret = env.JWT_SECRET;
    }

    async register(username: string, password: string): Promise<{ success: boolean; message?: string; data?: any; status: number }> {
        // Check if registration is allowed
        const allowRegistrationSetting = await this.db.prepare(
            `SELECT value FROM system_settings WHERE key = 'allow_registration'`
        ).first<{ value: string }>();

        // Default to 'true' if the setting is not found
        const isRegistrationAllowed = allowRegistrationSetting?.value !== 'false';

        if (!isRegistrationAllowed) {
            return { success: false, message: 'User registration is currently disabled by the administrator.', status: 403 };
        }

        const existingUser = await this.db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
        if (existingUser) {
            return { success: false, message: 'Username already exists', status: 409 };
        }

        const userCountResult = await this.db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'system'").first<{ count: number }>();
        const userCount = userCountResult?.count ?? 0;
        let role = userCount === 0 ? 'admin' : 'user';

        const hashedPassword = await hash(password, 10);
        const id = crypto.randomUUID();
        const subToken = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.db.prepare('INSERT INTO users (id, username, password, role, sub_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, username, hashedPassword, role, subToken, now, now).run();

        return { success: true, data: { id, username, role }, status: 201 };
    }

    async login(username: string, password: string): Promise<{ success: boolean; message?: string; data?: any; status: number }> {
        const user = await this.db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<any>();
        if (!user) {
            return { success: false, message: 'User not found', status: 404 };
        }

        const isPasswordValid = await compare(password, user.password as string);
        if (!isPasswordValid) {
            return { success: false, message: 'Invalid password', status: 401 };
        }

        const payload = { id: user.id, username: user.username, role: user.role || 'user', sub_token: user.sub_token, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) };
        const token = await sign(payload, this.jwtSecret);

        return { success: true, data: { token, user: payload }, status: 200 };
    }
}
