import client from './client';
import type { Profile, ApiResponse } from '@/types';

export const profilesApi = {
    fetchProfiles: () => {
        return client.get<ApiResponse<Profile[]>>('/profiles');
    },

    fetchProfile: (id: string) => {
        return client.get<ApiResponse<Profile>>(`/profiles/${id}`);
    },

    createProfile: (profile: Partial<Profile>) => {
        return client.post<ApiResponse<{ id: string }>>('/profiles', profile);
    },

    updateProfile: (id: string, profile: Partial<Profile>) => {
        return client.put<ApiResponse<null>>(`/profiles/${id}`, profile);
    },

    deleteProfile: (id: string) => {
        return client.delete<ApiResponse<null>>(`/profiles/${id}`);
    },

    previewNodes: (id: string) => {
        return client.get<ApiResponse<any> | string>(`/profiles/${id}/preview-nodes`); // Be careful with text response
    }
};
