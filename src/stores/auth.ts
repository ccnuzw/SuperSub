/**
 * 简化的认证状态管理
 * 避免使用抽象类StoreBase，直接实现基本功能
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { createAuthError } from '@/utils/errorHandler';
import type { IUser, ILoginCredentials, IRegisterCredentials } from '@/types';
import httpClient from '@/services/http/HttpClient';

/**
 * 认证Store
 */
export const useAuthStore = defineStore('auth', () => {
  // 路由实例
  const router = useRouter();

  // 初始化时恢复token
  const initializeAuth = () => {
    try {
      const data = localStorage.getItem('supersub-auth');
      if (data) {
        const parsedData = JSON.parse(data);
        if (parsedData.token) {
          setToken(parsedData.token);
        }
        if (parsedData.user) {
          setUser(parsedData.user);
        }
      }
    } catch (error) {
      console.warn('Failed to restore auth data:', error);
    }
  };

  // 状态
  const user = ref<IUser | null>(null);
  const token = ref<string | null>(null);
  const isRegistrationAllowed = ref<boolean>(true);
  const isLoggingOut = ref<boolean>(false);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<string | null>(null);

  // 计算属性
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  // 更新lastUpdated的函数
  const updateLastUpdated = () => {
    lastUpdated.value = new Date().toISOString();
  };

  // 基础的store方法
  const setUser = (newUser: IUser | null) => {
    user.value = newUser;
    updateLastUpdated();
  };

  const setToken = (newToken: string | null) => {
    token.value = newToken;
    updateLastUpdated();
  };

  // 初始化认证状态（在所有函数定义后调用）
  initializeAuth();

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

  // 登录方法
  const login = async (credentials: ILoginCredentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await httpClient.post<{
        user: IUser;
        token: string;
      }>('/auth/login', credentials);

      if (response.success && response.data) {
        const { user: userData, token: tokenData } = response.data;
        setUser(userData);
        setToken(tokenData);

        return { user: userData, token: tokenData };
      } else {
        throw createAuthError(response.message || '登录失败');
      }
    } catch (err: any) {
      // 处理不同类型的错误
      let errorMessage = '登录失败';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw createAuthError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 退出方法
  const logout = async () => {
    try {
      setLoading(true);
      isLoggingOut.value = true;

      // 调用logout API
      await httpClient.post('/auth/logout');

      // 清理状态
      setUser(null);
      setToken(null);
      setError(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
      isLoggingOut.value = false;
    }
  };

  // 注册方法
  const register = async (credentials: IRegisterCredentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await httpClient.post<{ success: boolean }>('/auth/register', credentials);

      if (response.data?.success) {
        return { success: true };
      } else {
        throw createAuthError(response.data?.message || '注册失败');
      }
    } catch (err: any) {
      const errorMessage = err.message || '注册失败';
      setError(errorMessage);
      throw createAuthError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 检查注册状态
  const checkRegistrationStatus = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await httpClient.get<{ allow_registration: string }>('/system/settings');

      if (response.data?.success && response.data.data) {
        const isAllowed = response.data.data.allow_registration !== 'false';
        isRegistrationAllowed.value = isAllowed;
        return isAllowed;
      } else {
        throw createAuthError('获取注册状态失败');
      }
    } catch (err: any) {
      const errorMessage = err.message || '获取注册状态失败';
      setError(errorMessage);
      // 默认允许注册
      isRegistrationAllowed.value = true;
      return true;
    } finally {
      setLoading(false);
    }
  };

  // 验证token
  const verifyToken = async () => {
    if (!token.value) return false;

    try {
      const response = await httpClient.get<{ user: IUser }>('/auth/me');

      if (response.data?.success && response.data.data) {
        setUser(response.data.data.user);
        return true;
      }
      return false;
    } catch (error) {
      // Token无效，清理状态
      setUser(null);
      setToken(null);
      return false;
    }
  };

  // 重置方法
  const $reset = () => {
    user.value = null;
    token.value = null;
    loading.value = false;
    error.value = null;
    lastUpdated.value = null;
    isRegistrationAllowed.value = true;
    isLoggingOut.value = false;
  };

  // 获取持久化数据
  const getPersistedData = () => {
    try {
      const data = localStorage.getItem('supersub-auth');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  // 保存到持久化
  const saveToPersistence = () => {
    try {
      const data = {
        user: user.value,
        token: token.value,
        lastUpdated: lastUpdated.value
      };
      localStorage.setItem('supersub-auth', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save auth data to localStorage:', error);
    }
  };

  // 清理持久化数据
  const clearPersistedData = () => {
    try {
      localStorage.removeItem('supersub-auth');
    } catch (error) {
      console.warn('Failed to clear auth data from localStorage:', error);
    }
  };

  // 监听token变化，自动保存
  const watchToken = (newToken: string | null) => {
    if (newToken) {
      saveToPersistence();
    } else {
      clearPersistedData();
    }
  };

  return {
    // 状态
    user,
    token,
    isRegistrationAllowed,
    isLoggingOut,
    loading,
    error,
    lastUpdated,

    // 计算属性
    isAuthenticated,
    isAdmin,

    // 方法
    login,
    logout,
    register,
    checkRegistrationStatus,
    verifyToken,
    setUser,
    setToken,
    setLoading,
    setError,
    watchToken,
    getPersistedData,
    clearPersistedData,
    $reset,

    // 兼容性方法
    fetchUser: verifyToken,
    updateTokenAndUser: (userData: IUser, userToken: string) => {
      setUser(userData);
      setToken(userToken);
    },

    // 兼容性
    $state: {
      user,
      token,
      loading,
      error,
      lastUpdated
    }
  };
});

// Re-export types for convenience
export type { ILoginCredentials, IRegisterCredentials, IUser };