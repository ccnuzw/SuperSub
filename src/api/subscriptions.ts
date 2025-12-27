import client from './client';
// import type { Node } from './nodes'; 

import type { Subscription, ApiResponse } from '@/types';

export const subscriptionsApi = {
    fetchSubscriptions: (groupId?: string) => {
        const url = groupId ? `/subscriptions?group_id=${groupId}` : '/subscriptions';
        return client.get<ApiResponse<Subscription[]>>(url);
    },

    fetchGroupedSubscriptions: () => {
        return client.get<ApiResponse<{ group_name: string; subscriptions: { id: string; name: string }[] }[]>>('/subscriptions/grouped');
    },

    addSubscription: (sub: { name: string; url: string; group_id?: string }) => {
        return client.post<ApiResponse<Subscription>>('/subscriptions', sub);
    },

    updateSubscription: (id: string, sub: { name: string; url: string; group_id?: string; is_enabled?: boolean }) => {
        return client.put<ApiResponse<Subscription>>(`/subscriptions/${id}`, sub);
    },

    deleteSubscription: (id: string, deleteNodes: boolean = false) => {
        return client.delete<ApiResponse<null>>(`/subscriptions/${id}?delete_nodes=${deleteNodes}`);
    },

    updateFromUrl: (id: string, signal?: AbortSignal) => {
        return client.post<ApiResponse<Subscription>>(`/subscriptions/${id}/update`, {}, { signal });
    },

    updateAll: () => {
        return client.post<ApiResponse<any>>('/subscriptions/update-all');
    },

    getNodesPreview: (id: string) => {
        return client.get<ApiResponse<any[]>>(`/subscriptions/${id}/nodes`);
    },

    // Batch
    batchImport: (subscriptions: { name: string; url: string }[], groupId?: string) => {
        return client.post<ApiResponse<{ created: number; message: string }>>('/subscriptions/batch-import', { subscriptions, groupId });
    },

    batchDelete: (ids: string[]) => {
        return client.post<ApiResponse<null>>('/subscriptions/batch-delete', { ids });
    },

    clearAll: () => {
        return client.post<ApiResponse<null>>('/subscriptions/clear-all');
    },

    clearByGroup: (groupId: string | null) => {
        return client.post<ApiResponse<null>>('/subscriptions/clear-by-group', { groupId });
    },

    // Preview
    preview: (payload: { url: string; subscription_id?: string; apply_rules?: boolean }) => {
        return client.post<ApiResponse<{ nodes: any[]; analysis: any }>>('/subscriptions/preview', payload, { timeout: 15000 });
    },

    batchUpdateGroup: (payload: { subscriptionIds: string[]; groupId: string | null }) => {
        return client.post<ApiResponse<null>>('/subscriptions/batch-update-group', payload);
    },

    batchUpdateUrls: (payload: { updates: { id: string; url: string }[] }) => {
        return client.post<ApiResponse<null>>('/subscriptions/batch-update-urls', payload);
    },

    clearFailed: (groupId: string | null | 'all') => {
        return client.post<ApiResponse<null>>('/subscriptions/clear-failed', { groupId });
    },

    // Rules
    fetchRules: (id: string) => {
        return client.get<ApiResponse<import('@/types').SubscriptionRule[]>>(`/subscriptions/${id}/rules`);
    },
    addRule: (id: string, rule: Partial<import('@/types').SubscriptionRule>) => {
        return client.post<ApiResponse<import('@/types').SubscriptionRule>>(`/subscriptions/${id}/rules`, rule);
    },
    updateRule: (subscriptionId: string, ruleId: number, rule: Partial<import('@/types').SubscriptionRule>) => {
        return client.put<ApiResponse<import('@/types').SubscriptionRule>>(`/subscriptions/${subscriptionId}/rules/${ruleId}`, rule);
    },
    deleteRule: (subscriptionId: string, ruleId: number) => {
        return client.delete<ApiResponse<null>>(`/subscriptions/${subscriptionId}/rules/${ruleId}`);
    }
};
