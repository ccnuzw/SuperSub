/**
 * Settings API Service - 服务层
 * 负责与后端API进行设置数据的交互
 */

import httpClient from '@/services/http/HttpClient';
import { useAuthStore } from '@/stores/auth';
import type { SettingsState, SettingsApiResponse } from './types';

export class SettingsApiService {
  /**
   * 从服务器获取用户设置
   */
  static async fetchSettings(): Promise<Partial<SettingsState>> {
    const authStore = useAuthStore();

    // 检查认证状态
    if (!authStore.isAuthenticated) {
      throw new Error('Authentication failed - please log in again');
    }

    try {
      const response = await httpClient.get('/settings');

      // 处理不同的响应格式
      if (response && (response.success || response.data)) {
        const settingsData = response.data || response;

        // 如果是数组格式（标准API响应）
        if (Array.isArray(settingsData)) {
          const settings = settingsData.reduce((acc: Record<string, any>, setting) => {
            acc[setting.key] = setting.value;
            return acc;
          }, {});

          return {
            telegram_bot_token: settings.telegram_bot_token || '',
            telegram_chat_id: settings.telegram_chat_id || '',
          };
        }
        // 如果是对象格式（可能的直接响应）
        else if (typeof settingsData === 'object' && settingsData !== null) {
          return {
            telegram_bot_token: settingsData.telegram_bot_token || '',
            telegram_chat_id: settingsData.telegram_chat_id || '',
          };
        }
      }

      // 如果没有数据，返回默认值
      return {
        telegram_bot_token: '',
        telegram_chat_id: '',
      };
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);

      // 检查是否是认证错误
      if (error.status === 401 || error.message?.includes('Authentication failed')) {
        // 清理认证状态
        authStore.logout();
        throw new Error('Authentication failed - please log in again');
      }

      // 对于其他错误，仍然需要抛出，因为这些是服务器端错误
      throw new Error(error.message || 'Failed to fetch settings from server');
    }
  }

  /**
   * 保存设置到服务器
   */
  static async saveSettings(settings: SettingsState): Promise<void> {
    const authStore = useAuthStore();

    // 检查认证状态
    if (!authStore.isAuthenticated) {
      throw new Error('Authentication failed - please log in again');
    }

    try {
      const payload = [
        {
          key: 'telegram_bot_token',
          value: settings.telegram_bot_token,
          type: 'string',
          category: 'telegram',
          description: 'Telegram Bot Token'
        },
        {
          key: 'telegram_chat_id',
          value: settings.telegram_chat_id,
          type: 'string',
          category: 'telegram',
          description: 'Telegram Chat ID'
        }
      ];

      await httpClient.post('/settings', payload);
    } catch (error: any) {
      console.error('Failed to save settings:', error);

      // 检查是否是认证错误
      if (error.status === 401 || error.message?.includes('Authentication failed')) {
        authStore.logout();
        throw new Error('Authentication failed - please log in again');
      }

      throw new Error(error.message || 'Failed to save settings');
    }
  }

  /**
   * 发送Telegram测试通知
   */
  static async testTelegram(): Promise<void> {
    const authStore = useAuthStore();

    if (!authStore.isAuthenticated) {
      throw new Error('Authentication failed - please log in again');
    }

    try {
      await httpClient.post('/system/settings/test-telegram');
    } catch (error: any) {
      console.error('Failed to send Telegram test:', error);

      if (error.status === 401 || error.message?.includes('Authentication failed')) {
        authStore.logout();
        throw new Error('Authentication failed - please log in again');
      }

      throw new Error(error.message || 'Failed to send test notification');
    }
  }

  /**
   * 获取订阅令牌
   */
  static async fetchSubToken(): Promise<string> {
    const authStore = useAuthStore();

    if (!authStore.isAuthenticated) {
      throw new Error('Authentication failed - please log in again');
    }

    try {
      const response = await httpClient.get('/user/sub-token');

      if (response && (response.success || response.data)) {
        const tokenData = response.data || response;
        const token = tokenData.token || '';
        if (token) {
          return token;
        }
      }

      throw new Error('Invalid token response format');
    } catch (error: any) {
      console.error('Failed to fetch sub token:', error);

      if (error.status === 401 || error.message?.includes('Authentication failed')) {
        authStore.logout();
        throw new Error('Authentication failed - please log in again');
      }

      throw new Error(error.message || 'Failed to fetch subscription token');
    }
  }

  /**
   * 重置订阅令牌
   */
  static async resetSubToken(): Promise<{ token: string; user: any }> {
    const authStore = useAuthStore();

    if (!authStore.isAuthenticated) {
      throw new Error('Authentication failed - please log in again');
    }

    try {
      const response = await httpClient.post('/user/sub-token/reset');

      if (response && (response.success || response.data)) {
        const responseData = response.data || response;
        return {
          token: responseData.token || '',
          user: responseData.user || null
        };
      }

      throw new Error('Invalid reset token response format');
    } catch (error: any) {
      console.error('Failed to reset sub token:', error);

      if (error.status === 401 || error.message?.includes('Authentication failed')) {
        authStore.logout();
        throw new Error('Authentication failed - please log in again');
      }

      throw new Error(error.message || 'Failed to reset subscription token');
    }
  }

  /**
   * 保存订阅令牌
   */
  static async saveSubToken(token: string): Promise<{ user: any }> {
    const authStore = useAuthStore();

    if (!authStore.isAuthenticated) {
      throw new Error('Authentication failed - please log in again');
    }

    try {
      const response = await httpClient.put('/user/sub-token', { token });

      if (response && (response.success || response.data)) {
        const responseData = response.data || response;
        return {
          user: responseData.user || null
        };
      }

      throw new Error('Invalid save token response format');
    } catch (error: any) {
      console.error('Failed to save sub token:', error);

      if (error.status === 401 || error.message?.includes('Authentication failed')) {
        authStore.logout();
        throw new Error('Authentication failed - please log in again');
      }

      throw new Error(error.message || 'Failed to save subscription token');
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(password: string): Promise<void> {
    const authStore = useAuthStore();

    if (!authStore.isAuthenticated) {
      throw new Error('Authentication failed - please log in again');
    }

    try {
      await httpClient.put('/user/password', { password });
    } catch (error: any) {
      console.error('Failed to change password:', error);

      if (error.status === 401 || error.message?.includes('Authentication failed')) {
        authStore.logout();
        throw new Error('Authentication failed - please log in again');
      }

      throw new Error(error.message || 'Failed to change password');
    }
  }
}