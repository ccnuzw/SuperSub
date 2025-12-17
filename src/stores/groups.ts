/**
 * 分组状态管理
 * 直接使用 Pinia 和 Vue 组合式 API
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { createApiError } from '@/utils/errorHandler';
import type { INodeGroup } from '@/types';
import httpClient from '@/services/http/HttpClient';

/**
 * 分组状态接口
 */
interface IGroupState {
  groups: INodeGroup[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * 分组Store
 * 提供分组管理的统一状态管理
 */
export const useGroupStore = defineStore('groups', () => {
  // 状态
  const groups = ref<INodeGroup[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<string | null>(null);

  // 计算属性
  const groupCount = computed(() => groups.value.length);
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
  const setGroups = (newGroups: INodeGroup[]) => {
    groups.value = newGroups;
    updateLastUpdated();
  };

  const addGroup = (group: INodeGroup) => {
    groups.value.push(group);
    updateLastUpdated();
  };

  const updateGroup = (groupId: string, updates: Partial<INodeGroup>) => {
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
  const findGroupById = (groupId: string): INodeGroup | undefined => {
    return groups.value.find(g => g.id === groupId);
  };

  const findGroupByName = (name: string): INodeGroup | undefined => {
    return groups.value.find(g => g.name === name);
  };

  const fetchGroups = async (): Promise<void> => {
    setLoading(true);
    clearError();

    try {
      const response = await httpClient.get('/groups');
      if (response.success && response.data) {
        // 确保响应数据是数组格式
        const groupsData = Array.isArray(response.data) ? response.data : [];
        setGroups(groupsData);
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
    groups,
    loading,
    error,
    lastUpdated,

    // 计算属性
    groupCount,
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
    findGroupById,
    findGroupByName,
    reset
  };
});

export type GroupStore = ReturnType<typeof useGroupStore>;