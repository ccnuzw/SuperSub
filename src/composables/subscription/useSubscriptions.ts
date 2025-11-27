/**
 * 订阅管理组合式函数
 * 将SubscriptionsView.vue中的业务逻辑抽取到可复用的composable中
 */
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage, useDialog } from 'naive-ui';
import type { Subscription } from '@/types/entities';
import type { ApiResponse, CrudResult } from '@/types/common';
import { simpleApiClient } from '@/utils/api/SimpleApiClient';

/**
 * 订阅管理状态
 */
export interface SubscriptionState {
  subscriptions: Subscription[];
  loading: boolean;
  showModal: boolean;
  saveLoading: boolean;
  editingSubscription: Subscription | null;
  updatingIds: Set<string>;
  selectedIds: string[];
  activeTab: string;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
}

/**
 * 订阅管理操作
 */
export interface SubscriptionActions {
  fetchSubscriptions: () => Promise<void>;
  createSubscription: (data: Partial<Subscription>) => Promise<CrudResult<Subscription>>;
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<CrudResult<Subscription>>;
  deleteSubscription: (id: string) => Promise<CrudResult>;
  syncSubscription: (id: string) => Promise<void>;
  batchUpdateSubscriptions: (ids: string[]) => Promise<void>;
  toggleSubscription: (id: string) => Promise<void>;
  handleEdit: (subscription: Subscription) => void;
  handleDelete: (subscription: Subscription) => void;
  handleSync: (subscription: Subscription) => void;
  clearSelection: () => void;
  search: (query: string) => void;
}

/**
 * 订阅管理组合式函数
 */
