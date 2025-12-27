export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  sub_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  group_id: string | null;
  name: string;
  url: string;
  node_count?: number;
  is_enabled: number | boolean; // Backend uses is_enabled
  enabled?: number | boolean; // Legacy/Frontend compat
  created_at: string;
  updated_at: string;
  last_updated?: string | null;
  error?: string | null;
  expires_at?: string | null;
  subscription_info?: string | null;
  remaining_traffic?: number | null;
  remaining_days?: number | null;
  profile_id?: string | null;
}

export interface Node {
  id: string;
  user_id: string;
  group_id: string;
  name: string;

  // New core fields for protocol-aware structure
  link: string;
  protocol: string;
  protocol_params: any;

  raw?: string; // Raw node link, for import purposes

  // Legacy fields for backward compatibility during transition
  server?: string;
  port?: number;
  type?: string;
  password?: string;
  params?: any;

  // Metadata
  sort_order?: number;
  created_at: string;
  updated_at: string;

  // Health check fields
  status?: 'pending' | 'testing' | 'healthy' | 'unhealthy';
  latency?: number | null;
  last_checked?: string | null;
  error?: string | null;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  alias?: string | null;
  content?: string; // The raw JSON string from the DB

  // Data sources
  subscription_ids?: string[];
  node_ids?: string[];

  // Node processing
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

  // Generation mode fields
  generation_mode?: 'local' | 'remote';
  template_id?: number | null;
  subconverter_backend_id?: number | null;
  subconverter_config_id?: number | null;

  created_at: string;
  updated_at: string;
  polling_index?: number;
}

export interface SubscriptionRule {
  id: number;
  subscription_id: string;
  name: string;
  type: 'filter_by_name_keyword' | 'filter_by_name_regex' | 'rename_by_regex' | 'exclude_by_name_keyword';
  value: string; // JSON string
  enabled: number; // 0 or 1
  created_at: string;
  updated_at: string;
}


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

export interface ProcessingLog {
  id: number;
  run_id: string;
  profile_id: string;
  step_name: string;
  step_order: number;
  input_count: number;
  output_count: number;
  details: any; // Parsed JSON object
  created_at: string;
}

export interface SubconverterAsset {
  id: number;
  name: string;
  url: string;
  type: 'backend' | 'config';
  is_default?: 0 | 1;
}


export type LogLevel = 'STEP' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  step?: string;
  data?: any;
}
export interface NodeGroup {
  id: string;
  name: string;
  user_id: string;
  is_enabled: boolean;
  order_index?: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionGroup {
  id: string;
  name: string;
  description?: string | null;
  user_id: string;
  is_enabled: boolean;
  order_index?: number;
  created_at: string;
  updated_at: string;
}
