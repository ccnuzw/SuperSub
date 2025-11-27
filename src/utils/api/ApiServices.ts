/**
 * API服务层 - 阶段四：统一API层
 * 为不同业务模块提供类型安全的API服务
 */

import { apiClient, type ApiRequestConfig } from './UnifiedApiClient';
import type {
  ApiResponse,
  PaginatedResponse,
  CrudResult,
  PaginationParams,
  SortParams,
  FilterParams
} from '@/types/common';
import type {
  Subscription,
  SubscriptionGroup,
  Node,
  Profile,
  User,
  SystemSettings
} from '@/types/entities';

/**
 * 认证服务
 */
export class AuthService {
  /**
   * 用户登录
   */
  async login(credentials: { username: string; password: string }) {
    return apiClient.post<{ token: string; user: User }>('/auth/login', credentials);
  }

  /**
   * 用户注册
   */
  async register(userData: { username: string; password: string; email?: string }) {
    return apiClient.post<{ token: string; user: User }>('/auth/register', userData);
  }

  /**
   * 用户登出
   */
  async logout() {
    return apiClient.post('/auth/logout');
  }

  /**
   * 刷新token
   */
  async refreshToken() {
    return apiClient.post<{ token: string }>('/auth/refresh');
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    return apiClient.get<User>('/auth/me');
  }
}

/**
 * 订阅服务
 */
export class SubscriptionService {
  /**
   * 获取订阅列表
   */
  async getSubscriptions(params?: PaginationParams & FilterParams & SortParams) {
    return apiClient.get<Subscription[]>('/subscriptions', params, { cache: true, cacheTTL: 60000 });
  }

  /**
   * 获取单个订阅
   */
  async getSubscription(id: string) {
    return apiClient.get<Subscription>(`/subscriptions/${id}`, undefined, { cache: true, cacheTTL: 300000 });
  }

  /**
   * 创建订阅
   */
  async createSubscription(data: Partial<Subscription>) {
    const result = await apiClient.post<Subscription>('/subscriptions', data);
    apiClient.clearCache('/subscriptions'); // 清除列表缓存
    return result;
  }

  /**
   * 更新订阅
   */
  async updateSubscription(id: string, data: Partial<Subscription>) {
    const result = await apiClient.put<Subscription>(`/subscriptions/${id}`, data);
    apiClient.clearCache(`/subscriptions/${id}`); // 清除详情缓存
    apiClient.clearCache('/subscriptions'); // 清除列表缓存
    return result;
  }

  /**
   * 删除订阅
   */
  async deleteSubscription(id: string) {
    const result = await apiClient.delete(`/subscriptions/${id}`);
    apiClient.clearCache('/subscriptions'); // 清除列表缓存
    return result;
  }

  /**
   * 更新订阅节点
   */
  async updateSubscriptionNodes(id: string) {
    const result = await apiClient.post<Subscription>(`/subscriptions/${id}/update`);
    apiClient.clearCache(`/subscriptions/${id}`); // 清除详情缓存
    apiClient.clearCache('/subscriptions'); // 清除列表缓存
    return result;
  }

  /**
   * 批量更新订阅分组
   */
  async batchUpdateGroup(subscriptionIds: string[], groupId: string | null) {
    const result = await apiClient.post('/subscriptions/batch-update-group', {
      subscription_ids: subscriptionIds,
      group_id: groupId
    });
    apiClient.clearCache('/subscriptions'); // 清除列表缓存
    return result;
  }

  /**
   * 预览订阅内容
   */
  async previewSubscription(url: string, format?: string) {
    return apiClient.post('/subscriptions/preview', { url, format });
  }

  /**
   * 导入订阅
   */
  async importSubscriptions(data: {
    urls: string[];
    group_id?: string;
    enabled?: boolean;
  }) {
    const result = await apiClient.post<Subscription[]>('/subscriptions/import', data);
    apiClient.clearCache('/subscriptions'); // 清除列表缓存
    return result;
  }
}

