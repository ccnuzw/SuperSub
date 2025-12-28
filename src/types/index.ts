import type {
  Node as DbNode,
  Subscription as DbSubscription,
  Profile as DbProfile,
  User as DbUser,
  SubscriptionRule as DbSubscriptionRule,
  SubscriptionGroup as DbSubscriptionGroup,
  NodeGroup as DbNodeGroup,
  SubconverterAsset as DbSubconverterAsset,
  ProcessingLog as DbProcessingLog
} from '@api/drizzle/schema';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User extends DbUser { }

export interface Subscription extends Omit<DbSubscription, 'enabled' | 'error' | 'node_count' | 'subscription_info'> {
  // Frontend/Legacy optional fields or overrides
  is_enabled: number | boolean; // Mapped from DB 'enabled' (which is integer 0/1)
  enabled?: number | boolean;

  // Computed/joined fields not in raw DB table
  node_count?: number; // Actually in DB now as default 0
  error?: string | null;
  subscription_info?: string | null;
}

export interface Node extends Omit<DbNode, 'protocol_params' | 'params' | 'status' | 'error' | 'last_checked' | 'latency'> {
  // Protocol params are JSON strings in DB, but possibly parsed in frontend usage
  // For strictness we should treat them as any or define a parsed type
  protocol_params: any;
  params: any;

  // Frontend-specific fields
  raw?: string;
  status?: 'pending' | 'testing' | 'healthy' | 'unhealthy';
  latency?: number | null;
  last_checked?: string | null; // This exists in DB
  error?: string | null; // This exists in DB
}

export interface Profile extends Omit<DbProfile, 'content' | 'generation_mode' | 'template_id' | 'subconverter_backend_id' | 'subconverter_config_id' | 'alias' | 'polling_index'> {
  // DB overrides (optional in frontend vs null in DB)
  content?: string | null;
  alias?: string | null;
  polling_index?: number | null;
  generation_mode?: 'local' | 'remote';
  template_id?: number | null;
  subconverter_backend_id?: number | null;
  subconverter_config_id?: number | null;

  // Parsed fields from content JSON (Frontend convenience)
  subscription_ids?: string[];
  node_ids?: string[];
  node_prefix_settings?: {
    enable_subscription_prefix?: boolean;
    manual_node_prefix?: string;
    enable_group_name_prefix?: boolean;
    manual_nodes_first?: boolean;
  };
  airport_subscription_options?: {
    strategy?: 'all' | 'polling' | 'random';
    polling_mode?: 'hourly' | 'request' | 'group_request';
    use_all?: boolean;
    random?: boolean;
    timeout?: number;
    polling_threshold?: number;
    polling_interval?: number;
  };


}

export interface SubscriptionRule extends DbSubscriptionRule { }

export type ClientType = 'CLASH' | 'SURGE' | 'V2RAYN' | 'QUANTUMULT_X' | 'GENERIC';

export interface ProcessingChain {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  units?: ProcessingUnit[]; // This will be populated on GET /:id
}

export interface ProcessingUnit {
  id: number;
  profile_id: number;
  type: string; // e.g., 'FILTER_BY_KEYWORD', 'SORT_BY_NAME'
  config: any; // JSON object, should be parsed
  order_index: number;
  is_enabled: number; // 0 or 1
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface HealthStatus {
  node_id: string;
  status?: 'pending' | 'testing' | 'healthy' | 'unhealthy';
  latency?: number | null;
  last_checked?: string | null;
  error?: string | null;
}

export interface ProcessingLog extends DbProcessingLog {
  details: any; // DB has 'details: string | null', frontend wants parsed
}

export interface SubconverterAsset extends DbSubconverterAsset { }


export type LogLevel = 'STEP' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  step?: string;
  data?: any;
}
export interface NodeGroup extends DbNodeGroup { }

export interface SubscriptionGroup extends DbSubscriptionGroup { }
