import client from './client';

export interface Setting {
    key: string;
    value: string;
    type?: string;
    category?: string;
    description?: string;
}

import type { ApiResponse } from '@/types';

export const settingsApi = {
    fetchSettings: () => {
        return client.get<ApiResponse<Setting[]>>('/settings');
    },

    updateSettings: (settings: Setting[]) => {
        return client.post<ApiResponse<null>>('/settings', settings);
    }
};
