import type { Env } from '../utils/types';

export interface IUser {
  id: string;
  username: string;
  role: string;
  sub_token?: string;
  created_at: string;
  updated_at: string;
}

export interface ICreateUserRequest {
  username: string;
  password: string;
  role?: string;
}

export interface ICreateUserResult {
  id: string;
  username: string;
  role: string;
}

/**
 * 用户服务层
 * 处理用户相关的业务逻辑
 */
export class UserService {
  /**
   * 创建新用户
   */
  static async createUser(
    env: Env,
    request: ICreateUserRequest
  ): Promise<ICreateUserResult> {
    const { username, password, role: requestedRole } = request;

    // 验证输入
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    if (username.length < 3 || username.length > 50) {
      throw new Error('Username must be between 3 and 50 characters');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // 检查用户名是否已存在
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first();

    if (existingUser) {
      throw new Error('Username already exists');
    }

    // 确定用户角色
    const userCountResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE role != 'system'"
    ).first<{ count: number }>();

    const userCount = userCountResult?.count ?? 0;
    const role = requestedRole || (userCount === 0 ? 'admin' : 'user');

    // 创建用户
    const userId = crypto.randomUUID();
    const subToken = crypto.randomUUID();
    const now = new Date().toISOString();

    // 这里导��bcrypt进行密码哈希
    const { hash } = await import('bcrypt-ts');
    const hashedPassword = await hash(password, 10);

    await env.DB.prepare(`
      INSERT INTO users (id, username, password, role, sub_token, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, username, hashedPassword, role, subToken, now, now).run();

    return {
      id: userId,
      username,
      role
    };
  }

  /**
   * 根据用户名获取用户
   */
  static async getUserByUsername(
    env: Env,
    username: string
  ): Promise<IUser | null> {
    const user = await env.DB.prepare(`
      SELECT id, username, role, sub_token, created_at, updated_at
      FROM users
      WHERE username = ?
    `).bind(username).first<IUser>();

    return user || null;
  }

  /**
   * 根据ID获取用户
   */
  static async getUserById(
    env: Env,
    userId: string
  ): Promise<IUser | null> {
    const user = await env.DB.prepare(`
      SELECT id, username, role, sub_token, created_at, updated_at
      FROM users
      WHERE id = ?
    `).bind(userId).first<IUser>();

    return user || null;
  }

  /**
   * 验证用户密码
   */
  static async validateUserPassword(
    env: Env,
    username: string,
    password: string
  ): Promise<IUser | null> {
    const user = await env.DB.prepare(`
      SELECT id, username, password, role, sub_token, created_at, updated_at
      FROM users
      WHERE username = ?
    `).bind(username).first<any>();

    if (!user) {
      return null;
    }

    const { compare } = await import('bcrypt-ts');
    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // 返回用户信息，不包含密码
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}