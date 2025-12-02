import { ref, computed } from 'vue';
import { useNodeStatusStore } from '@/stores/nodeStatus';
import type { Node } from '@/types/entities';
import type { HealthStatus } from '@/types';

// 节点健康状态类型
export type NodeHealthStatus = 'online' | 'offline' | 'error' | 'testing' | 'pending';

// 节点健康信息接口
export interface NodeHealthInfo {
  nodeId: string;
  status: NodeHealthStatus;
  latency?: number;
  lastChecked?: string;
  error?: string;
}

// 健康状态颜色配置
export const STATUS_COLORS = {
  online: '#52c41a',      // 绿色 - 在线
  offline: '#ff4d4f',    // 红色 - 离线
  error: '#ff7a45',      // 橙色 - 错误
  testing: '#1890ff',    // 蓝色 - 测试中
  pending: '#d9d9d9',    // 灰色 - 待测试
};

// 健康状态文本配置
export const STATUS_TEXT = {
  online: '在线',
  offline: '离线',
  error: '错误',
  testing: '测试中',
  pending: '未测试',
};

export function useNodeHealth(nodes?: any) {
  const nodeStatusStore = useNodeStatusStore();
  const testingNodes = ref<Set<string>>(new Set());

  // 获取节点的健康状态
  const getNodeHealthStatus = (node: Node): NodeHealthInfo => {
    const status = nodeStatusStore.getStatusByNodeId(node.id);
    const isTesting = testingNodes.value.has(node.id);

    let healthStatus: NodeHealthStatus;
    let latency: number | undefined;
    let lastChecked: string | undefined;
    let error: string | undefined;

    if (isTesting) {
      healthStatus = 'testing';
    } else if (status) {
      // 映射后端状态到前端状态
      const backendStatus = status.status;
      if (backendStatus === 'healthy') {
        healthStatus = 'online';
      } else if (backendStatus === 'unhealthy') {
        healthStatus = 'offline';
      } else {
        // 对于 'testing', 'pending' 或其他未知状态，如果存在error信息则设为error
        if (status.error) {
          healthStatus = 'error';
        } else if (backendStatus === 'testing') {
          healthStatus = 'testing';
        } else {
          healthStatus = 'pending';
        }
      }

      latency = status.latency || undefined;
      lastChecked = status.last_checked || undefined;
      error = status.error || undefined;
    } else {
      healthStatus = 'pending';
    }

    return {
      nodeId: node.id,
      status: healthStatus,
      latency,
      lastChecked,
      error,
    };
  };

  // 获取状态颜色
  const getStatusColor = (status: NodeHealthStatus): string => {
    return STATUS_COLORS[status];
  };

  // 获取状态文本
  const getStatusText = (status: NodeHealthStatus): string => {
    return STATUS_TEXT[status];
  };

  // 获取延迟显示文本
  const getLatencyText = (latency?: number): string => {
    if (latency === undefined || latency === null) {
      return '未知';
    }
    if (latency === 0) {
      return '超时';
    }
    return `${latency}ms`;
  };

  // 获取延迟等级和颜色
  const getLatencyLevel = (latency?: number): { level: string; color: string } => {
    if (latency === undefined || latency === null) {
      return { level: '未知', color: '#d9d9d9' };
    }
    if (latency === 0) {
      return { level: '超时', color: '#ff4d4f' };
    }
    if (latency < 100) {
      return { level: '优秀', color: '#52c41a' };
    }
    if (latency < 300) {
      return { level: '良好', color: '#1890ff' };
    }
    if (latency < 1000) {
      return { level: '一般', color: '#faad14' };
    }
    return { level: '较差', color: '#ff7a45' };
  };

  // 格式化最后检查时间
  const formatLastChecked = (lastChecked?: string): string => {
    if (!lastChecked) {
      return '从未检查';
    }

    try {
      const date = new Date(lastChecked);
      const now = new Date();
      const diff = now.getTime() - date.getTime();

      if (diff < 60 * 1000) {
        return '刚刚';
      }
      if (diff < 60 * 60 * 1000) {
        return `${Math.floor(diff / (60 * 1000))}分钟前`;
      }
      if (diff < 24 * 60 * 60 * 1000) {
        return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
      }
      return date.toLocaleDateString();
    } catch {
      return lastChecked;
    }
  };

  // 检查单个节点健康
  const checkNodeHealth = async (nodeId: string): Promise<void> => {
    try {
      testingNodes.value.add(nodeId);
      await nodeStatusStore.checkNodesHealth([nodeId]);

      // 延迟移除测试状态
      setTimeout(() => {
        testingNodes.value.delete(nodeId);
      }, 10000);
    } catch (error) {
      testingNodes.value.delete(nodeId);
      console.error('检查节点健康失败:', error);
    }
  };

  // 批量检查节点健康
  const checkNodesHealth = async (nodeIds: string[]): Promise<void> => {
    try {
      nodeIds.forEach(id => testingNodes.value.add(id));
      await nodeStatusStore.checkNodesHealth(nodeIds);

      // 延迟移除测试状态
      setTimeout(() => {
        nodeIds.forEach(id => testingNodes.value.delete(id));
      }, 10000);
    } catch (error) {
      nodeIds.forEach(id => testingNodes.value.delete(id));
      console.error('批量检查节点健康失败:', error);
    }
  };

  // 刷新健康状态
  const refreshHealthStatus = async (): Promise<void> => {
    try {
      await nodeStatusStore.fetchStatuses();
    } catch (error) {
      console.error('刷新健康状态失败:', error);
    }
  };

  // 计算属性：是否正在检查健康状态
  const isCheckingHealth = computed(() => testingNodes.value.size > 0);

  // 计算属性：全局加载状态
  const globalLoading = computed(() => nodeStatusStore.loading);

  // 获取状态图标组件
  const getStatusIcon = (status: NodeHealthStatus) => {
    switch (status) {
      case 'online':
        return '✅';
      case 'offline':
        return '❌';
      case 'error':
        return '⚠️';
      case 'testing':
        return '🔄';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  // 获取状态标签类型
  const getStatusTagType = (status: NodeHealthStatus): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      case 'error':
        return 'warning';
      case 'testing':
        return 'info';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  // 节点是否需要重新检查
  const needsRecheck = (node: Node): boolean => {
    const health = getNodeHealthStatus(node);
    if (health.status === 'pending') {
      return true;
    }
    if (!health.lastChecked) {
      return true;
    }
    // 如果超过1小时未检查，则需要重新检查
    const lastCheckTime = new Date(health.lastChecked).getTime();
    const now = new Date().getTime();
    return (now - lastCheckTime) > 60 * 60 * 1000;
  };

  // 停止健康检查
  const stopHealthCheck = (nodeId: string): void => {
    testingNodes.value.delete(nodeId);
  };

  // 停止所有健康检查
  const stopAllHealthChecks = (): void => {
    testingNodes.value.clear();
  };

  return {
    // 响应式状态
    testingNodes,
    isCheckingHealth,
    globalLoading,

    // 核心方法
    getNodeHealthStatus,
    checkNodeHealth,
    checkNodesHealth,
    refreshHealthStatus,
    stopHealthCheck,
    stopAllHealthChecks,

    // 工具方法
    getStatusColor,
    getStatusText,
    getLatencyText,
    getLatencyLevel,
    formatLastChecked,
    getStatusIcon,
    getStatusTagType,
    needsRecheck,
  };
}