/**
 * 认证Store - 重构版本使用统一API层
 */

import { defineStore } from 'pinia';
import { nextTick } from 'vue';
import router from '@/router';
import { User } from '@/types';
import { authService, useEnhancedApi } from '@/utils/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    isLoggingOut: false,
    isRegistrationAllowed: true,
    loading: false,
    error: null as string | null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    userName: (state) => state.user?.username || 'Guest'
  },

  actions: {
    /**
     * 检查注册状态
     */
    async checkRegistrationStatus() {
      try {
        // 这个端点是公开的，不需要认证
        const result = await authService.getSettings();
        if (result.success && result.data) {
          this.isRegistrationAllowed = result.data.allow_registration === 'true';
        }
      } catch (error) {
        console.error('检查注册状态失败:', error);
        // 如果API失败，默认允许注册
        this.isRegistrationAllowed = true;
      }
    },

    /**
     * 用户登录
     */
    async login(credentials: { username: string; password: string }) {
      this.loading = true;
      this.error = null;

      try {
        const result = await authService.login(credentials);

        if (result.success && result.data) {
          const { token, user } = result.data;
          this.token = token;
          this.user = user;
          this.isLoggingOut = false;

          // 存储token到localStorage
          try {
            localStorage.setItem('token', token);
          } catch (error) {
            console.warn('无法保存token到localStorage:', error);
          }

          return { success: true, message: '登录成功' };
        } else {
          throw new Error(result.message || '登录失败');
        }
      } catch (error: any) {
        this.error = error.message || '登录失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 用户登出
     */
    async logout() {
      this.isLoggingOut = true;

      try {
        // 调用后端登出API（可选）
        await authService.logout().catch(() => {
          // 忽略登出API错误，因为可能是网络问题
        });
      } catch (error) {
        console.warn('登出API调用失败:', error);
      }

      // 清除本地状态
      this.user = null;
      this.token = null;
      this.isLoggingOut = false;

      // 清除localStorage中的token
      try {
        localStorage.removeItem('token');
      } catch (error) {
        console.warn('无法清除localStorage中的token:', error);
      }

      // 清除所有API缓存
      try {
        const { apiClient } = useEnhancedApi();
        apiClient.clearCache();
      } catch (error) {
        console.warn('无法清除API缓存:', error);
      }

      // 等待下一个tick后再导航
      await nextTick();

      // 如果不在登录页，则跳转到登录页
      if (router.currentRoute.value.name !== 'login') {
        router.push({ name: 'login' });
      }
    },

    /**
     * 用户注册
     */
    async register(userData: { username: string; password: string; email?: string }) {
      this.loading = true;
      this.error = null;

      try {
        const result = await authService.register(userData);

        if (result.success && result.data) {
          const { token, user } = result.data;
          this.token = token;
          this.user = user;
          this.isLoggingOut = false;

          // 存储token到localStorage
          try {
            localStorage.setItem('token', token);
          } catch (error) {
            console.warn('无法保存token到localStorage:', error);
          }

          return { success: true, message: '注册成功' };
        } else {
          throw new Error(result.message || '注册失败');
        }
      } catch (error: any) {
        this.error = error.message || '注册失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 刷新token
     */
    async refreshToken() {
      if (!this.token) {
        throw new Error('没有有效的token');
      }

      try {
        const result = await authService.refreshToken();

        if (result.success && result.data) {
          const { token } = result.data;
          this.token = token;

          // 更新localStorage中的token
          try {
            localStorage.setItem('token', token);
          } catch (error) {
            console.warn('无法更新localStorage中的token:', error);
          }

          return { success: true, message: 'Token刷新成功' };
        } else {
          throw new Error(result.message || 'Token刷新��败');
        }
      } catch (error: any) {
        // 如果刷新失败，可能是token过期，需要重新登录
        await this.logout();
        throw error;
      }
    },

    /**
     * 获取当前用户信息
     */
    async fetchUser() {
      if (!this.token) {
        return { success: false, message: '未登录' };
      }

      try {
        const result = await authService.getCurrentUser();

        if (result.success && result.data) {
          this.user = result.data;
          return { success: true, message: '获取用户信息成功' };
        } else {
          throw new Error(result.message || '获取用户信息失败');
        }
      } catch (error: any) {
        console.error('获取用户信息失败:', error);
        // 如果获取用户信息失败，可能是token过期
        if (error.status === 401) {
          await this.logout();
        }
        throw error;
      }
    },

    /**
     * 更新用户信息
     */
    updateUser(userData: Partial<User>) {
      if (this.user) {
        this.user = { ...this.user, ...userData };
      }
    },

    /**
     * 检查认证状态
     */
    async checkAuthStatus() {
      // 检查localStorage中是否有token
      let storedToken: string | null = null;
      try {
        storedToken = localStorage.getItem('token');
      } catch (error) {
        console.warn('无法从localStorage读取token:', error);
      }

      if (!storedToken) {
        return { success: false, message: '未找到token' };
      }

      this.token = storedToken;

      try {
        // 尝试获取用户信息来验证token
        await this.fetchUser();
        return { success: true, message: '认证有效' };
      } catch (error) {
        // 如果获取用户信息失败，清除无效token
        this.token = null;
        try {
          localStorage.removeItem('token');
        } catch (clearError) {
          console.warn('无法清除无效token:', clearError);
        }
        return { success: false, message: 'Token无效或已过期' };
      }
    },

    /**
     * 清除错误状态
     */
    clearError() {
      this.error = null;
    },

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean) {
      this.loading = loading;
    }
  },

  persist: {
    key: 'auth-store',
    storage: localStorage,
    paths: ['token', 'user']
  }
});