// Define Env bindings from wrangler.toml
export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  SUBS_KV: KVNamespace;
}

// Entity types
export interface SubscriptionRule {
  id: number;
  name: string;
  type: 'filter_by_name_keyword' | 'exclude_by_name_keyword' | 'filter_by_name_regex' | 'rename_by_regex';
  value: string;
  enabled: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  group_id?: string | null;
  node_count?: number;
  last_updated?: string;
  error?: string | null;
  remaining_traffic?: number | null;
  remaining_days?: number | null;
  expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  timestamp: string;
  data?: any; // Optional structured data
}