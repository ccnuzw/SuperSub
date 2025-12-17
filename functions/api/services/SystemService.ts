import type { Env } from '../utils/types';

export interface ISystemSettings {
  allow_registration: boolean;
}

/**
 * 系统设置服务层
 * 处理系统设置相关的业务逻辑
 */
export class SystemService {
  /**
   * 检查注册是否允许
   */
  static async isRegistrationAllowed(env: Env): Promise<boolean> {
    try {
      const setting = await env.DB.prepare(`
        SELECT value FROM system_settings WHERE key = 'allow_registration'
      `).first<{ value: string }>();

      // 如果设置不存在，默认允许注册
      const isAllowed = setting?.value !== 'false';
      return isAllowed;
    } catch (error) {
      console.error('Failed to check registration setting:', error);
      // 出错时默认允许注册
      return true;
    }
  }

  /**
   * 获取系统设置
   */
  static async getSystemSettings(env: Env): Promise<ISystemSettings> {
    try {
      const allowRegistrationSetting = await env.DB.prepare(`
        SELECT value FROM system_settings WHERE key = 'allow_registration'
      `).first<{ value: string }>();

      const isAllowed = allowRegistrationSetting?.value !== 'false';

      return {
        allow_registration: isAllowed
      };
    } catch (error) {
      console.error('Failed to get system settings:', error);
      // 返回默认设置
      return {
        allow_registration: true
      };
    }
  }

  /**
   * 更新系统设置
   */
  static async updateSystemSettings(
    env: Env,
    settings: Partial<ISystemSettings>
  ): Promise<void> {
    const { allow_registration } = settings;

    if (allow_registration !== undefined) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO system_settings (key, value)
        VALUES ('allow_registration', ?)
      `).bind(allow_registration.toString()).run();
    }
  }
}