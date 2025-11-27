import { ref, computed } from 'vue';
import type {
  ApiResponse,
  CrudResult,
  PaginationParams,
  PaginatedResponse
} from '@/types/common';
import type { RequestOptions } from '@/types/api';
import { api } from '@/utils/api/ApiClient';
import { handleApiError, logError } from '@/utils/api/errorHandler';

/**
 * 简化的基础Store类，提供通用的CRUD操作
 * 避免复杂的泛型类型问题
 */
export abstract class SimpleBaseStore {
  // 响应式状态
  public items = ref<any[]>([]);
  public loading = ref(false);
  public error = ref<string | null>(null);
  public pagination = ref<PaginationParams & { total: number }>({
    page: 1,
    pageSize: 20,
    total: 0
  });

  // 抽象属性，由子类实现
  abstract endpoint: string;
  abstract maxItems: number;

  // 计算属性
  public get isEmpty(): boolean {
    return this.items.value.length === 0;
  }

  public get hasError(): boolean {
    return !!this.error.value;
  }

  public get isFull(): boolean {
    return this.items.value.length >= this.maxItems;
  }

  public get totalPages(): number {
    return Math.ceil(this.pagination.value.total / this.pagination.value.pageSize);
  }

  /**
   * 获取所有项目（带分页）
   */
  public async fetchItems(params?: Record<string, any>): Promise<ApiResponse<any[]>> {
    this.loading.value = true;
    this.error.value = null;

    try {
      const queryParams = {
        page: this.pagination.value.page,
        pageSize: this.pagination.value.pageSize,
        ...params
      };

      const response = await api.get<any[]>(this.endpoint, queryParams);

      if (response.success && response.data) {
        this.items.value = response.data;

        // 如果响应包含分页信息，更新分页状态
        if ('pagination' in response) {
          const paginatedResponse = response as PaginatedResponse<any>;
          this.pagination.value.total = paginatedResponse.pagination.total;
          this.pagination.value.page = paginatedResponse.pagination.page;
          this.pagination.value.pageSize = paginatedResponse.pagination.pageSize;
        }
      }

      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      this.error.value = errorMessage;
      logError(error, `SimpleBaseStore.fetchItems - ${this.endpoint}`);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      };
    } finally {
      this.loading.value = false;
    }
  }

  /**
   * 获取单个项目
   */
  public async fetchItem(id: string): Promise<ApiResponse<any>> {
    this.loading.value = true;
    this.error.value = null;

    try {
      const response = await api.get<any>(`${this.endpoint}/${id}`);
      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      this.error.value = errorMessage;
      logError(error, `SimpleBaseStore.fetchItem - ${this.endpoint}/${id}`);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      };
    } finally {
      this.loading.value = false;
    }
  }

  /**
   * 创建项目
   */
  public async addItem(item: any): Promise<CrudResult<any>> {
    if (this.isFull) {
      return {
        success: false,
        message: `最多只能创建${this.maxItems}个项目`
      };
    }

    this.loading.value = true;
    this.error.value = null;

    try {
      const response = await api.post<any>(this.endpoint, item);

      if (response.success && response.data) {
        // 添加到本地状态
        this.items.value.push(response.data);

        // 更新总数
        this.pagination.value.total++;
      }

      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      this.error.value = errorMessage;
      logError(error, `SimpleBaseStore.addItem - ${this.endpoint}`);

      return {
        success: false,
        message: errorMessage
      };
    } finally {
      this.loading.value = false;
    }
  }

  /**
   * 更新项目
   */
  public async updateItem(id: string, updates: any): Promise<CrudResult<any>> {
    this.loading.value = true;
    this.error.value = null;

    try {
      const response = await api.put<any>(`${this.endpoint}/${id}`, updates);

      if (response.success && response.data) {
        // 更新本地状态
        const index = this.items.value.findIndex(item => item.id === id);
        if (index !== -1) {
          this.items.value[index] = response.data;
        }
      }

      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      this.error.value = errorMessage;
      logError(error, `SimpleBaseStore.updateItem - ${this.endpoint}/${id}`);

      return {
        success: false,
        message: errorMessage
      };
    } finally {
      this.loading.value = false;
    }
  }

  /**
   * 删除项目
   */
  public async deleteItem(id: string): Promise<CrudResult> {
    this.loading.value = true;
    this.error.value = null;

    try {
      const response = await api.delete(`${this.endpoint}/${id}`);

      if (response.success) {
        // 从本地状态中移除
        this.items.value = this.items.value.filter(item => item.id !== id);

        // 更新总数
        this.pagination.value.total = Math.max(0, this.pagination.value.total - 1);
      }

      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      this.error.value = errorMessage;
      logError(error, `SimpleBaseStore.deleteItem - ${this.endpoint}/${id}`);

      return {
        success: false,
        message: errorMessage
      };
    } finally {
      this.loading.value = false;
    }
  }

  /**
   * 批量操作
   */
  public async bulkOperation(
    ids: string[],
    action: string,
    data?: any
  ): Promise<CrudResult> {
    this.loading.value = true;
    this.error.value = null;

    try {
      const response = await api.post(`${this.endpoint}/bulk`, {
        ids,
        action,
        data
      });

      if (response.success) {
        // 刷新列表
        await this.fetchItems();
      }

      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      this.error.value = errorMessage;
      logError(error, `SimpleBaseStore.bulkOperation - ${this.endpoint}`);

      return {
        success: false,
        message: errorMessage
      };
    } finally {
      this.loading.value = false;
    }
  }

  /**
   * 设置分页
   */
  public setPagination(page: number, pageSize?: number): void {
    this.pagination.value.page = page;
    if (pageSize) {
      this.pagination.value.pageSize = pageSize;
    }
  }

  /**
   * 清空错误
   */
  public clearError(): void {
    this.error.value = null;
  }

  /**
   * 重置状态
   */
  public reset(): void {
    this.items.value = [];
    this.loading.value = false;
    this.error.value = null;
    this.pagination.value = {
      page: 1,
      pageSize: 20,
      total: 0
    };
  }

  /**
   * 根据ID查找项目
   */
  public findById(id: string): any {
    return this.items.value.find(item => item.id === id);
  }

  /**
   * 获取选中的项目
   */
  public getSelectedItems(selectedIds: string[]): any[] {
    return this.items.value.filter(item => selectedIds.includes(item.id));
  }
}

/**
 * 创建基础Store的工厂函数
 */
export function createSimpleStore(
  endpoint: string,
  maxItems = 50,
  defaultPageSize = 20
) {
  return new (class extends SimpleBaseStore {
    public endpoint = endpoint;
    public maxItems = maxItems;

    constructor() {
      super();
      // 设置默认分页
      this.pagination.value.pageSize = defaultPageSize;
    }
  })();
}