import client from './client';
import type { ApiResponse } from '@/types';

export interface UserStats {
    total_subscriptions: number;
    total_nodes: number;
    total_traffic: number;
    used_traffic: number;
    today_traffic: number;
}

export const statsApi = {
    fetchUserStats: () => {
        return client.get<ApiResponse<UserStats>>('/stats/user');
    }
};