/**
 * 订阅分组服务
 */
export class SubscriptionGroupService {
  /**
   * 获取分组列表
   */
  async getGroups(params?: PaginationParams & FilterParams & SortParams) {
    return apiClient.get<SubscriptionGroup[]>('/subscription-groups', params, { cache: true, cacheTTL: 300000 });
  }

  /**
   * 获取单个分组
   */
  async getGroup(id: string) {
    return apiClient.get<SubscriptionGroup>(`/subscription-groups/${id}`, undefined, { cache: true, cacheTTL: 300000 });
  }

  /**
   * 创建分组
   */
  async createGroup(data: { name: string; description?: string }) {
    const result = await apiClient.post<SubscriptionGroup>('/subscription-groups', data);
    apiClient.clearCache('/subscription-groups'); // 清除列表缓存
    return result;
  }

  /**
   * 更新分组
   */
  async updateGroup(id: string, data: { name?: string; description?: string }) {
    const result = await apiClient.put<SubscriptionGroup>(`/subscription-groups/${id}`, data);
    apiClient.clearCache(`/subscription-groups/${id}`); // 清除详情缓存
    apiClient.clearCache('/subscription-groups'); // 清除列表缓存
    return result;
  }

  /**
   * 删除分组
   */
  async deleteGroup(id: string) {
    const result = await apiClient.delete(`/subscription-groups/${id}`);
    apiClient.clearCache('/subscription-groups'); // 清除列表缓存
    return result;
  }

  /**
   * 切换分组启用状态
   */
  async toggleGroup(id: string) {
    const result = await apiClient.patch<SubscriptionGroup>(`/subscription-groups/${id}/toggle`);
    apiClient.clearCache(`/subscription-groups/${id}`); // 清除详情缓存
    apiClient.clearCache('/subscription-groups'); // 清除列表缓存
    return result;
  }

  /**
   * 更新分组顺序
   */
  async updateGroupOrder(groupIds: string[]) {
    const result = await apiClient.post('/subscription-groups/update-order', { group_ids: groupIds });
    apiClient.clearCache('/subscription-groups'); // 清除列表缓存
    return result;
  }

  /**
   * 获取分组统计信息
   */
  async getGroupStats(id: string) {
    return apiClient.get<{
      total_subscriptions: number;
      active_subscriptions: number;
      total_nodes: number;
      last_updated: string;
    }>(`/subscription-groups/${id}/stats`, undefined, { cache: true, cacheTTL: 30000 });
  }
}

/**
 * 节点服务
 */
export class NodeService {
  /**
   * 获取节点列表
   */
  async getNodes(params?: PaginationParams & FilterParams & SortParams) {
    return apiClient.get<Node[]>('/nodes', params, { cache: true, cacheTTL: 60000 });
  }

  /**
   * 获取单个节点
   */
  async getNode(id: string) {
    return apiClient.get<Node>(`/nodes/${id}`, undefined, { cache: true, cacheTTL: 300000 });
  }

  /**
   * 测试节点连接
   */
  async testNode(id: string) {
    return apiClient.post<{ latency: number; status: string }>(`/nodes/${id}/test`);
  }

  /**
   * 批量测试节点
   */
  async batchTestNodes(nodeIds: string[]) {
    return apiClient.post('/nodes/batch-test', { node_ids: nodeIds });
  }
}

/**
 * 配置文件服务
 */
export class ProfileService {
  /**
   * 获取配置文件列表
   */
  async getProfiles(params?: PaginationParams & FilterParams & SortParams) {
    return apiClient.get<Profile[]>('/profiles', params, { cache: true, cacheTTL: 60000 });
  }

  /**
   * 获取单个配置文件
   */
  async getProfile(id: string) {
    return apiClient.get<Profile>(`/profiles/${id}`, undefined, { cache: true, cacheTTL: 300000 });
  }

  /**
   * 创建配置文件
   */
  async createProfile(data: Partial<Profile>) {
    const result = await apiClient.post<Profile>('/profiles', data);
    apiClient.clearCache('/profiles'); // 清除列表缓存
    return result;
  }

