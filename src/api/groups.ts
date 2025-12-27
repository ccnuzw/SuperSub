import client from './client';
import type { NodeGroup, ApiResponse } from '@/types';

export type { NodeGroup };

export const groupsApi = {
    fetchGroups: () => {
        return client.get<ApiResponse<NodeGroup[]>>('/groups');
    },

    createGroup: (name: string) => {
        return client.post<ApiResponse<NodeGroup>>('/groups', { name });
    },

    updateGroup: (id: string, name: string) => {
        return client.put<ApiResponse<NodeGroup>>(`/groups/${id}`, { name });
    },

    deleteGroup: (id: string) => {
        return client.delete<ApiResponse<null>>(`/groups/${id}`);
    },

    toggleGroup: (id: string) => {
        return client.patch<ApiResponse<NodeGroup>>(`/groups/${id}/toggle`, {});
    },

    updateGroupOrder: (groupIds: string[]) => {
        return client.post<ApiResponse<null>>('/groups/reorder', { ids: groupIds });
    }
};
