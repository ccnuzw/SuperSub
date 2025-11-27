/**
 * API统一入口 - 阶段四：统一API层
 * 整合所有API相关功能，提供统一的访问入口
 */

// 导出核心API客户端
export {
  apiClient,
  ApiError,
  NetworkError,
  AuthError,
  type ApiRequestConfig
} from './UnifiedApiClient';

// 导出API服务
export {
  authService,
  subscriptionService,
  subscriptionGroupService,
  nodeService,
  profileService,
  statsService,
  systemService,
  importExportService,
  type AuthService,
  type SubscriptionService,
  type SubscriptionGroupService,
  type NodeService,
  type ProfileService,
  type StatsService,
  type SystemService,
  type ImportExportService
} from './ApiServices';

// 导出类型定义
export type {
  ApiResponse,
  PaginatedResponse,
  CrudResult,
  PaginationParams,
  SortParams,
  FilterParams
} from '@/types/common';

// 重新导出实体类型
export type {
  Subscription,
  SubscriptionGroup,
  Node,
  Profile,
  User,
  SystemSettings
} from '@/types/entities';

// 默认导出API客户端
export { apiClient as default } from './UnifiedApiClient';