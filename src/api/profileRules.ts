import client from './client';
import type { SubscriptionRule, ApiResponse } from '@/types';

export const profileRulesApi = {
    fetchRules: (profileId: string) => {
        return client.get<ApiResponse<SubscriptionRule[]>>(`/profile-rules/${profileId}`);
    },

    createRule: (profileId: string, rule: Partial<SubscriptionRule>) => {
        return client.post<ApiResponse<SubscriptionRule>>(`/profile-rules`, { ...rule, profile_id: profileId });
    },

    updateRule: (profileId: string, ruleId: number, rule: Partial<SubscriptionRule>) => {
        return client.put<ApiResponse<SubscriptionRule>>(`/profile-rules/${ruleId}`, rule);
    },

    deleteRule: (profileId: string, ruleId: number) => {
        return client.delete<ApiResponse<null>>(`/profile-rules/${ruleId}`);
    }
};
