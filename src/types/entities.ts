import type { BaseEntity, GroupItem } from './common';

// 重新导出BaseEntity以供其他模块使用
export type { BaseEntity, GroupItem } from './common';

// 节点实体
export interface Node extends BaseEntity {
  user_id: string;
  group_id?: string;
  name: string;
  link?: string;
  protocol: string;
  protocol_params?: any;
  server?: string;
  port?: number;
  password?: string;
  type?: string;
  params?: string;
  sort_order?: number;
  status: 'pending' | 'online' | 'offline' | 'error';
  latency?: number;
  last_checked?: string;
  error?: string;
}

// 订阅实体
export interface Subscription extends BaseEntity {
  user_id: string;
  name: string;
  url: string;
  type?: string;
  enabled: boolean;
  node_count: number;
  last_updated?: string;
  error?: string;
  include_keywords?: string;
  exclude_keywords?: string;
  expires_at?: string;
  subscription_info?: string;
  group_id?: string;
  remaining_traffic?: bigint;
  remaining_days?: number;
}

// 配置文件实体
export interface Profile extends BaseEntity {
  user_id: string;
  name: string;
  alias?: string;
  content?: string;
  generation_mode: 'local' | 'remote';
  template_id?: number;
  subconverter_backend_id?: number;
  subconverter_config_id?: number;
  template_variables?: string;
  polling_index: number;
  last_successful_subscription_id?: string;
  last_successful_subscription_content?: string;
  last_successful_subscription_updated_at?: string;
  group_polling_indices?: string;
}

// 用户实体
export interface User extends BaseEntity {
  username: string;
  password: string; // 注意：实际应该存储hash
  role: 'user' | 'admin' | 'system';
  sub_token?: string;
}

// 节点分组实体
export interface NodeGroup extends GroupItem {
  // 继承 GroupItem 的所有字段
}

// 订阅分组实体
export interface SubscriptionGroup extends GroupItem {
  // 继承 GroupItem 的所有字段
}

// 节点状态实体
export interface NodeStatus {
  node_id: string;
  user_id: string;
  status: 'online' | 'offline' | 'error';
  latency?: number;
  checked_at: string;
}

// 订阅处理日志
export interface SubscriptionProcessingLog {
  id: number;
  run_id: string;
  profile_id: string;
  step_name: string;
  step_order: number;
  input_count: number;
  output_count: number;
  details?: string;
  created_at: string;
}

// 转换器资源实体
export interface SubconverterAsset {
  id: number;
  user_id: string;
  name: string;
  url: string;
  type: 'backend' | 'config';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// 规则实体基类
export interface RuleEntity {
  id: number;
  user_id: string;
  name: string;
  type: string;
  value: string;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 订阅规则实体
export interface SubscriptionRule extends RuleEntity {
  subscription_id: string;
}

// 配置文件规则实体
export interface ProfileRule extends RuleEntity {
  profile_id: string;
}

// 系统设置实体
export interface SystemSetting {
  key: string;
  value: string;
}

// 用户设置实体
export interface UserSetting extends BaseEntity {
  key: string;
  user_id: string;
  value?: string;
  type: string;
  category: string;
  description?: string;
}

// 访问日志实体
export interface SubscriptionAccessLog {
  id: number;
  user_id: string;
  profile_id: string;
  ip_address?: string;
  user_agent?: string;
  country?: string;
  city?: string;
  accessed_at: string;
}

// UA映射实体
export interface UaMapping {
  id: number;
  ua_keyword: string;
  client_type: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// 节点/订阅状态枚举
export type NodeStatusType = 'pending' | 'online' | 'offline' | 'error';
export type SubscriptionStatus = 'active' | 'inactive' | 'error' | 'expired';
export type UserRole = 'user' | 'admin' | 'system';

// 订阅生成模式
export type GenerationMode = 'local' | 'remote';

// 客户端类型
export type ClientType = 'clash' | 'quantumultx' | 'surge' | 'surfboard' | 'loon' | 'sing-box' | 'nekobox';

// 规则类型
export type RuleType = 'include' | 'exclude' | 'rename' | 'sort' | 'filter';

// API错误类型
export interface ApiError {
  message: string;
  code?: number;
  details?: any;
}