export function useSubscriptions() {
  // Router & UI
  const router = useRouter();
  const message = useMessage();
  const dialog = useDialog();

  // 响应式状态
  const state = reactive<SubscriptionState>({
    subscriptions: [],
    loading: false,
    showModal: false,
    saveLoading: false,
    editingSubscription: null,
    updatingIds: new Set(),
    selectedIds: [],
    activeTab: 'all',
    searchQuery: '',
    currentPage: 1,
    pageSize: 20
  });

  // 计算属性
  const filteredSubscriptions = computed(() => {
    let filtered = state.subscriptions;

    // 根据标签页过滤
    if (state.activeTab === 'ungrouped') {
      filtered = filtered.filter(sub => !sub.group_id);
    } else if (state.activeTab !== 'all') {
      filtered = filtered.filter(sub => sub.group_id === state.activeTab);
    }

    // 根据搜索关键词过滤
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.name.toLowerCase().includes(query) ||
        sub.url.toLowerCase().includes(query)
      );
    }

    return filtered;
  });

  const paginatedSubscriptions = computed(() => {
    const start = (state.currentPage - 1) * state.pageSize;
    const end = start + state.pageSize;
    return filteredSubscriptions.value.slice(start, end);
  });

  const totalPages = computed(() => {
    return Math.ceil(filteredSubscriptions.value.length / state.pageSize);
  });

  const selectedSubscriptions = computed(() => {
    return state.subscriptions.filter(sub => state.selectedIds.includes(sub.id));
  });

  const statistics = computed(() => {
    const total = state.subscriptions.length;
    const enabled = state.subscriptions.filter(sub => sub.enabled).length;
    const disabled = total - enabled;
    const updating = state.updatingIds.size;

    return { total, enabled, disabled, updating };
  });

  /**
   * 获取所有订阅
   */
  const fetchSubscriptions = async () => {
    state.loading = true;
    try {
      // 使用新的API客户端
      const response = await simpleApiClient.get('/subscriptions');
      if (response.success && response.data) {
        state.subscriptions = Array.isArray(response.data) ? response.data : [];
      } else {
        state.subscriptions = [];
      }
    } catch (error) {
      message.error('获取订阅列表失败');
      console.error('获取订阅列表失败:', error);
    } finally {
      state.loading = false;
    }
  };

  /**
   * 创建订阅
   */
  const createSubscription = async (data: Partial<Subscription>): Promise<CrudResult<Subscription>> => {
    state.saveLoading = true;
    try {
      const response = await simpleApiClient.post('/subscriptions', data);
      if (response.success) {
        message.success('订阅创建成功');
        await fetchSubscriptions();
        return { success: true, data: response.data as Subscription };
      } else {
        message.error(response.error || '订阅创建失败');
        return { success: false, message: response.error };
      }
    } catch (error) {
      const errorMessage = '订阅创建失败';
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      state.saveLoading = false;
    }
  };

  /**
   * 更新订阅
   */
  const updateSubscription = async (id: string, data: Partial<Subscription>): Promise<CrudResult<Subscription>> => {
    state.saveLoading = true;
    try {
      const response = await simpleApiClient.put(`/subscriptions/${id}`, data);
      if (response.success) {
        message.success('订阅更新成功');
        await fetchSubscriptions();
        return { success: true, data: response.data as Subscription };
      } else {
        message.error(response.error || '订阅更新失败');
        return { success: false, message: response.error };
      }
    } catch (error) {
      const errorMessage = '订阅更新失败';
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      state.saveLoading = false;
    }
  };

  /**
   * 删除订阅
   */
  const deleteSubscription = async (id: string): Promise<CrudResult> => {
    try {
      const response = await simpleApiClient.delete(`/subscriptions/${id}`);
      if (response.success) {
        message.success('订阅删除成功');
        await fetchSubscriptions();
        return { success: true };
      } else {
        message.error(response.error || '订阅删除失败');
        return { success: false, message: response.error };
      }
    } catch (error) {
      const errorMessage = '订阅删除失败';
      message.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  /**
   * 同步单个订阅
   */
  const syncSubscription = async (id: string) => {
    state.updatingIds.add(id);
    try {
      const response = await simpleApiClient.post(`/subscriptions/${id}/sync`);
      if (response.success) {
        message.success('订阅同步成功');
        await fetchSubscriptions();
      } else {
        message.error(response.error || '订阅同步失败');
      }
    } catch (error) {
      const errorMessage = '订阅同步失败';
      message.error(errorMessage);
    } finally {
      state.updatingIds.delete(id);
    }
  };

  /**
   * 批量同步订阅
   */
  const batchUpdateSubscriptions = async (ids: string[]) => {
    for (const id of ids) {
      state.updatingIds.add(id);
    }

    try {
      const response = await simpleApiClient.post('/subscriptions/batch-sync', { ids });
      if (response.success) {
        message.success(`成功同步 ${ids.length} 个订阅`);
        await fetchSubscriptions();
      } else {
        message.error(response.error || '批量同步失败');
      }
    } catch (error) {
      const errorMessage = '批量同步失败';
      message.error(errorMessage);
    } finally {
      ids.forEach(id => state.updatingIds.delete(id));
    }
  };

  /**
   * 切换订阅启用状态
   */
  const toggleSubscription = async (id: string) => {
    const subscription = state.subscriptions.find(sub => sub.id === id);
    if (!subscription) return;

    const newEnabled = !subscription.enabled;
    try {
      const response = await simpleApiClient.patch(`/subscriptions/${id}`, {
        enabled: newEnabled
      });
      if (response.success) {
        message.success(`订阅已${newEnabled ? '启用' : '禁用'}`);
        await fetchSubscriptions();
      }
    } catch (error) {
      message.error('状态切换失败');
    }
  };

  /**
   * 编辑订阅
   */
  const handleEdit = (subscription: Subscription) => {
    state.editingSubscription = { ...subscription };
    state.showModal = true;
  };

  /**
   * 删除订阅（带确认）
   */
  const handleDelete = (subscription: Subscription) => {
    dialog.warning({
      title: '确认删除',
      content: `确定要删除订阅"${subscription.name}"吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => deleteSubscription(subscription.id)
    });
  };

  /**
   * 同步订阅
   */
  const handleSync = (subscription: Subscription) => {
    syncSubscription(subscription.id);
  };

  /**
   * 清除选择
   */
  const clearSelection = () => {
    state.selectedIds = [];
  };

  /**
   * 搜索
   */
  const search = (query: string) => {
    state.searchQuery = query;
    state.currentPage = 1;
  };

  /**
   * 设置标签页
   */
  const setActiveTab = (tab: string) => {
    state.activeTab = tab;
    state.currentPage = 1;
  };

  /**
   * 打开添加模态框
   */
  const openAddModal = () => {
    state.editingSubscription = null;
    state.showModal = true;
  };

  /**
   * 关闭模态框
   */
  const closeModal = () => {
    state.showModal = false;
    state.editingSubscription = null;
  };

  /**
   * 选择订阅
   */
  const selectSubscription = (id: string, selected: boolean) => {
    if (selected) {
      state.selectedIds.push(id);
    } else {
      state.selectedIds = state.selectedIds.filter(selectedId => selectedId !== id);
    }
  };

  /**
   * 全选/取消全选
   */
  const selectAll = (selected: boolean) => {
    if (selected) {
      state.selectedIds = paginatedSubscriptions.value.map(sub => sub.id);
    } else {
      state.selectedIds = [];
    }
  };

  return {
    // 状态
    state: reactive(state),
    subscriptions: computed(() => state.subscriptions),
    loading: computed(() => state.loading),
    showModal: computed(() => state.showModal),
    saveLoading: computed(() => state.saveLoading),
    editingSubscription: computed(() => state.editingSubscription),
    updatingIds: computed(() => state.updatingIds),
    selectedIds: computed(() => state.selectedIds),
    activeTab: computed(() => state.activeTab),
    searchQuery: computed(() => state.searchQuery),
    currentPage: computed(() => state.currentPage),
    pageSize: computed(() => state.pageSize),

    // 计算属性
    filteredSubscriptions,
    paginatedSubscriptions,
    totalPages,
    selectedSubscriptions,
    statistics,

    // 方法
    fetchSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    syncSubscription,
    batchUpdateSubscriptions,
    toggleSubscription,
    handleEdit,
    handleDelete,
    handleSync,
    clearSelection,
    search,
    setActiveTab,
    openAddModal,
    closeModal,
    selectSubscription,
    selectAll,
    setPage: (page: number) => { state.currentPage = page; },
    setPageSize: (size: number) => { state.pageSize = size; }
  };
}