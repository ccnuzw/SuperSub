/**
 * 统一的类型定义文件
 * 所有接口类型使用I前缀，枚举类型和基本类型不使用前缀
 */

import type {
  IApiResponse,
  IHttpRequestConfig,
  IPaginationParams
} from './api/index'

// ========================================
// 核心实体类型（使用I前缀）
// ========================================

/**
 * 用户接口
 */
export interface IUser {
  id: string
  username: string
  role: 'admin' | 'user'
  sub_token?: string
  created_at: string
  updated_at: string
}

/**
 * 订阅接口
 */
export interface ISubscription {
  id: string
  user_id: string
  group_id: string | null
  name: string
  url: string
  node_count?: number
  healthy_node_count?: number
  status: 'healthy' | 'updating' | 'error' | 'expired' | 'unknown'
  enabled: number // 0 or 1
  is_auto_update?: boolean
  last_update?: string
  next_update?: string
  protocol_distribution?: Record<string, number>
  is_premium?: boolean
  created_at: string
  updated_at: string
  last_updated?: string
  error?: string | null
  expires_at?: string | null
  subscription_info?: string | null
  remaining_traffic?: number | null
  remaining_days?: number | null
  profile_id?: string | null

  // Additional fields for subscription configuration
  update_interval?: number
  remark?: string
  user_agent?: string
  timeout?: number
  node_types?: string[]
  exclude_nodes?: string[]
}

/**
 * 节点接口
 */
export interface INode {
  id: string
  user_id: string
  group_id: string | null
  name: string
  server: string
  port: number
  protocol: 'vmess' | 'vless' | 'trojan' | 'shadowsocks' | 'socks5' | 'http' | 'https' | 'hysteria2' | 'tuic' | 'ss' | 'ssr' | 'anytls'
  status: 'healthy' | 'unhealthy' | 'testing' | 'unknown'
  latency?: number
  region?: string
  is_premium?: boolean

  // New core fields for protocol-aware structure
  link: string
  protocol_params: any
  raw?: string // Raw node link, for import purposes

  // Legacy fields for backward compatibility during transition
  type?: string
  password?: string
  params?: any

  // Protocol-specific fields for form handling
  uuid?: string
  encryption?: string
  network?: string
  tls?: boolean
  'skip-cert-verify'?: boolean
  servername?: string
  alpn?: string[]
  'ws-path'?: string
  'ws-host'?: string
  'grpc-service-name'?: string
  path?: string
  host?: string
  headers?: any
  username?: string
  remark?: string
  security?: string
  alterId?: number
  level?: number
  cipher?: string

  // Metadata
  sort_order?: number
  created_at: string
  updated_at: string

  // Health check fields
  last_checked?: string | null
  error?: string | null
}

/**
 * 配置文件接口
 */
export interface IProfile {
  id: string
  user_id: string
  name: string
  alias?: string
  content?: string // The raw JSON string from the DB
  generation_mode: 'local' | 'remote'
  status: 'healthy' | 'unhealthy' | 'testing' | 'unknown'
  subscription_count?: number
  node_count?: number

  // Data sources
  subscription_ids?: string[]
  node_ids?: string[]

  // Node processing
  node_prefix_settings?: {
    enable_subscription_prefix?: boolean
    manual_node_prefix?: string
  }
  airport_subscription_options?: {
    polling?: boolean
    random?: boolean
    timeout?: number // in seconds
  }

  // Generation mode fields
  template_id?: number | null
  subconverter_backend_id?: number | null
  subconverter_config_id?: number | null

  created_at: string
  updated_at: string
  polling_index?: number
}

/**
 * 订阅规则接口
 */
export interface ISubscriptionRule {
  id: number
  subscription_id: string
  name: string
  type: 'filter_by_name_keyword' | 'filter_by_name_regex' | 'rename_by_regex' | 'exclude_by_name_keyword'
  value: string // JSON string
  enabled: number // 0 or 1
  created_at: string
  updated_at: string
}

// 向后兼容的类型别名
export type SubscriptionRule = ISubscriptionRule

/**
 * 处理链接口
 */
export interface IProcessingChain {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  units?: IProcessingUnit[] // This will be populated on GET /:id
}

/**
 * 处理单元接口
 */
export interface IProcessingUnit {
  id: number
  profile_id: number
  type: string // e.g., 'FILTER_BY_KEYWORD', 'SORT_BY_NAME'
  config: any // JSON object, should be parsed
  order_index: number
  is_enabled: number // 0 or 1
  user_id: string
  created_at: string
  updated_at: string
}

/**
 * 健康状态接口
 */
export interface IHealthStatus {
  node_id: string
  status?: 'pending' | 'testing' | 'healthy' | 'unhealthy'
  latency?: number | null
  last_checked?: string | null
  error?: string | null
}

/**
 * 处理日志接口
 */
export interface IProcessingLog {
  id: number
  run_id: string
  profile_id: string
  step_name: string
  step_order: number
  input_count: number
  output_count: number
  details: any // Parsed JSON object
  created_at: string
}

/**
 * 转换器资源接口
 */
export interface ISubconverterAsset {
  id: number
  name: string
  url: string
  type: 'backend' | 'config'
  is_default?: 0 | 1
}

