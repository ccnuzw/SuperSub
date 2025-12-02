import { api } from '@/utils/api';
import type { Node, NodeStatus } from '@/types/entities';

// 节点创建数据类型
export interface CreateNodeData {
  name: string;
  link?: string;
  protocol: string;
  protocol_params?: any;
  server?: string;
  port?: number;
  password?: string;
  type?: string;
  params?: string;
  group_id?: string;
  sort_order?: number;
}

// 节点更新数据类型
export interface UpdateNodeData {
  name?: string;
  link?: string;
  protocol?: string;
  protocol_params?: any;
  server?: string;
  port?: number;
  password?: string;
  type?: string;
  params?: string;
  group_id?: string;
  sort_order?: number;
}

// 批量操作结果类型
export interface BatchResult {
  success: boolean;
  message: string;
  data?: {
    processed: number;
    failed: number;
    errors?: string[];
  };
}

// 健康检查结果类型
export interface HealthCheckResult {
  success: boolean;
  message: string;
  data?: NodeStatus[];
}

// 节点排序数据类型
export interface NodeOrderData {
  nodeId: string;
  sortOrder: number;
}

export class NodeService {
  /**
   * 获取所有节点
   */
  async fetchNodes(): Promise<Node[]> {
    const response = await api.get<any>('/nodes');
    // 处理不同的响应格式
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    if (response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to fetch nodes');
  }

  /**
   * 创建单个节点
   */
  async createNode(data: CreateNodeData): Promise<Node> {
    const response = await api.post<any>('/nodes', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // 如果直接返回节点数据
    if (response.data.id) {
      return response.data;
    }
    if (response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to create node');
  }

  /**
   * 更新节点
   */
  async updateNode(id: string, data: UpdateNodeData): Promise<Node> {
    const response = await api.put<any>(`/nodes/${id}`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    // 如果直接返回节点数据
    if (response.data.id) {
      return response.data;
    }
    if (response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to update node');
  }

  /**
   * 删除单个节点
   */
  async deleteNode(id: string): Promise<void> {
    const response = await api.delete(`/nodes/${id}`);
    if (response.data?.success === false) {
      throw new Error(response.data.message || 'Failed to delete node');
    }
  }

  /**
   * 批量删除节点
   */
  async batchDeleteNodes(ids: string[]): Promise<BatchResult> {
    const response = await api.post<BatchResult>('/nodes/batch-delete', { ids });
    // 处理不同的响应格式
    if (response.data?.success) {
      return response.data;
    }
    // 如果直接返回结果
    if (response.data?.message) {
      return response.data;
    }
    throw new Error(response.data?.message || 'Failed to batch delete nodes');
  }

  /**
   * 批量操作节点（排序、去重、清空）
   */
  async batchActions(action: 'sort' | 'deduplicate' | 'clear', groupId: string): Promise<BatchResult> {
    const response = await api.post<BatchResult>('/nodes/batch-actions', {
      action,
      group_id: groupId
    });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to perform batch action');
  }

  /**
   * 批量更新节点分组
   */
  async batchUpdateGroup(nodeIds: string[], groupId: string): Promise<BatchResult> {
    const response = await api.post<BatchResult>('/nodes/batch-update-group', {
      nodeIds,
      groupId
    });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to update node groups');
  }

  /**
   * 检查节点健康状态
   */
  async checkNodeHealth(nodeIds: string[]): Promise<HealthCheckResult> {
    const response = await api.post<HealthCheckResult>('/nodes/health-check', {
      nodeIds
    });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to check node health');
  }

  /**
   * 获取节点健康状态
   */
  async fetchNodeStatuses(): Promise<NodeStatus[]> {
    const response = await api.get<any>('/node-statuses');
    // 处理不同的响应格式
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    if (response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to fetch node statuses');
  }

  /**
   * 更新节点排序
   */
  async updateNodeOrder(nodeIds: string[]): Promise<void> {
    const response = await api.post('/nodes/update-order', { nodeIds });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update node order');
    }
  }
}