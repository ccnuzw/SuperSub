// Define Env bindings from wrangler.toml
export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  SUBS_KV: KVNamespace;
}

export type AppContext = {
  Bindings: Env;
  Variables: {
    jwtPayload: {
      id: string;
      username: string;
      role: string;
    };
  };
};
export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}