/**
 * 日志条目接口
 */
export interface ILogEntry {
  level: LogLevel
  message: string
  timestamp: string
  step?: string
  data?: any
}

// ========================================
// 分组相关类型
// ========================================

/**
 * 节点分组接口
 */
export interface INodeGroup {
  id: string
  name: string
  description?: string
  color?: string
  icon?: any
  node_count: number
  is_enabled?: boolean
  sort_order?: number
  created_at: string
  updated_at: string
  user_id: string
}

/**
 * 订阅分组接口
 */
export interface ISubscriptionGroup {
  id: string
  name: string
  description?: string
  color?: string
  icon?: any
  subscription_count: number
  created_at: string
  updated_at: string
  user_id: string
}

// ========================================
// 表单和请求类型
// ========================================

// ========================================
// 分组相关DTO类型
// ========================================

/**
 * 节点分组创建DTO接口
 */
export interface ICreateGroupDto {
  name: string
  description?: string
  color?: string
  icon?: string
}

/**
 * 节点分组更新DTO接口
 */
export interface IUpdateGroupDto {
  name?: string
  description?: string
  color?: string
  icon?: string
  is_enabled?: boolean
}

/**
 * 节点创建DTO接口
 */
export interface ICreateNodeDto {
  name: string
  server: string
  port: number
  protocol: string
  link: string
  protocol_params: any
  group_id?: string | null
  region?: string
}

/**
 * 节点更新DTO接口
 */
export interface IUpdateNodeDto {
  name?: string
  server?: string
  port?: number
  protocol?: string
  link?: string
  protocol_params?: any
  group_id?: string | null
  region?: string
  status?: string
}

/**
 * 批量节点操作接口
 */
export interface IBatchNodeOperation {
  node_ids: string[]
  action: 'delete' | 'move_group' | 'health_check' | 'sort' | 'deduplicate'
  data?: any
}

// ========================================
// 其他表单和请求类型
// ========================================

/**
 * 登录凭据接口
 */
export interface ILoginCredentials {
  username: string
  password: string
}

/**
 * 注册凭据接口
 */
export interface IRegisterCredentials {
  username: string
  password: string
}

/**
 * 批量操作请求接口
 */
export interface IBatchRequest {
  ids: string[]
  action: string
  data?: any
}

// ========================================
// 配置和设置类型
// ========================================

/**
 * 应用设置接口
 */
export interface IAppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: string
  autoUpdate: boolean
  updateInterval: number
  notifications: boolean
}

/**
 * 用户设置接口
 */
export interface IUserSettings {
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    timezone: string
  }
  notifications: {
    email: boolean
    browser: boolean
    subscriptionUpdates: boolean
    nodeHealth: boolean
  }
  privacy: {
    analytics: boolean
    crashReporting: boolean
  }
}

// ========================================
// API响应类型
// ========================================

/**
 * 通用API响应类型
 */
export type IApiResult<T = any> = IApiResponse<T>

/**
 * 分页响应接口
 */
export interface IPaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * 列表响应接口
 */
export interface IListResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// ========================================
// 枚举类型（不使用I前缀）
// ========================================

/**
 * 客户端类型枚举
 */
export type ClientType = 'CLASH' | 'SURGE' | 'V2RAYN' | 'QUANTUMULT_X' | 'GENERIC'

/**
 * 日志级别枚举
 */
export type LogLevel = 'STEP' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG'

/**
 * 节点状态枚举
 */
export type NodeStatus = 'healthy' | 'unhealthy' | 'testing' | 'unknown'

/**
 * 订阅状态枚举
 */
export type SubscriptionStatus = 'healthy' | 'updating' | 'error' | 'expired' | 'unknown'

/**
 * 用户角色枚举
 */
export type UserRole = 'admin' | 'user'

/**
 * 协议类型枚举
 */
export type ProtocolType = 'vmess' | 'vless' | 'trojan' | 'shadowsocks' | 'socks5' | 'http' | 'https'

/**
 * 生成模式枚举
 */
export type GenerationMode = 'local' | 'remote'

// ========================================
// 工具类型
// ========================================

/**
 * 可选类型工具
 */
export type IPartial<T> = {
  [P in keyof T]?: T[P]
}

/**
 * 必需类型工具
 */
export type IRequired<T> = {
  [P in keyof T]-?: T[P]
}

/**
 * 选择类型工具
 */
export type ISelect<T, K extends keyof T> = {
  [P in K]: T[P]
}

/**
 * 省略类型工具
 */
export type IOmit<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]: T[P]
}

// ========================================
// 向后兼容的类型别名
// ========================================

/**
 * 向后兼容的User类型别名
 * @deprecated 使用IUser代替
 */
export type User = IUser

/**
 * 向后兼容的Subscription类型别名
 * @deprecated 使用ISubscription代替
 */
export type Subscription = ISubscription

/**
 * 向后兼容的Node类型别名
 * @deprecated 使用INode代替
 */
export type Node = INode

/**
 * 向后兼容的Profile类型别名
 * @deprecated 使用IProfile代替
 */
export type Profile = IProfile

/**
 * 向后兼容的ApiResponse类型别名
 * @deprecated 使用IApiResult代替
 */
export type ApiResponse<T = any> = IApiResponse<T>