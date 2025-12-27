import client from './client';
import type { SubconverterAsset as Asset, ApiResponse } from '@/types';

export const assetsApi = {
    fetchAssets: (type?: string) => {
        const url = type ? `/assets?type=${type}` : '/assets';
        return client.get<ApiResponse<Asset[]>>(url);
    },

    createAsset: (asset: Partial<Asset>) => {
        return client.post<ApiResponse<Asset>>('/assets', asset);
    },

    updateAsset: (id: number, asset: Partial<Asset>) => {
        return client.put<ApiResponse<null>>(`/assets/${id}`, asset);
    },

    deleteAsset: (id: number) => {
        return client.delete<ApiResponse<null>>(`/assets/${id}`);
    }
};
