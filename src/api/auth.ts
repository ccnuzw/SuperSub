import client from './client';
import type { User, ApiResponse } from '@/types';

export const authApi = {
    login: (credentials: { username: string; password: any }) => {
        return client.post<ApiResponse<{ token: string; user: User }>>('/auth/login', credentials);
    },

    register: (credentials: { username: string; password: any }) => {
        return client.post<ApiResponse<{ token: string; user: User }>>('/auth/register', credentials);
    },

    verify: () => {
        return client.get<ApiResponse<{ user: User }>>('/auth/verify');
    },

    checkRegistrationStatus: () => {
        return client.get<ApiResponse<{ allow_registration: string }>>('/auth/registration-status');
    },

    logout: () => {
        // Logout is client-side mostly (clearing token), but if backend has endpoint:
        // return client.post<ApiResponse<null>>('/auth/logout');
        return Promise.resolve({ data: { success: true } });
    }
};
