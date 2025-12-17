/**
 * 节点状态管理
 * 直接使用 Pinia 和 Vue 组合式 API
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { createApiError } from '@/utils/errorHandler';
import type { IHealthStatus } from '@/types';

/**
 * 节点状态接口
 */
interface INodeStatusState {
  statuses: Record<string, IHealthStatus>;
  lastHealthCheck: string | null;
  autoRefreshEnabled: boolean;
  refreshInterval: number;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * 节点状态Store
 * 提供节点健康状态的统一状态管理
 */
export const useNodeStatusStore = defineStore('nodeStatus', () => {
  // 状态
  const statuses = ref<Record<string, IHealthStatus>>({});
  const lastHealthCheck = ref<string | null>(null);
  const autoRefreshEnabled = ref<boolean>(false);
  const refreshInterval = ref<number>(30000); // 30秒
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<string | null>(null);

  // 计算属性
  const nodeCount = computed(() => Object.keys(statuses.value).length);
  const healthyNodes = computed(() =>
    Object.values(statuses.value).filter(status => status.status === 'healthy').length
  );
  const unhealthyNodes = computed(() =>
    Object.values(statuses.value).filter(status => status.status === 'unhealthy').length
  );
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

  // 节点状态操作方法
  const updateNodeStatus = (nodeId: string, status: IHealthStatus) => {
    statuses.value[nodeId] = status;
    updateLastUpdated();
  };

  const updateMultipleStatuses = (newStatuses: Record<string, IHealthStatus>) => {
    Object.assign(statuses.value, newStatuses);
    updateLastUpdated();
  };

  const removeNodeStatus = (nodeId: string) => {
    delete statuses.value[nodeId];
    updateLastUpdated();
  };

  const clearAllStatuses = () => {
    statuses.value = {};
    updateLastUpdated();
  };

  const getNodeStatus = (nodeId: string): IHealthStatus | undefined => {
    return statuses.value[nodeId];
  };

  const isNodeHealthy = (nodeId: string): boolean => {
    const status = statuses.value[nodeId];
    return status ? status.status === 'healthy' : false;
  };

  const getStatusByNodeId = (nodeId: string): IHealthStatus | undefined => {
    return getNodeStatus(nodeId);
  };

  const fetchStatuses = async (nodeIds: string[]): Promise<void> => {
    setLoading(true);
    clearError();

    try {
      // 这里应该调用API获取状态
      // const response = await api.fetchNodeStatuses(nodeIds);
      // updateMultipleStatuses(response.data);
      lastHealthCheck.value = new Date().toISOString();
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
    statuses.value = {};
    lastHealthCheck.value = null;
    autoRefreshEnabled.value = false;
    loading.value = false;
    error.value = null;
    lastUpdated.value = null;
  };

  return {
    // 状态
    statuses: statuses as any,
    lastHealthCheck,
    autoRefreshEnabled,
    refreshInterval,
    loading,
    error,
    lastUpdated,

    // 计算属性
    nodeCount,
    healthyNodes,
    unhealthyNodes,
    isIdle,

    // 方法
    setLoading,
    setError,
    clearError,
    updateNodeStatus,
    updateMultipleStatuses,
    removeNodeStatus,
    clearAllStatuses,
    getNodeStatus,
    getStatusByNodeId,
    isNodeHealthy,
    fetchStatuses,
    reset
  };
});

export type NodeStatusStore = ReturnType<typeof useNodeStatusStore>;