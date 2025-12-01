import type { Env } from './entity-types';

// Re-export Env type
export type { Env, SubscriptionRule, Subscription, LogEntry } from './entity-types';

// Forward declare service types to avoid circular imports
export interface SubscriptionService {
  getSubscriptions(userId: string): Promise<any[]>;
  getSubscriptionForSelect(userId: string): Promise<any[]>;
  createSubscription(userId: string, data: any): Promise<{ id: string }>;
  updateSubscription(userId: string, id: string, data: any): Promise<void>;
  deleteSubscription(userId: string, id: string): Promise<void>;
  batchDeleteSubscriptions(userId: string, ids: string[]): Promise<any>;
  previewSubscription(url: string, subscriptionId?: string, userId?: string, applyRules?: boolean): Promise<any>;
}

export interface SubscriptionUpdateService {
  updateSingleSubscription(sub: { id: string; url: string }, signal?: AbortSignal): Promise<any>;
  updateMultipleSubscriptions(subscriptions: any[], options?: any): Promise<any>;
  updateAllSubscriptions(userId: string): Promise<{ updatedCount: number; failedCount: number }>;
}

export interface RuleService {
  getRules(userId: string, entityType: string, entityId: string): Promise<any[]>;
  createRule(userId: string, data: any): Promise<any>;
  updateRule(userId: string, ruleId: number, data: any): Promise<void>;
  deleteRule(userId: string, ruleId: number): Promise<void>;
}

export interface ImportService {
  importSubscriptions(userId: string, data: any): Promise<any>;
}

export type AppContext = {
  Bindings: Env;
  Variables: {
    jwtPayload: {
      id: string;
      username: string;
      role: string;
    };
    subscriptionService: SubscriptionService;
    subscriptionUpdateService: SubscriptionUpdateService;
    ruleService: RuleService;
    importService: ImportService;
  };
};