/**
 * 订阅分组状态管理
 * 直接使用 Pinia 和 Vue 组合式 API
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { createApiError } from '@/utils/errorHandler';
import type { ISubscriptionGroup } from '@/types';

/**
 * 订阅分组状态接口
 */
interface ISubscriptionGroupState {
  groups: ISubscriptionGroup[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * 订阅分组Store
 * 提供订阅分组的统一状态管理
 */
export const useSubscriptionGroupStore = defineStore('subscriptionGroups', () => {
  // 状态
  const groups = ref<ISubscriptionGroup[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<string | null>(null);

  // 计算属性
  const groupCount = computed(() => groups.value.length);
  const activeGroups = computed(() => groups.value.filter((group: ISubscriptionGroup) => group.subscription_count > 0));
  const maxGroupsReached = computed(() => groups.value.length >= 10);
  const totalSubscriptions = computed(() =>
    groups.value.reduce((sum: number, group: ISubscriptionGroup) => sum + (group.subscription_count || 0), 0)
  );
  const isEmpty = computed(() => groups.value.length === 0);
  const hasError = computed(() => !!error.value);
  const isIdle = computed(() => !loading.value && !error.value);

  // 更新lastUpdated
  const updateLastUpdated = () => {
    lastUpdated.value = new Date().toISOString();
  };

  // 基础方法
  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading;
    updateLastUpdated();
  };

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage;
    updateLastUpdated();
  };

  const clearError = () => {
    error.value = null;
    updateLastUpdated();
  };

  // 分组操作方法
  const setGroups = (newGroups: ISubscriptionGroup[]) => {
    groups.value = newGroups;
    updateLastUpdated();
  };

  const addGroup = (group: ISubscriptionGroup) => {
    groups.value.push(group);
    updateLastUpdated();
  };

  const updateGroup = (groupId: string, updates: Partial<ISubscriptionGroup>) => {
    const index = groups.value.findIndex(g => g.id === groupId);
    if (index !== -1) {
      groups.value[index] = { ...groups.value[index], ...updates };
      updateLastUpdated();
    }
  };

  const removeGroup = (groupId: string) => {
    groups.value = groups.value.filter(g => g.id !== groupId);
    updateLastUpdated();
  };

  const clearGroups = () => {
    groups.value = [];
    updateLastUpdated();
  };

  // 工具方法
  const findGroupById = (groupId: string): ISubscriptionGroup | undefined => {
    return groups.value.find(g => g.id === groupId);
  };

  const findGroupByName = (name: string): ISubscriptionGroup | undefined => {
    return groups.value.find(g => g.name === name);
  };

  const getGroupsWithSubscriptions = (): ISubscriptionGroup[] => {
    return groups.value.filter(group => (group.subscription_count || 0) > 0);
  };

  const toggleGroup = async (groupId: string): Promise<void> => {
    const group = findGroupById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const newEnabledStatus = !group.is_enabled;

    try {
      const { httpClient } = await import('@/services/http/HttpClient');
      const response = await httpClient.put(`/subscription-groups/${groupId}`, {
        is_enabled: newEnabledStatus ? 1 : 0
      });

      if (response.success && response.data) {
        updateGroup(groupId, { is_enabled: newEnabledStatus });
      } else {
        throw new Error(response.message || 'Failed to toggle group');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      throw new Error(errorMessage);
    }
  };

  const fetchGroups = async (): Promise<void> => {
    setLoading(true);
    clearError();

    try {
      // 修复: 添加实际的API调用
      const { httpClient } = await import('@/services/http/HttpClient');
      const response = await httpClient.get('/subscription-groups');

      if (response.success && response.data) {
        setGroups(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      const errorObj = createApiError(errorMessage);
      setError(errorObj.message);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    groups.value = [];
    loading.value = false;
    error.value = null;
    lastUpdated.value = null;
  };

  return {
    // 状态
    groups: groups as any, // 为了兼容性添加 as any
    loading,
    error,
    lastUpdated,

    // 计算属性
    groupCount,
    activeGroups,
    maxGroupsReached,
    totalSubscriptions,
    isEmpty,
    hasError,
    isIdle,

    // 方法
    setLoading,
    setError,
    clearError,
    setGroups,
    fetchGroups,
    addGroup,
    updateGroup,
    removeGroup,
    clearGroups,
    toggleGroup,
    findGroupById,
    findGroupByName,
    getGroupsWithSubscriptions,
    reset
  };
});

export type SubscriptionGroupStore = ReturnType<typeof useSubscriptionGroupStore>;