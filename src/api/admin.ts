import client from './client';
import type { User } from '@/types';

export interface LogSummary {
    todayAccess: number;
    weeklyUniqueIps: number;
}

export interface SystemSettings {
    allow_registration?: string;
    [key: string]: any;
}

export interface ProfileLogsResponse {
    metrics: {
        totalAccess: number;
        uniqueIps: number;
    };
    trends: { date: string; count: number }[];
    distribution: { countries: { country: string; count: number }[] };
    logs: {
        data: { ip_address: string; user_agent: string; country: string; city: string; accessed_at: string }[];
        total: number;
        page: number;
        limit: number;
    };
}

import type { ApiResponse } from '@/types';

export const adminApi = {
    fetchLogSummary: () => {
        return client.get<ApiResponse<LogSummary>>('/admin/logs/summary');
    },

    fetchProfileLogs: (profileId: string, page: number = 1, limit: number = 10) => {
        return client.get<ApiResponse<ProfileLogsResponse>>(`/admin/logs/profile/${profileId}?page=${page}&limit=${limit}`);
    },

    // User Management
    fetchUsers: () => {
        return client.get<ApiResponse<User[]>>('/admin/users');
    },

    updateUserRole: (id: string, role: 'admin' | 'user') => {
        return client.put<ApiResponse<null>>(`/admin/users/${id}`, { role });
    },

    deleteUser: (id: string) => {
        return client.delete<ApiResponse<null>>(`/admin/users/${id}`);
    },

    // System Settings
    fetchSystemSettings: () => {
        return client.get<ApiResponse<SystemSettings>>('/admin/system-settings');
    },

    updateSystemSettings: (settings: Partial<SystemSettings>) => {
        return client.post<ApiResponse<null>>('/admin/system-settings', settings);
    },

    testTelegram: () => {
        return client.post<ApiResponse<null>>('/system/settings/test-telegram');
    }
};
