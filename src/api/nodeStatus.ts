import client from './client';
import type { HealthStatus, ApiResponse } from '@/types';

export const nodeStatusApi = {
    fetchStatuses: () => {
        return client.get<ApiResponse<HealthStatus[]>>('/node-statuses');
    },

    checkHealth: (nodeIds?: string[]) => {
        return client.post<ApiResponse<{ results: HealthStatus[] }>>('/nodes/check-health', { ids: nodeIds });
    }
};
