import client from './client';
import type { Node, ApiResponse } from '@/types';

export const nodesApi = {
    fetchNodes: (groupId?: string) => {
        const url = groupId ? `/nodes?group_id=${groupId}` : '/nodes';
        return client.get<ApiResponse<Node[]>>(url);
    },

    fetchGroupedNodes: () => {
        return client.get<ApiResponse<{ group_name: string; nodes: { id: string; name: string }[] }[]>>('/nodes/grouped');
    },

    addNode: (node: Partial<Node>) => {
        return client.post<ApiResponse<Node>>('/nodes', node);
    },

    updateNode: (id: string, node: Partial<Node>) => {
        return client.put<ApiResponse<Node>>(`/nodes/${id}`, node);
    },

    deleteNode: (id: string) => {
        return client.delete<ApiResponse<null>>(`/nodes/${id}`);
    },

    // Batch Actions
    batchImport: (nodes: any[], groupId?: string | null) => {
        return client.post<ApiResponse<{ count: number }>>('/nodes/batch-import', { nodes, groupId });
    },

    importNodes: (nodes: any[], groupId?: string | null) => {
        return client.post<ApiResponse<{ count: number }>>('/nodes/batch-import', { nodes, groupId });
    },

    batchDelete: (ids: string[]) => {
        return client.post<ApiResponse<{ count: number }>>('/nodes/batch-delete', { ids });
    },

    batchGroup: (nodeIds: string[], groupId: string | null) => {
        return client.post<ApiResponse<any>>('/nodes/batch-update-group', { nodeIds, groupId });
    },

    batchUpdateGroup: (nodeIds: string[], groupId: string | null) => {
        return client.post<ApiResponse<any>>('/nodes/batch-update-group', { nodeIds, groupId });
    },

    sortNodes: (groupId?: string) => {
        return client.post<ApiResponse<any>>('/nodes/batch-actions', { action: 'sort', groupId });
    },

    deduplicateNodes: (groupId?: string) => {
        return client.post<ApiResponse<any>>('/nodes/batch-actions', { action: 'deduplicate', groupId });
    },

    batchAction: (action: 'sort' | 'deduplicate' | 'clear', groupId?: string) => {
        return client.post<ApiResponse<any>>('/nodes/batch-actions', { action, groupId });
    },

    updateOrder: (nodeIds: string[]) => {
        return client.post<ApiResponse<any>>('/nodes/update-order', { nodeIds });
    },

    checkHealth: (ids?: string[]) => {
        return client.post<ApiResponse<{ results: Record<string, any> }>>('/nodes/check-health', { ids });
    }
};
