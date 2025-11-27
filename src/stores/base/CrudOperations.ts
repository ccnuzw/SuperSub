import { ref } from 'vue';
import type { BaseEntity } from '@/types/common';
import type { GroupItem } from '@/types/common';
import type { CrudResult } from '@/types/common';
import type { ApiResponse } from '@/types/common';
import { BaseStore } from './BaseStore';
import { api } from '@/utils/api/ApiClient';
import { handleApiError, logError } from '@/utils/api/errorHandler';

/**
 * 创建基础Store的工厂函数
 */
export function createBaseStore<T extends BaseEntity>(
  endpoint: string,
  maxItems = 50,
  defaultPageSize = 20
) {
  return new (class extends BaseStore<T> {
    public endpoint = endpoint;
    public maxItems = maxItems;

    constructor() {
      super();
      // 设置默认分页
      this.pagination.value.pageSize = defaultPageSize;
    }
  })();
}

/**
 * 带分组功能的Store基类
 */
export abstract class GroupedBaseStore<T extends BaseEntity> extends BaseStore<T> {
  // 分组相关状态
  public groups = ref<T[]>([]);
  public groupsLoading = ref(false);
  public groupsError = ref<string | null>(null);

  // 抽象属性
  abstract groupsEndpoint: string;

  /**
   * 获取所有分组
   */
  public async fetchGroups(): Promise<ApiResponse<T[]>> {
    this.groupsLoading.value = true;
    this.groupsError.value = null;

    try {
      const response = await api.get<T[]>(this.groupsEndpoint);

      if (response.success && response.data) {
        this.groups.value = response.data;
      }

      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      this.groupsError.value = errorMessage;
      logError(error, `GroupedBaseStore.fetchGroups - ${this.groupsEndpoint}`);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      };
    } finally {
      this.groupsLoading.value = false;
    }
  }

  /**
   * 创建分组
   */
  public async addGroup(name: string, description?: string): Promise<CrudResult<T>> {
    if (this.groups.value.length >= 10) {
      return {
        success: false,
        message: '最多只能创建10个分组'
      };
    }

    this.groupsLoading.value = true;
    this.groupsError.value = null;

    try {
      const response = await api.post<T>(this.groupsEndpoint, {
        name,
        description
      });

      if (response.success && response.data) {
        this.groups.value.push(response.data as T);
      }

      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      this.groupsError.value = errorMessage;
      logError(error, `GroupedBaseStore.addGroup - ${this.groupsEndpoint}`);

      return {
        success: false,
        message: errorMessage
      };
    } finally {
      this.groupsLoading.value = false;
    }
  }

  /**
   * 更新分组
   */
  public async updateGroup(id: string, updates: Partial<T>): Promise<CrudResult<T>> {
    this.groupsLoading.value = true;
    this.groupsError.value = null;

    try {
      const response = await api.put<T>(`${this.groupsEndpoint}/${id}`, updates);

      if (response.success && response.data) {
        const index = this.groups.value.findIndex(group => group.id === id);
        if (index !== -1) {
          this.groups.value[index] = response.data as T;
        }
      }

      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      this.groupsError.value = errorMessage;
      logError(error, `GroupedBaseStore.updateGroup - ${this.groupsEndpoint}/${id}`);

      return {
        success: false,
        message: errorMessage
      };
    } finally {
      this.groupsLoading.value = false;
    }
  }

  /**
   * 删除分组
   */
  public async deleteGroup(id: string): Promise<CrudResult> {
    this.groupsLoading.value = true;
    this.groupsError.value = null;

    try {
      const response = await api.delete(`${this.groupsEndpoint}/${id}`);

      if (response.success) {
        this.groups.value = this.groups.value.filter(group => group.id !== id);
      }

      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      this.groupsError.value = errorMessage;
      logError(error, `GroupedBaseStore.deleteGroup - ${this.groupsEndpoint}/${id}`);

      return {
        success: false,
        message: errorMessage
      };
    } finally {
      this.groupsLoading.value = false;
    }
  }

  /**
   * 根据分组ID获取项目
   */
  public getItemsByGroupId(groupId: string): T[] {
    return this.items.value.filter(item =>
      (item as any).group_id === groupId
    ) as T[];
  }

  /**
   * 获取分组名称
   */
  public getGroupName(groupId: string): string {
    const group = this.groups.value.find(g => g.id === groupId);
    return (group as any)?.name || '未分组';
  }

  /**
   * 重置分组相关状态
   */
  public resetGroups(): void {
    this.groups.value = [];
    this.groupsLoading.value = false;
    this.groupsError.value = null;
  }

  /**
   * 重置所有状态（包括分组）
   */
  public reset(): void {
    super.reset();
    this.resetGroups();
  }
}