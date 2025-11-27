/**
 * 订阅管理组合式函数 - 重构版本使用统一API层
 * 将SubscriptionsView.vue中的业务逻辑抽取到可复用的composable中
 */

import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage, useDialog } from 'naive-ui';
import type { Subscription, SubscriptionGroup } from '@/types/entities';
import type { ApiResponse, CrudResult } from '@/types/common';
import {
  useEnhancedApi,
  createApiState,
  subscriptionService,
  subscriptionGroupService
} from '@/composables/useEnhancedApi';

/**
 * 订阅管理状态
 */
export interface SubscriptionState {
  subscriptions: Subscription[];
  groups: SubscriptionGroup[];
  loading: boolean;
  error: string | null;
  selectedIds: string[];
  searchQuery: string;
  currentFilter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * 订阅管理组合式函数
 */
export function useSubscriptions() {
  const router = useRouter();
  const { request, confirm } = useEnhancedApi();

  // 响应式状态
  const state = reactive<SubscriptionState>({
    subscriptions: [],
    groups: [],
    loading: false,
    error: null,
    selectedIds: [],
    searchQuery: '',
    currentFilter: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // 计算属性
  const filteredSubscriptions = computed(() => {
    let filtered = [...state.subscriptions];

    // 搜索过滤
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.name.toLowerCase().includes(query) ||
        sub.url.toLowerCase().includes(query) ||
        (sub.include_keywords && sub.include_keywords.toLowerCase().includes(query))
      );
    }

    // 分组过滤
    if (state.currentFilter !== 'all') {
      filtered = filtered.filter(sub => {
        if (state.currentFilter === 'ungrouped') {
          return !sub.group_id;
        } else {
          return sub.group_id === state.currentFilter;
        }
      });
    }

    // 排序
    if (state.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[state.sortBy as keyof Subscription];
        const bValue = b[state.sortBy as keyof Subscription];

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;

        return state.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  });

  const statistics = computed(() => ({
    total: state.subscriptions.length,
    enabled: state.subscriptions.filter(sub => sub.enabled).length,
    disabled: state.subscriptions.filter(sub => !sub.enabled).length,
    grouped: state.subscriptions.filter(sub => sub.group_id).length,
    ungrouped: state.subscriptions.filter(sub => !sub.group_id).length,
    totalNodes: state.subscriptions.reduce((sum, sub) => sum + (sub.node_count || 0), 0)
  }));

  // 方法

  /**
   * 获取订阅列表
   */
  const fetchSubscriptions = async () => {
    try {
      state.loading = true;
      state.error = null;

      const result = await request(
        () => subscriptionService.getSubscriptions({
          page: 1,
          pageSize: 1000, // 获取所有数据
          sort: state.sortBy,
          order: state.sortOrder
        }),
        { showErrorMessage: true }
      );

      if (result?.success) {
        state.subscriptions = result.data || [];
      }
    } catch (error) {
      state.error = '获取订阅列表失败';
      console.error('获取订阅列表失败:', error);
    } finally {
      state.loading = false;
    }
  };

  /**
   * 获取分组列表
   */
  const fetchGroups = async () => {
    try {
      const result = await request(
        () => subscriptionGroupService.getGroups({ page: 1, pageSize: 100 }),
        { showErrorMessage: false }
      );

      if (result?.success) {
        state.groups = result.data || [];
      }
    } catch (error) {
      console.error('获取分组列表失败:', error);
    }
  };

  /**
   * 创建订阅
   */
  const createSubscription = async (data: Partial<Subscription>): Promise<CrudResult<Subscription>> => {
    try {
      const result = await request(
        () => subscriptionService.createSubscription(data),
        {
          showMessage: true,
          successMessage: '订阅创建成功',
          showErrorMessage: true
        }
      );

      if (result?.success) {
        await fetchSubscriptions(); // 刷新列表
        return { success: true, data: result.data, message: '订阅创建成功' };
      } else {
        return { success: false, message: '订阅创建失败' };
      }
    } catch (error) {
      const errorMessage = '订阅创建失败';
      state.error = errorMessage;
      return { success: false, message: errorMessage };
    }
  };

  /**
   * 更新订阅
   */
  const updateSubscription = async (id: string, data: Partial<Subscription>): Promise<CrudResult<Subscription>> => {
    try {
      const result = await request(
        () => subscriptionService.updateSubscription(id, data),
        {
          showMessage: true,
          successMessage: '订阅更新成功',
          showErrorMessage: true
        }
      );

      if (result?.success) {
        await fetchSubscriptions(); // 刷新列表
        return { success: true, data: result.data, message: '订阅更新成功' };
      } else {
        return { success: false, message: '订阅更新失败' };
      }
    } catch (error) {
      const errorMessage = '订阅更新失败';
      state.error = errorMessage;
      return { success: false, message: errorMessage };
    }
  };

  /**
   * 删除订阅
   */
  const deleteSubscription = async (id: string): Promise<CrudResult<Subscription>> => {
    try {
      await confirm({
        title: '确认删除',
        content: '确定要删除这个订阅吗？此操作不可恢复。',
        type: 'warning',
        onConfirm: async () => {
          const result = await request(
            () => subscriptionService.deleteSubscription(id),
            {
              showMessage: true,
              successMessage: '订阅删除成功',
              showErrorMessage: true
            }
          );

          if (result?.success) {
            await fetchSubscriptions(); // 刷新列表
            return { success: true, message: '订阅删除成功' };
          } else {
            throw new Error('删除失败');
          }
        }
      });

      return { success: true, message: '订阅删除成功' };
    } catch (error) {
      return { success: false, message: '已取消删除' };
    }
  };

  /**
   * 批量删除订阅
   */
  const bulkDeleteSubscriptions = async (ids: string[]): Promise<CrudResult<Subscription[]>> => {
    if (ids.length === 0) {
      return { success: false, message: '请选择要删除的订阅' };
    }

    try {
      await confirm({
        title: '批量删除',
        content: `确定要删除选中的 ${ids.length} 个订阅吗？此操作不可恢复。`,
        type: 'warning',
        onConfirm: async () => {
          const promises = ids.map(id =>
            request(() => subscriptionService.deleteSubscription(id))
          );

          const results = await Promise.allSettled(promises);
          const successful = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.length - successful;

          if (failed === 0) {
            await fetchSubscriptions(); // 刷新列表
            return { success: true, message: `成功删除 ${successful} 个订阅` };
          } else {
            return {
              success: false,
              message: `删除完成：成功 ${successful} 个，失败 ${failed} 个`
            };
          }
        }
      });

      return { success: true, message: '批量删除已取消' };
    } catch (error) {
      return { success: false, message: '已取消批量删除' };
    }
  };

  /**
   * 更新订阅节点
   */
  const updateSubscriptionNodes = async (id: string): Promise<CrudResult<Subscription>> => {
    try {
      const result = await request(
        () => subscriptionService.updateSubscriptionNodes(id),
        {
          showMessage: true,
          successMessage: '订阅节点更新中...',
          showErrorMessage: true
        }
      );

      if (result?.success) {
        await fetchSubscriptions(); // 刷新列表
        return { success: true, data: result.data, message: '订阅节点更新成功' };
      } else {
        return { success: false, message: '订阅节点更新失败' };
      }
    } catch (error) {
      const errorMessage = '订阅节点更新失败';
      state.error = errorMessage;
      return { success: false, message: errorMessage };
    }
  };

  /**
   * 批量更新订阅分组
   */
  const bulkUpdateSubscriptionGroup = async (subscriptionIds: string[], groupId: string | null): Promise<CrudResult<Subscription[]>> => {
    if (subscriptionIds.length === 0) {
      return { success: false, message: '请选择要移动的订阅' };
    }

    try {
      const result = await request(
        () => subscriptionService.batchUpdateGroup(subscriptionIds, groupId),
        {
          showMessage: true,
          successMessage: `成功移动 ${subscriptionIds.length} 个订阅`,
          showErrorMessage: true
        }
      );

      if (result?.success) {
        await fetchSubscriptions(); // 刷新列表
        state.selectedIds = []; // 清空选择
        return { success: true, message: '批量移动分组成功' };
      } else {
        return { success: false, message: '批量移动分组失败' };
      }
    } catch (error) {
      const errorMessage = '批量移动分组失败';
      state.error = errorMessage;
      return { success: false, message: errorMessage };
    }
  };

  /**
   * 预览订阅
   */
  const previewSubscription = async (url: string, format?: string): Promise<CrudResult<any>> => {
    try {
      const result = await request(
        () => subscriptionService.previewSubscription(url, format),
        { showErrorMessage: true }
      );

      if (result?.success) {
        return { success: true, data: result.data, message: '预览获取成功' };
      } else {
        return { success: false, message: '预览获取失败' };
      }
    } catch (error) {
      const errorMessage = '预览获取失败';
      state.error = errorMessage;
      return { success: false, message: errorMessage };
    }
  };

  /**
   * 导入订阅
   */
  const importSubscriptions = async (data: {
    urls: string[];
    group_id?: string;
    enabled?: boolean;
  }): Promise<CrudResult<Subscription[]>> => {
    try {
      const result = await request(
        () => subscriptionService.importSubscriptions(data),
        {
          showMessage: true,
          successMessage: '订阅导入成功',
          showErrorMessage: true
        }
      );

      if (result?.success) {
        await fetchSubscriptions(); // 刷新列表
        return { success: true, data: result.data, message: '订阅导入成功' };
      } else {
        return { success: false, message: '订阅导入失败' };
      }
    } catch (error) {
      const errorMessage = '订阅导入失败';
      state.error = errorMessage;
      return { success: false, message: errorMessage };
    }
  };

  /**
   * 设置搜索查询
   */
  const setSearchQuery = (query: string) => {
    state.searchQuery = query;
  };

  /**
   * 设置过滤器
   */
  const setFilter = (filter: string) => {
    state.currentFilter = filter;
  };

  /**
   * 设置排序
   */
  const setSorting = (sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    state.sortBy = sortBy;
    state.sortOrder = sortOrder;
    fetchSubscriptions(); // 重新获取排序后的数据
  };

  /**
   * 选择/取消选择订阅
   */
  const toggleSubscriptionSelection = (id: string) => {
    const index = state.selectedIds.indexOf(id);
    if (index > -1) {
      state.selectedIds.splice(index, 1);
    } else {
      state.selectedIds.push(id);
    }
  };

  /**
   * 选择所有订阅
   */
  const selectAllSubscriptions = () => {
    state.selectedIds = filteredSubscriptions.value.map(sub => sub.id);
  };

  /**
   * 清空选择
   */
  const clearSelection = () => {
    state.selectedIds = [];
  };

  /**
   * 刷新数据
   */
  const refresh = async () => {
    await Promise.all([
      fetchSubscriptions(),
      fetchGroups()
    ]);
  };

  /**
   * 跳转到订阅详情页
   */
  const goToSubscriptionDetail = (id: string) => {
    router.push(`/subscriptions/${id}`);
  };

  /**
   * 跳转到分组管理页
   */
  const goToGroupManagement = () => {
    router.push('/groups');
  };

  /**
   * 初始化
   */
  const initialize = async () => {
    await refresh();
  };

  return {
    // 状态
    state,
    subscriptions: computed(() => state.subscriptions),
    groups: computed(() => state.groups),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    selectedIds: computed(() => state.selectedIds),
    filteredSubscriptions,
    statistics,

    // 方法
    fetchSubscriptions,
    fetchGroups,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    bulkDeleteSubscriptions,
    updateSubscriptionNodes,
    bulkUpdateSubscriptionGroup,
    previewSubscription,
    importSubscriptions,

    // 工具方法
    setSearchQuery,
    setFilter,
    setSorting,
    toggleSubscriptionSelection,
    selectAllSubscriptions,
    clearSelection,
    refresh,
    initialize,

    // 导航方法
    goToSubscriptionDetail,
    goToGroupManagement
  };
}

export default useSubscriptions;