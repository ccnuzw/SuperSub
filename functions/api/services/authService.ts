import { hash, compare } from 'bcrypt-ts';
import { sign } from 'hono/jwt';
import type { Env } from '../utils/types';
import { getDb, DrizzleDB } from '../utils/db';
import { users, system_settings } from '../drizzle/schema';
import { eq, ne, count } from 'drizzle-orm';

export class AuthService {
    private db: DrizzleDB;
    private jwtSecret: string;

    constructor(env: Env) {
        this.db = getDb(env.DB);
        this.jwtSecret = env.JWT_SECRET;
    }

    async register(username: string, password: string): Promise<{ success: boolean; message?: string; data?: any; status: number }> {
        // Check if registration is allowed
        const allowRegistrationSetting = await this.db.select({ value: system_settings.value })
            .from(system_settings)
            .where(eq(system_settings.key, 'allow_registration'))
            .get();

        // Default to 'true' if the setting is not found
        const isRegistrationAllowed = allowRegistrationSetting?.value !== 'false';

        if (!isRegistrationAllowed) {
            return { success: false, message: 'User registration is currently disabled by the administrator.', status: 403 };
        }

        const existingUser = await this.db.select({ id: users.id }).from(users).where(eq(users.username, username)).get();
        if (existingUser) {
            return { success: false, message: 'Username already exists', status: 409 };
        }

        const userCountResult = await this.db.select({ count: count() }).from(users).where(ne(users.role, 'system')).get();
        const userCount = userCountResult?.count ?? 0;
        let role = userCount === 0 ? 'admin' : 'user';

        const hashedPassword = await hash(password, 10);
        const id = crypto.randomUUID();
        const subToken = crypto.randomUUID();
        const now = new Date().toISOString();

        await this.db.insert(users).values({
            id: id,
            username: username,
            password: hashedPassword,
            role: role,
            sub_token: subToken,
            created_at: now,
            updated_at: now
        });

        return { success: true, data: { id, username, role }, status: 201 };
    }

    async login(username: string, password: string): Promise<{ success: boolean; message?: string; data?: any; status: number }> {
        const user = await this.db.select().from(users).where(eq(users.username, username)).get();
        if (!user) {
            return { success: false, message: '用户不存在', status: 404 };
        }

        const isPasswordValid = await compare(password, user.password as string);
        if (!isPasswordValid) {
            return { success: false, message: '密码错误', status: 401 };
        }

        const payload = { id: user.id, username: user.username, role: user.role || 'user', sub_token: user.sub_token, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) };
        const token = await sign(payload, this.jwtSecret);

        return { success: true, data: { token, user: payload }, status: 200 };
    }

    async getRegistrationStatus(): Promise<{ success: boolean; data: { allow_registration: boolean }; status: number }> {
        const allowRegistrationSetting = await this.db.select({ value: system_settings.value })
            .from(system_settings)
            .where(eq(system_settings.key, 'allow_registration'))
            .get();

        // Default to 'true' if the setting is not found
        const isRegistrationAllowed = allowRegistrationSetting?.value !== 'false';

        return { success: true, data: { allow_registration: isRegistrationAllowed }, status: 200 };
    }
}
