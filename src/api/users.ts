import client from './client';
import type { User, ApiResponse } from '@/types';

export const usersApi = {
    fetchDefaults: () => {
        return client.get<ApiResponse<{ default_backend_id?: number; default_config_id?: number }>>('/user/defaults');
    },

    updateDefaults: (defaults: { default_backend_id?: number; default_config_id?: number }) => {
        return client.put<ApiResponse<null>>('/user/defaults', defaults);
    },

    getSubscriptionToken: () => {
        return client.get<ApiResponse<{ token: string }>>('/user/sub-token');
    },

    resetSubscriptionToken: () => {
        return client.post<ApiResponse<{ token: string; jwt: string; user: User }>>('/user/sub-token/reset');
    },

    updateSubscriptionToken: (token: string) => {
        return client.put<ApiResponse<{ jwt: string; user: User }>>('/user/sub-token', { token });
    },

    updatePassword: (password: string) => {
        return client.put<ApiResponse<null>>('/user/password', { password });
    }
};