  /**
   * 更新配置文件
   */
  async updateProfile(id: string, data: Partial<Profile>) {
    const result = await apiClient.put<Profile>(`/profiles/${id}`, data);
    apiClient.clearCache(`/profiles/${id}`); // 清除详情缓存
    apiClient.clearCache('/profiles'); // 清除列表缓存
    return result;
  }

  /**
   * 删除配置文件
   */
  async deleteProfile(id: string) {
    const result = await apiClient.delete(`/profiles/${id}`);
    apiClient.clearCache('/profiles'); // 清除列表缓存
    return result;
  }

  /**
   * 生成配置文件
   */
  async generateProfile(id: string, format?: string) {
    return apiClient.get<{ content: string; download_url: string }>(`/profiles/${id}/generate`, { format });
  }

  /**
   * 获取配置文件下载链接
   */
  async getProfileDownloadUrl(id: string, format: string) {
    return apiClient.get<{ url: string }>(`/profiles/${id}/download-url`, { format });
  }
}

/**
 * 统计服务
 */
export class StatsService {
  /**
   * 获取系统统计信息
   */
  async getSystemStats() {
    return apiClient.get<{
      total_subscriptions: number;
      total_nodes: number;
      total_profiles: number;
      total_groups: number;
      active_users: number;
    }>('/stats', undefined, { cache: true, cacheTTL: 30000 });
  }

  /**
   * 获取节点状态统计
   */
  async getNodeStatusStats() {
    return apiClient.get('/node-statuses', undefined, { cache: true, cacheTTL: 60000 });
  }

  /**
   * 获取使用统计
   */
  async getUsageStats(params?: { start_date?: string; end_date?: string; type?: string }) {
    return apiClient.get('/stats/usage', params, { cache: true, cacheTTL: 300000 });
  }
}

/**
 * 系统服务
 */
export class SystemService {
  /**
   * 获取系统设置
   */
  async getSettings() {
    return apiClient.get<SystemSettings>('/system/settings', undefined, { cache: true, cacheTTL: 300000 });
  }

  /**
   * 更新系统设置
   */
  async updateSettings(data: Partial<SystemSettings>) {
    const result = await apiClient.put<SystemSettings>('/system/settings', data);
    apiClient.clearCache('/system/settings'); // 清除缓存
    return result;
  }

  /**
   * 获取系统信息
   */
  async getSystemInfo() {
    return apiClient.get<{
      version: string;
      environment: string;
      uptime: number;
      memory_usage: number;
      disk_usage: number;
    }>('/system/info', undefined, { cache: true, cacheTTL: 60000 });
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    return apiClient.get<{ status: string; timestamp: string }>('/health');
  }

  /**
   * 获取日志摘要
   */
  async getLogSummary() {
    return apiClient.get('/admin/logs/summary', undefined, { cache: true, cacheTTL: 60000 });
  }
}

/**
 * 导入导出服务
 */
export class ImportExportService {
  /**
   * 导出数据
   */
  async exportData(params: { type: string; format?: string; filters?: FilterParams }) {
    return apiClient.post<{ download_url: string; file_size: number }>('/export', params);
  }

  /**
   * 导入数据
   */
  async importData(file: File, type: string) {
    const result = await apiClient.upload('/import', file);
    if (result.success) {
      // 清除相关缓存
      apiClient.clearCache();
    }
    return result;
  }
}

// 创建服务实例
export const authService = new AuthService();
export const subscriptionService = new SubscriptionService();
export const subscriptionGroupService = new SubscriptionGroupService();
export const nodeService = new NodeService();
export const profileService = new ProfileService();
export const statsService = new StatsService();
export const systemService = new SystemService();
export const importExportService = new ImportExportService();

// 导出服务类型
export type {
  AuthService,
  SubscriptionService,
  SubscriptionGroupService,
  NodeService,
  ProfileService,
  StatsService,
  SystemService,
  ImportExportService
};