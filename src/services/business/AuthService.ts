import httpClient from '../http/HttpClient';
import type { ApiResponse } from '../types/api';
import type { ILoginCredentials, IRegisterCredentials, IUser } from '@/types';

/**
 * 认证相关的业务逻辑层
 * 处理登录、注册等核心业务逻辑
 */
export class AuthBusinessService {
  /**
   * 用户登录
   */
  static async login(credentials: ILoginCredentials): Promise<{
    user: IUser;
    token: string;
  }> {
    const response = await httpClient.post<{
      user: IUser;
      token: string;
    }>('/auth/login', credentials);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || '登录失败');
  }

  /**
   * 用户注册
   */
  static async register(credentials: IRegisterCredentials): Promise<{
    success: boolean;
  }> {
    const response = await httpClient.post<{
      id: string;
      username: string;
      role: string;
    }>('/auth/register', credentials);

    if (response.success) {
      return { success: true };
    }

    throw new Error(response.message || '注册失败');
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<IUser> {
    const response = await httpClient.get<{
      user: IUser;
    }>('/auth/me');

    if (response.success && response.data?.user) {
      return response.data.user;
    }

    throw new Error(response.message || '获取用户信息失败');
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<void> {
    await httpClient.post('/auth/logout');
  }

  /**
   * 检查注册状态
   */
  static async checkRegistrationStatus(): Promise<boolean> {
    const response = await httpClient.get<{
      allow_registration: boolean;
    }>('/system/settings');

    if (response.success && response.data) {
      return response.data.allow_registration !== false;
    }

    // 默认允许注册
    return true;
  }
}