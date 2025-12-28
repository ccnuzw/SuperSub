/**
 * API 类型定义文件
 * 用于替代服务层中的 any 类型，提升类型安全性
 */

import type { ParsedNode } from '../../../src/utils/nodeParser';

// ==================== Profile 相关类型 ====================

/** 节点前缀设置 */
export interface NodePrefixSettings {
    enable_subscription_prefix?: boolean;
    manual_node_prefix?: string | null;
    enable_group_name_prefix?: boolean;
    manual_nodes_first?: boolean;
}

/** 机场订阅策略选项 */
export interface AirportSubscriptionOptions {
    strategy?: 'all' | 'polling' | 'random';
    polling_mode?: 'hourly' | 'request' | 'group_request';
    use_all?: boolean;
    random?: boolean;
    timeout?: number;
    polling_threshold?: number;
    polling_interval?: number;
}

/** Profile 的 content JSON 结构 */
export interface ProfileContent {
    subscription_ids?: string[];
    node_ids?: string[];
    node_prefix_settings?: NodePrefixSettings;
    airport_subscription_options?: AirportSubscriptionOptions;
    subconverter_backend_id?: number | null;
    subconverter_config_id?: number | null;
    generation_mode?: 'local' | 'remote';
}

/** 创建 Profile 请求体 */
export interface CreateProfileBody {
    name: string;
    alias?: string | null;
    content?: string | ProfileContent;
    rules?: RuleBody[];
}

/** 更新 Profile 请求体 */
export interface UpdateProfileBody {
    name: string;
    alias?: string | null;
    content?: string | ProfileContent;
}

/** 完整 Profile 类型 (包含解析后的 content) */
export interface ProfileWithContent {
    id: string;
    user_id: string;
    name: string;
    alias?: string | null;
    content?: string | null;
    generation_mode?: string;
    created_at: string;
    updated_at: string;
    polling_index?: number | null;
    // 解析后的字段
    subscription_ids?: string[];
    node_ids?: string[];
    node_prefix_settings?: NodePrefixSettings;
    airport_subscription_options?: AirportSubscriptionOptions;
    subconverter_backend_id?: number | null;
    subconverter_config_id?: number | null;
    // 轮询状态
    group_polling_indices?: string | null;
    last_successful_subscription_id?: string | null;
}

// ==================== Subscription 相关类型 ====================

/** 订阅更新结果 */
export interface SubscriptionUpdateResult {
    success: boolean;
    data?: {
        id: string;
        name: string;
        url: string;
        node_count?: number | null;
        last_updated?: string | null;
        error?: string | null;
        expires_at?: string | null;
        remaining_traffic?: number | null;
        remaining_days?: number | null;
    };
    error?: string;
}

/** 批量导入订阅项 */
export interface BatchImportSubscription {
    name: string;
    url: string;
}

/** 订阅 userinfo 头解析结果 */
export interface SubscriptionUserInfo {
    upload?: number;
    download?: number;
    total?: number;
    expire?: number;
    [key: string]: number | undefined;
}

// ==================== Node 相关类型 ====================

/** 创建节点请求体 */
export interface CreateNodeBody {
    name: string;
    link: string;
    protocol?: string;
    protocol_params?: {
        add?: string;
        port?: number | string;
        [key: string]: unknown;
    };
}

/** 批量导入节点请求体 */
export interface BatchImportNodesBody {
    links?: string;
    nodes?: ParsedNode[];
    groupId?: string | null;
}

/** 节点健康检查结果 */
export interface NodeHealthCheckResult {
    id: string;
    server: string;
    port: number;
}

// ==================== Rule 相关类型 ====================

/** 规则请求体 (创建/更新) */
export interface RuleBody {
    name: string;
    type: string;
    value: string;
    enabled?: number | boolean;
    sort_order?: number;
}

/** 规则更新请求体 (部分更新) */
export interface RuleUpdateBody {
    name?: string;
    type?: string;
    value?: string;
    enabled?: number | boolean;
    sort_order?: number;
}

// ==================== NodeProcessor 相关类型 ====================

/** 订阅获取后的源数据 */
export interface FetchedSource {
    type: 'subscription';
    id: string;
    name: string;
    url: string;
    group_id: string | null;
    content?: string;
    nodes?: (ParsedNode & { id: string; raw: string })[];
    error?: string;
}

/** 分组轮询状态 */
export interface GroupPollingState {
    [groupId: string]: {
        polling_index: number;
        last_updated?: string;
    };
}

/** 候选集合 */
export interface CandidateItem {
    id: string;
    name: string;
    url: string;
    group_id: string | null;
}

/** 订阅分组规则 */
export interface SubscriptionGroupRule {
    id: number;
    group_id: string;
    name: string;
    type: string;
    value: string;
    enabled: number;
    sort_order?: number | null;
}

/** 订阅规则 */
export interface SubscriptionRuleItem {
    id: number;
    subscription_id: string;
    name: string;
    type: string;
    value: string;
    enabled: number;
    sort_order?: number | null;
}

// ==================== Settings 相关类型 ====================

/** 设置更新项 */
export interface SettingUpdateItem {
    key: string;
    value: string | null;
    type?: string;
    category?: string;
}

// ==================== Auth 相关类型 ====================

/** 认证结果 */
export interface AuthResult {
    success: boolean;
    message?: string;
    data?: {
        token?: string;
        user?: {
            id: string;
            username: string;
            role: string;
        };
    };
    status: number;
}
