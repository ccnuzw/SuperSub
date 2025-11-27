import { defineStore } from 'pinia';
import type { SubscriptionGroup } from '@/types/entities';
import { SimpleBaseStore, createSimpleStore } from '@/stores/base/SimpleBaseStore';
import type { ApiResponse } from '@/types/common';

/**
 * 新的SubscriptionGroups Store - 使用基础架构重构
 */
export const useSubscriptionGroupStore = defineStore('subscriptionGroups', () => {
  // 使用SimpleBaseStore创建基础CRUD功能
  const baseStore = createSimpleStore('/subscription-groups', 10, 20);

  // 扩展特定功能
  const groups = baseStore.items;
  const loading = baseStore.loading;
  const error = baseStore.error;

  /**
   * 获取所有订阅分组
   */
  const fetchGroups = async () => {
    return await baseStore.fetchItems();
  };

  /**
   * 添加订阅分组（带验证）
   */
  const addGroup = async (name: string, description?: string): Promise<ApiResponse<SubscriptionGroup>> => {
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: '分组名称不能为空',
        message: '分组名称不能为空'
      };
    }

    if (name.length > 50) {
      return {
        success: false,
        error: '分组名称不能超过50个字符',
        message: '分组名称不能超过50个字符'
      };
    }

    if (description && description.length > 200) {
      return {
        success: false,
        error: '分组描述不能超过200个字符',
        message: '分组描述不能超过200个字符'
      };
    }

    // 检查是否已存在同名分组
    const existingGroup = groups.value.find(g => g.name === name.trim());
    if (existingGroup) {
      return {
        success: false,
        error: '分组名称已存在',
        message: '分组名称已存在'
      };
    }

    const groupData = {
      name: name.trim(),
      description: description?.trim() || null,
      sort_order: groups.value.length,
      is_enabled: true
    };

    return await baseStore.addItem(groupData);
  };

  /**
   * 更新订阅分组
   */
  const updateGroup = async (
    id: string,
    name?: string,
    description?: string
  ): Promise<ApiResponse<SubscriptionGroup>> => {
    const updates: Partial<SubscriptionGroup> = {};

    if (name !== undefined) {
      updates.name = name.trim();

      if (updates.name.length === 0) {
        return {
          success: false,
          error: '分组名称不能为空',
          message: '分组名称不能为空'
        };
      }

      if (updates.name.length > 50) {
        return {
          success: false,
          error: '分组名称不能超过50个字符',
          message: '分组名称不能超过50个字符'
        };
      }

      // 检查是否已存在同名分组（排除自己）
      const existingGroup = groups.value.find(g => g.id !== id && g.name === updates.name);
      if (existingGroup) {
        return {
          success: false,
          error: '分组名称已存在',
          message: '分组名称已存在'
        };
      }
    }

    if (description !== undefined) {
      updates.description = description.trim() || undefined;

      if (updates.description && updates.description.length > 200) {
        return {
          success: false,
          error: '分组描述不能超过200个字符',
          message: '分组描述不能超过200个字符'
        };
      }
    }

    return await baseStore.updateItem(id, updates);
  };

  /**
   * 删除订阅分组
   */
  const deleteGroup = async (id: string): Promise<ApiResponse> => {
    // 检查分组是否被订阅使用
    // 这里可以添加检查逻辑，例如检查是否有订阅使用此分组

    // 基础删除逻辑
    return await baseStore.deleteItem(id);
  };

  /**
   * 切换分组启用状态
   */
  const toggleGroup = async (id: string): Promise<ApiResponse<SubscriptionGroup>> => {
    const group = groups.value.find(g => g.id === id);
    if (!group) {
      return {
        success: false,
        error: '分组不存在',
        message: '分组不存在'
      };
    }

    return await baseStore.updateItem(id, {
      is_enabled: !group.is_enabled
    });
  };

  /**
   * 更新分组排序
   */
  const updateGroupOrder = async (groupIds: string[]): Promise<ApiResponse> => {
    try {
      loading.value = true;
      error.value = null;

      // 使用简化的API客户端
      const response = await baseStore.bulkOperation(groupIds, 'update-order');

      if (response.success) {
        // 更新本地排序
        const updatedGroups = groupIds.map((id, index) => {
          const group = groups.value.find(g => g.id === id);
          return group ? { ...group, sort_order: index } : null;
        }).filter(Boolean) as SubscriptionGroup[];

        groups.value = updatedGroups;
      }

      return response;
    } catch (err) {
      const errorMessage = '更新分组排序失败';
      error.value = errorMessage;
      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根据ID获取分组名称
   */
  const getGroupName = (id: string): string => {
    const group = groups.value.find(g => g.id === id);
    return group?.name || '未分组';
  };

  /**
   * 获取启用的分组
   */
  const getEnabledGroups = (): SubscriptionGroup[] => {
    return groups.value.filter(g => g.is_enabled);
  };

  /**
   * 获取分组统计信息
   */
  const getGroupStats = () => {
    return {
      total: groups.value.length,
      enabled: groups.value.filter(g => g.is_enabled).length,
      disabled: groups.value.filter(g => !g.is_enabled).length,
      withDescription: groups.value.filter(g => g.description).length
    };
  };

  /**
   * 搜索分组
   */
  const searchGroups = (query: string): SubscriptionGroup[] => {
    if (!query.trim()) {
      return groups.value;
    }

    const searchTerm = query.toLowerCase().trim();
    return groups.value.filter(group =>
      group.name.toLowerCase().includes(searchTerm) ||
      (group.description && group.description.toLowerCase().includes(searchTerm))
    );
  };

  /**
   * 按名称排序分组
   */
  const sortGroupsByName = (ascending: boolean = true): void => {
    groups.value.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return ascending ? comparison : -comparison;
    });
  };

  /**
   * 按创建时间排序分组
   */
  const sortGroupsByCreatedDate = (newestFirst: boolean = true): void => {
    groups.value.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return newestFirst ? dateB - dateA : dateA - dateB;
    });
  };

  /**
   * 重置状态
   */
  const reset = () => {
    baseStore.reset();
  };

  return {
    // 状态
    groups,
    loading,
    error,

    // 基础CRUD方法
    fetchGroups,
    addGroup,
    updateGroup,
    deleteGroup,
    toggleGroup,
    updateGroupOrder,

    // 扩展方法
    getGroupName,
    getEnabledGroups,
    getGroupStats,
    searchGroups,
    sortGroupsByName,
    sortGroupsByCreatedDate,
    reset,

    // 基础Store方法（如果需要直接访问）
    fetchItems: baseStore.fetchItems,
    findById: baseStore.findById,
    clearError: baseStore.clearError
  };
});