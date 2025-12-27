import client from './client';
import type { SubscriptionRule, ApiResponse } from '@/types';

export const profileRulesApi = {
    fetchRules: (profileId: string) => {
        return client.get<ApiResponse<SubscriptionRule[]>>(`/profiles/${profileId}/rules`);
    },

    createRule: (profileId: string, rule: Partial<SubscriptionRule>) => {
        return client.post<ApiResponse<SubscriptionRule>>(`/profiles/${profileId}/rules`, rule);
    },

    updateRule: (profileId: string, ruleId: number, rule: Partial<SubscriptionRule>) => {
        return client.put<ApiResponse<SubscriptionRule>>(`/profiles/${profileId}/rules/${ruleId}`, rule);
    },

    deleteRule: (profileId: string, ruleId: number) => {
        return client.delete<ApiResponse<null>>(`/profiles/${profileId}/rules/${ruleId}`);
    }
};
