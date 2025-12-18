/**
 * 简化的认证状态管理 - 组件层
 * 处理认证相关的状态管理和UI交互
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { createAuthError } from '@/utils/errorHandler';
import type { IUser, ILoginCredentials, IRegisterCredentials } from '@/types';
import { AuthBusinessService } from '@/services/business/AuthService';

/**
 * 认证Store - 组件层
 * 负责管理认证状态和用户交互
 */
export const useAuthStore = defineStore('auth', () => {
  // 路由实例
  const router = useRouter();

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

  // 保存到持久化 - 移动到这里确保在setToken/setUser之前定义
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

  // 基础的store方法
  const setUser = (newUser: IUser | null) => {
    user.value = newUser;
    updateLastUpdated();
    saveToPersistence();
  };

  const setToken = (newToken: string | null) => {
    token.value = newToken;
    updateLastUpdated();
    saveToPersistence();
  };

  // 初始化时恢复token - 优化错误处理
  const initializeAuth = () => {
    try {
      const data = localStorage.getItem('supersub-auth');
      if (data) {
        const parsedData = JSON.parse(data);
        if (parsedData.token) {
          token.value = parsedData.token;
        }
        if (parsedData.user) {
          user.value = parsedData.user;
        }
        if (parsedData.lastUpdated) {
          lastUpdated.value = parsedData.lastUpdated;
        }
      }
    } catch (error) {
      console.warn('Failed to restore auth data:', error);
      // 清理损坏的数据
      try {
        localStorage.removeItem('supersub-auth');
      } catch (clearError) {
        console.warn('Failed to clear corrupted auth data:', clearError);
      }
    }
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

  // 登录方法 - 调用业务逻辑层
  const login = async (credentials: ILoginCredentials) => {
    try {
      setLoading(true);
      setError(null);

      // 调用业务逻辑层
      const result = await AuthBusinessService.login(credentials);

      setUser(result.user);
      setToken(result.token);

      return { user: result.user, token: result.token };
    } catch (err: any) {
      const errorMessage = err.message || '登录失败';
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

      // 调用业务逻辑层
      await AuthBusinessService.logout();

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

  // 注册方法 - 调用业务逻辑层
  const register = async (credentials: IRegisterCredentials) => {
    try {
      setLoading(true);
      setError(null);

      // 调用业务逻辑层
      await AuthBusinessService.register(credentials);

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || '注册失败';
      setError(errorMessage);
      throw createAuthError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 检查注册状态 - 调用业务逻辑层
  const checkRegistrationStatus = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // 调用业务逻辑层
      const isAllowed = await AuthBusinessService.checkRegistrationStatus();
      isRegistrationAllowed.value = isAllowed;

      return isAllowed;
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

  // 验证token - 调用业务逻辑层
  const verifyToken = async () => {
    if (!token.value) return false;

    try {
      const user = await AuthBusinessService.getCurrentUser();
      setUser(user);
      return true;
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

  // 清理持久化数据
  const clearPersistedData = () => {
    try {
      localStorage.removeItem('supersub-auth');
    } catch (error) {
      console.warn('Failed to clear auth data from localStorage:', error);
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