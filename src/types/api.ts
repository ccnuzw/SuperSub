// API接口类型定义

// 请求选项
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: HeadersInit;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
}

// API端点常量
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    USER: '/auth/user'
  },

  // 节点相关
  NODES: '/nodes',
  NODE_GROUPS: '/groups',
  NODE_STATUS: '/nodes/status',

  // 订阅相关
  SUBSCRIPTIONS: '/subscriptions',
  SUBSCRIPTION_GROUPS: '/subscription-groups',
  SUBSCRIPTION_RULES: '/subscription-rules',

  // 配置文件相关
  PROFILES: '/profiles',
  PROFILE_RULES: '/profile-rules',

  // 管理员相关
  ADMIN: '/admin',
  USERS: '/user',

  // 系统相关
  SYSTEM: '/system',
  ASSETS: '/assets',
  PUBLIC: '/public'
} as const;

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 注册请求
export interface RegisterRequest {
  username: string;
  password: string;
}

// 用户响应
export interface UserResponse {
  id: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// 认证响应
export interface AuthResponse {
  token: string;
  user: UserResponse;
}

// 节点创建/更新请求
export interface NodeRequest {
  name: string;
  link?: string;
  protocol: string;
  protocol_params?: any;
  server?: string;
  port?: number;
  password?: string;
  type?: string;
  params?: string;
  group_id?: string;
  sort_order?: number;
}

// 订阅创建/更新请求
export interface SubscriptionRequest {
  name: string;
  url: string;
  type?: string;
  enabled?: boolean;
  include_keywords?: string;
  exclude_keywords?: string;
  group_id?: string;
}

// 配置文件创建/更新请求
export interface ProfileRequest {
  name: string;
  alias?: string;
  generation_mode: 'local' | 'remote';
  template_id?: number;
  subconverter_backend_id?: number;
  subconverter_config_id?: number;
  template_variables?: string;
}

// 分组创建/更新请求
export interface GroupRequest {
  name: string;
  description?: string;
  sort_order?: number;
  is_enabled?: boolean;
}

// 批量操作请求
export interface BulkOperationRequest<T> {
  ids: string[];
  action: 'delete' | 'enable' | 'disable' | string;
  data?: T;
}

// 订阅导入请求
export interface ImportSubscriptionRequest {
  urls: string[];
  group_id?: string;
  enabled?: boolean;
}

// 节点测试请求
export interface TestNodeRequest {
  node_ids: string[];
  timeout?: number;
}

// 配置文件生成请求
export interface GenerateProfileRequest {
  profile_id: string;
  force?: boolean;
}

// 系统统计响应
export interface SystemStatsResponse {
  nodes: number;
  subscriptions: number;
  profiles: number;
  online_nodes: number;
  total_traffic: bigint;
}

// 健康检查响应
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    kv: 'up' | 'down';
  };
}