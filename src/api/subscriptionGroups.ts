import client from './client';
import type { SubscriptionGroup, ApiResponse } from '@/types';

export type { SubscriptionGroup }; // Export from here if needed, or prefer using @/types

export const subscriptionGroupsApi = {
    fetchGroups: () => {
        return client.get<ApiResponse<SubscriptionGroup[]>>('/subscription-groups');
    },

    createGroup: (name: string, description?: string) => {
        return client.post<ApiResponse<SubscriptionGroup>>('/subscription-groups', { name, description });
    },

    updateGroup: (id: string, name: string, description?: string) => {
        return client.put<ApiResponse<SubscriptionGroup>>(`/subscription-groups/${id}`, { name, description });
    },

    deleteGroup: (id: string) => {
        return client.delete<ApiResponse<null>>(`/subscription-groups/${id}`);
    },

    toggleGroup: (id: string) => {
        return client.put<ApiResponse<SubscriptionGroup>>(`/subscription-groups/${id}/toggle`, {});
    },

    updateGroupOrder: (groupIds: string[]) => {
        return client.post<ApiResponse<null>>('/subscription-groups/reorder', { ids: groupIds });
    }
};
