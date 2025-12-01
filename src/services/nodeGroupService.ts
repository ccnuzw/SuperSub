import { api } from '@/utils/api';
import type { NodeGroup } from '@/types/entities';

// 创建分组数据类型
export interface CreateGroupData {
  name: string;
  enabled?: boolean;
  sort_order?: number;
}

// 更新分组数据类型
export interface UpdateGroupData {
  name?: string;
  enabled?: boolean;
  sort_order?: number;
}

export class NodeGroupService {
  /**
   * 获取所有分组
   */
  async fetchGroups(): Promise<NodeGroup[]> {
    const response = await api.get<any>('/node-groups');
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
    throw new Error(response.data?.message || 'Failed to fetch groups');
  }

  /**
   * 创建新分组
   */
  async createGroup(data: CreateGroupData): Promise<NodeGroup> {
    const response = await api.post<any>('/node-groups', data);
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    // 如果直接返回分组数据
    if (response.data?.id) {
      return response.data;
    }
    if (response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to create group');
  }

  /**
   * 更新分组
   */
  async updateGroup(id: string, data: UpdateGroupData): Promise<NodeGroup> {
    const response = await api.put<any>(`/node-groups/${id}`, data);
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    // 如果直接返回分组数据
    if (response.data?.id) {
      return response.data;
    }
    if (response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to update group');
  }

  /**
   * 删除分组
   */
  async deleteGroup(id: string): Promise<void> {
    const response = await api.delete(`/node-groups/${id}`);
    if (response.data?.success === false) {
      throw new Error(response.data?.message || 'Failed to delete group');
    }
  }

  /**
   * 切换分组启用状态
   */
  async toggleGroup(id: string): Promise<NodeGroup> {
    const response = await api.post<any>(`/node-groups/${id}/toggle`);
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    // 如果直接返回分组数据
    if (response.data?.id) {
      return response.data;
    }
    if (response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to toggle group');
  }

  /**
   * 更新分组排序
   */
  async updateGroupOrder(groupIds: string[]): Promise<void> {
    const response = await api.post('/node-groups/update-order', { groupIds });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update group order');
    }
  }
}