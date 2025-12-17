/**
 * Settings Store - 业务逻辑层
 * 负责设置状态管理和业务逻辑处理
 */

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { SettingsState, PasswordState } from '@/services/settings/types';
import { SettingsService } from '@/services/settings/SettingsService';
import { SettingsApiService } from '@/services/settings/SettingsApiService';

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const formState = ref<SettingsState>({
    telegram_bot_token: '',
    telegram_chat_id: '',
  });

  const passwordFormState = ref<PasswordState>({
    password: '',
  });

  const subToken = ref<string>('');
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<string | null>(null);

  // 计算属性
  const isInitialized = computed(() => !!lastUpdated.value);
  const hasSettings = computed(() => {
    return !!(formState.value.telegram_bot_token || formState.value.telegram_chat_id);
  });

  // 基础方法
  const setSettings = (newSettings: Partial<SettingsState>) => {
    if (newSettings.telegram_bot_token !== undefined) {
      formState.value.telegram_bot_token = newSettings.telegram_bot_token;
    }
    if (newSettings.telegram_chat_id !== undefined) {
      formState.value.telegram_chat_id = newSettings.telegram_chat_id;
    }
    updateLastUpdated();
  };

  const setSubToken = (token: string) => {
    subToken.value = token;
    updateLastUpdated();
  };

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading;
    if (isLoading) {
      updateLastUpdated();
    }
  };

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage;
    if (errorMessage) {
      updateLastUpdated();
    }
  };

  const updateLastUpdated = () => {
    lastUpdated.value = new Date().toISOString();
  };

  // 初始化设置
  const initializeSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // 从服务器获取设置数据
      const serverSettings = await SettingsApiService.fetchSettings();
      setSettings(serverSettings);

      // 保存到本地存储（用于缓存）
      SettingsService.saveSettings(formState.value);

      // 获取订阅令牌
      try {
        const token = await SettingsApiService.fetchSubToken();
        setSubToken(token);
      } catch (tokenError: any) {
        // 如果是认证错误，直接抛出
        if (tokenError.message.includes('Authentication failed')) {
          throw tokenError;
        }
        // 对于令牌获取失败，不中断整个初始化流程
      }

    } catch (err: any) {
      console.error('Failed to initialize settings:', err);
      setError(err.message || '加载设置失败');

      // 对于认证错误，尝试从本地存储恢复设置以提供基本功能
      if (err.message.includes('Authentication failed')) {
        const localSettings = SettingsService.restoreSettings();
        setSettings(localSettings);
      }
    } finally {
      setLoading(false);
    }
  };

  // 保存设置
  const saveSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      await SettingsApiService.saveSettings(formState.value);

      // 保存到本地存储
      SettingsService.saveSettings(formState.value);

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || '保存设置失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 测试Telegram通知
  const testTelegram = async () => {
    try {
      setError(null);
      await SettingsApiService.testTelegram();
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '发送测试消息失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // 订阅令牌相关方法
  const resetSubToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await SettingsApiService.resetSubToken();
      setSubToken(result.token);

      return { token: result.token, user: result.user };
    } catch (err: any) {
      const errorMessage = err.message || '重置订阅令牌失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveSubToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await SettingsApiService.saveSubToken(subToken.value);

      return { user: result.user };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '保存订阅令牌失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (subToken.value) {
      navigator.clipboard.writeText(subToken.value);
      return { success: true };
    }
    throw new Error('没有可复制的令牌');
  };

  // 密码相关方法
  const changePassword = async () => {
    try {
      if (!passwordFormState.value.password) {
        throw new Error('请输入新密码');
      }

      setLoading(true);
      setError(null);

      await SettingsApiService.changePassword(passwordFormState.value.password);

      // 清空密码表单
      passwordFormState.value.password = '';

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '修改密码失败';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 重置方法
  const $reset = () => {
    formState.value = {
      telegram_bot_token: '',
      telegram_chat_id: '',
    };
    passwordFormState.value = {
      password: '',
    };
    subToken.value = '';
    loading.value = false;
    error.value = null;
    lastUpdated.value = null;
  };

  // 监听设置变化，自动保存到本地存储
  watch(
    formState,
    (newState) => {
      if (isInitialized.value) {
        SettingsService.saveSettings(newState);
      }
    },
    { deep: true }
  );

  return {
    // 状态
    formState,
    passwordFormState,
    subToken,
    loading,
    error,
    lastUpdated,

    // 计算属性
    isInitialized,
    hasSettings,

    // 方法
    initializeSettings,
    saveSettings,
    testTelegram,
    resetSubToken,
    saveSubToken,
    copyToken,
    changePassword,
    setSettings,
    setSubToken,
    setLoading,
    setError,
    $reset,
  };
});