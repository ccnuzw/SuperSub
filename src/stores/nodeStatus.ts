/**
 * 节点状态管理
 * 直接使用 Pinia 和 Vue 组合式 API
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { createApiError } from '@/utils/errorHandler';
import type { IHealthStatus } from '@/types';
import httpClient from '@/services/http/HttpClient';

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
      // 调用API获取状态
      const response = await httpClient.post('/nodes/health-check', { nodeIds });
      if (response.success && response.data) {
        updateMultipleStatuses(response.data);
      }
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

  // 检查节点健康状态
  const checkNodesHealth = async (nodeIds: string[]): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    clearError();

    // 标记节点为测试中状态
    const testingStatuses: Record<string, IHealthStatus> = {};
    nodeIds.forEach(id => {
      testingStatuses[id] = {
        node_id: id,
        status: 'testing',
        latency: null,
        last_checked: new Date().toISOString(),
        error: null
      };
    });
    updateMultipleStatuses(testingStatuses);

    try {
      const response = await httpClient.post('/nodes/health-check', { nodeIds });
      if (response.success && response.data) {
        // 更新节点状态
        const newStatuses: Record<string, IHealthStatus> = {};
        Object.entries(response.data).forEach(([nodeId, status]: [string, any]) => {
          newStatuses[nodeId] = {
            node_id: nodeId,
            status: status.healthy ? 'healthy' : 'unhealthy',
            latency: status.latency,
            last_checked: new Date().toISOString(),
            error: status.error || null
          };
        });
        updateMultipleStatuses(newStatuses);
        lastHealthCheck.value = new Date().toISOString();

        const healthyCount = Object.values(newStatuses).filter(s => s.status === 'healthy').length;
        return {
          success: true,
          message: `测试完成：${healthyCount}/${nodeIds.length} 个节点正常`
        };
      } else {
        setError(response.message || '健康检查失败');
        return {
          success: false,
          message: response.message || '健康检查失败'
        };
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error occurred';
      const errorObj = createApiError(errorMessage);
      setError(errorObj.message);

      // 标记检查失败的节点为异常
      const errorStatuses: Record<string, IHealthStatus> = {};
      nodeIds.forEach(id => {
        errorStatuses[id] = {
          node_id: id,
          status: 'unhealthy',
          latency: null,
          last_checked: new Date().toISOString(),
          error: errorMessage
        };
      });
      updateMultipleStatuses(errorStatuses);

      return {
        success: false,
        message: errorMessage
      };
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
    checkNodesHealth,
    reset
  };
});

export type NodeStatusStore = ReturnType<typeof useNodeStatusStore>;