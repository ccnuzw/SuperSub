/**
 * Settings Service - 基础设施层
 * 负责设置数据的持久化存储和恢复
 */

import type { SettingsState } from './types';

interface PersistedSettings {
  telegram_bot_token: string;
  telegram_chat_id: string;
  lastUpdated: string | null;
}

export class SettingsService {
  private static readonly STORAGE_KEY = 'supersub-settings';

  /**
   * 从本地存储恢复设置
   */
  static restoreSettings(): Partial<SettingsState> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsedData: PersistedSettings = JSON.parse(data);
        return {
          telegram_bot_token: parsedData.telegram_bot_token || '',
          telegram_chat_id: parsedData.telegram_chat_id || '',
        };
      }
    } catch (error) {
      console.warn('Failed to restore settings:', error);
    }
    return {
      telegram_bot_token: '',
      telegram_chat_id: '',
    };
  }

  /**
   * 保存设置到本地存储
   */
  static saveSettings(settings: SettingsState): void {
    try {
      const data: PersistedSettings = {
        telegram_bot_token: settings.telegram_bot_token,
        telegram_chat_id: settings.telegram_chat_id,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }

  /**
   * 清理持久化数据
   */
  static clearPersistedData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear settings from localStorage:', error);
    }
  }

  /**
   * 获取持久化数据
   */
  static getPersistedData(): PersistedSettings | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}