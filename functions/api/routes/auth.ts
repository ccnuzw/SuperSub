import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import type { Env } from '../utils/types';
import { UserService } from '../services/UserService';
import { SystemService } from '../services/SystemService';
import {
  createSuccessResponse,
  createErrorResponse,
  createAuthError,
  createValidationError
} from '../utils/response';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/register', async (c) => {
  try {
    // 检查注册是否允许
    const isRegistrationAllowed = await SystemService.isRegistrationAllowed(c.env);

    if (!isRegistrationAllowed) {
      return c.json(
        createErrorResponse('User registration is currently disabled by the administrator'),
        403
      );
    }

    const { username, password } = await c.req.json();

    // 输入验证
    if (!username || !password) {
      return c.json(
        createValidationError(['Username and password are required']),
        400
      );
    }

    // 创建用户
    const userResult = await UserService.createUser(c.env, { username, password });

    return c.json(
      createSuccessResponse(
        userResult,
        'User registered successfully'
      ),
      201
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    // 处理已知错误
    if (error.message.includes('Username already exists')) {
      return c.json(
        createErrorResponse(error.message, 'USERNAME_EXISTS'),
        409
      );
    }

    if (error.message.includes('Username and password are required')) {
      return c.json(
        createValidationError(['Username and password are required']),
        400
      );
    }

    if (error.message.includes('must be between 3 and 50 characters')) {
      return c.json(
        createValidationError([error.message]),
        400
      );
    }

    if (error.message.includes('Password must be at least 6 characters long')) {
      return c.json(
        createValidationError([error.message]),
        400
      );
    }

    // 未知错误
    return c.json(
      createErrorResponse('Registration failed. Please try again.'),
      500
    );
  }
});

auth.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    // 输入验证
    if (!username || !password) {
      return c.json(
        createValidationError(['Username and password are required']),
        400
      );
    }

    // 验证用户
    const user = await UserService.validateUserPassword(c.env, username, password);

    if (!user) {
      return c.json(
        createAuthError('Invalid username or password'),
        401
      );
    }

    // 生成JWT令牌
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role || 'user',
      sub_token: user.sub_token,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24小时过期
    };

    const token = await sign(payload, c.env.JWT_SECRET);

    return c.json(
      createSuccessResponse({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role || 'user',
          sub_token: user.sub_token
        }
      }, 'Login successful')
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return c.json(
      createErrorResponse('Login failed. Please try again.'),
      500
    );
  }
});

auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      createAuthError('No authorization token provided'),
      401
    );
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, c.env.JWT_SECRET);

    // 获取最新的用户信息
    const user = await UserService.getUserById(c.env, payload.id);

    if (!user) {
      return c.json(
        createAuthError('User not found'),
        404
      );
    }

    return c.json(
      createSuccessResponse({
        user: {
          id: user.id,
          username: user.username,
          role: user.role || 'user',
          sub_token: user.sub_token
        }
      })
    );
  } catch (error: any) {
    console.error('Token verification error:', error);
    return c.json(
      createAuthError('Invalid token'),
      401
    );
  }
});

auth.post('/logout', async (c) => {
  // 注意：logout不强制要求认证，因为用户可能token过期想要清理状态
  const authHeader = c.req.header('Authorization');

  try {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // 验证token是否有效（可选，用于日志记录）
      await verify(token, c.env.JWT_SECRET);
    }

    return c.json(
      createSuccessResponse(null, 'Successfully logged out')
    );
  } catch (error: any) {
    console.error('Logout error:', error);

    // 即使token无效，也返回成功，因为客户端想要清理状态
    return c.json(
      createSuccessResponse(null, 'Successfully logged out')
    );
  }
});

export default auth;