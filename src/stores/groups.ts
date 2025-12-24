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

  // 分组操作方法（本地状态）
  const setGroups = (newGroups: INodeGroup[]) => {
    groups.value = newGroups;
    updateLastUpdated();
  };

  const addGroupToLocal = (group: INodeGroup) => {
    groups.value.push(group);
    updateLastUpdated();
  };

  const updateGroupLocal = (groupId: string, updates: Partial<INodeGroup>) => {
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

  // ==================== API 方法 ====================

  const fetchGroups = async (): Promise<void> => {
    setLoading(true);
    clearError();

    try {
      const response = await httpClient.get('/groups');
      if (response.success && response.data) {
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

  // 创建分组
  const createGroup = async (name: string): Promise<{ success: boolean; message: string; data?: INodeGroup }> => {
    try {
      const response = await httpClient.post('/groups', { name });
      if (response.success) {
        await fetchGroups();
      }
      return response as { success: boolean; message: string; data?: INodeGroup };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  // 重命名分组
  const renameGroup = async (id: string, name: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await httpClient.put(`/groups/${id}`, { name });
      if (response.success) {
        await fetchGroups();
      }
      return response as { success: boolean; message: string };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  // 删除分组
  const deleteGroupApi = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await httpClient.delete(`/groups/${id}`);
      if (response.success) {
        removeGroup(id);
      }
      return response as { success: boolean; message: string };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  // 切换分组启用状态
  const toggleGroupEnabled = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await httpClient.patch(`/groups/${id}/toggle`);
      if (response.success) {
        await fetchGroups();
      }
      return response as { success: boolean; message: string };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred';
      return {
        success: false,
        message: errorMessage
      };
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

    // 本地状态方法
    setLoading,
    setError,
    clearError,
    setGroups,
    addGroup: addGroupToLocal,
    updateGroup: updateGroupLocal,
    removeGroup,
    clearGroups,
    findGroupById,
    findGroupByName,

    // API方法
    fetchGroups,
    createGroup,
    renameGroup,
    deleteGroupApi,
    toggleGroupEnabled,

    reset
  };
});

export type GroupStore = ReturnType<typeof useGroupStore>;
