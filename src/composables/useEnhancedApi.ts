/**
 * 增强版useApi组合式函数 - 阶段四：统一API层
 * 提供响应式状态管理、错误处理、加载状态等功能
 */

import { ref, computed, reactive, readonly, watch, type Ref } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import {
  apiClient,
  authService,
  subscriptionService,
  subscriptionGroupService,
  nodeService,
  profileService,
  statsService,
  systemService,
  importExportService,
  type ApiRequestConfig,
  type ApiResponse,
  type ApiError,
  type NetworkError,
  type AuthError
} from '@/utils/api';

// API状态接口
export interface ApiState {
  loading: boolean;
  error: ApiError | null;
  lastRequestTime: number;
}

// 请求选项
export interface UseApiOptions extends ApiRequestConfig {
  showMessage?: boolean;
  showErrorMessage?: boolean;
  successMessage?: string;
  onError?: (error: ApiError) => void;
  onSuccess?: (data: any) => void;
}

/**
 * 增强版useApi组合式函数
 */
export function useApi() {
  // Naive UI hooks
  const message = useMessage();
  const dialog = useDialog();

  // 全局API状态
  const globalState = reactive<ApiState>({
    loading: false,
    error: null,
    lastRequestTime: 0
  });

  // 请求计数器
  const requestCount = ref(0);

  // 计算属性
  const isLoading = computed(() => requestCount.value > 0);
  const globalLoading = computed(() => globalState.loading);
  const globalError = computed(() => globalState.error);

  /**
   * 更新全局状态
   */
  const updateGlobalState = (loading: boolean, error: ApiError | null = null) => {
    globalState.loading = loading;
    globalState.error = error;
    if (loading) {
      globalState.lastRequestTime = Date.now();
    }
  };

  /**
   * 通用请求包装器
   */
  const request = async <T = any>(
    apiCall: () => Promise<ApiResponse<T>>,
    options: UseApiOptions = {}
  ): Promise<ApiResponse<T> | null> => {
    const {
      showMessage = false,
      showErrorMessage = true,
      successMessage,
      onError,
      onSuccess
    } = options;

    try {
      requestCount.value++;
      updateGlobalState(true);

      const result = await apiCall();

      if (result.success) {
        if (showMessage && successMessage) {
          message.success(successMessage);
        }
        if (onSuccess) {
          onSuccess(result.data);
        }
      }

      return result;
    } catch (error: any) {
      const apiError = error as ApiError;

      updateGlobalState(false, apiError);

      // 显示错误消息
      if (showErrorMessage) {
        if (apiError instanceof AuthError) {
          message.warning(apiError.message);
        } else if (apiError instanceof NetworkError) {
          message.error('网络连接失败，请检查网络设置');
        } else {
          message.error(apiError.message || '请求失败');
        }
      }

      // 调用错误回调
      if (onError) {
        onError(apiError);
      }

      throw error;
    } finally {
      requestCount.value--;
      if (requestCount.value === 0) {
        updateGlobalState(false);
      }
    }
  };

  /**
   * 确认对话框包装器
   */
  const confirm = (options: {
    title: string;
    content: string;
    onConfirm: () => Promise<any>;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'error' | 'info';
  }) => {
    const {
      title,
      content,
      onConfirm,
      onCancel,
      confirmText = '确定',
      cancelText = '取消',
      type = 'warning'
    } = options;

    return new Promise<void>((resolve, reject) => {
      dialog[type]({
        title,
        content,
        positiveText: confirmText,
        negativeText: cancelText,
        onPositiveClick: async () => {
          try {
            await onConfirm();
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        onNegativeClick: () => {
          if (onCancel) {
            onCancel();
          }
          resolve();
        }
      });
    });
  };

  return {
    // 状态
    isLoading,
    globalLoading,
    globalError,
    globalState,

    // 核心 API 客户端
    apiClient,

    // 服务实例
    authService,
    subscriptionService,
    subscriptionGroupService,
    nodeService,
    profileService,
    statsService,
    systemService,
    importExportService,

    // 方法
    request,
    confirm,

    // 便捷方法
    get: <T>(endpoint: string, params?: any, options?: UseApiOptions) =>
      request(() => apiClient.get<T>(endpoint, params, options), options),

    post: <T>(endpoint: string, data?: any, options?: UseApiOptions) =>
      request(() => apiClient.post<T>(endpoint, data, options), options),

    put: <T>(endpoint: string, data?: any, options?: UseApiOptions) =>
      request(() => apiClient.put<T>(endpoint, data, options), options),

    patch: <T>(endpoint: string, data?: any, options?: UseApiOptions) =>
      request(() => apiClient.patch<T>(endpoint, data, options), options),

    delete: <T>(endpoint: string, options?: UseApiOptions) =>
      request(() => apiClient.delete<T>(endpoint, options), options),

    upload: <T>(endpoint: string, file: File, options?: UseApiOptions) =>
      request(() => apiClient.upload<T>(endpoint, file, options), options)
  };
}

/**
 * 创建专用的API状态管理
 */
export function createApiState<T = any>(initialData?: T) {
  const data = ref<T | undefined>(initialData);
  const loading = ref(false);
  const error = ref<ApiError | null>(null);

  const execute = async <R = T>(
    apiCall: () => Promise<ApiResponse<R>>,
    options: UseApiOptions = {}
  ): Promise<ApiResponse<R> | null> => {
    const { request } = useApi();

    loading.value = true;
    error.value = null;

    try {
      const result = await request(apiCall, options);

      if (result?.success) {
        data.value = result.data as unknown as T;
      }

      return result;
    } catch (err) {
      error.value = err as ApiError;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    data.value = initialData;
    loading.value = false;
    error.value = null;
  };

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    execute,
    reset
  };
}

/**
 * 分页数据管理
 */
export function usePaginatedApi<T = any>(
  apiCall: (params: any) => Promise<ApiResponse<T[]>>,
  initialParams: any = {}
) {
  const data = ref<T[]>([]);
  const loading = ref(false);
  const error = ref<ApiError | null>(null);

  // 分页参数
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0,
    itemCount: 0
  });

  // 过滤和排序参数
  const filters = reactive<Record<string, any>>({});
  const sorter = reactive<Record<string, any>>({});

  const { request } = useApi();

  const fetch = async (params?: any) => {
    const requestParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters,
      ...sorter,
      ...params
    };

    loading.value = true;
    error.value = null;

    try {
      const result = await request(() => apiCall(requestParams));

      if (result?.success) {
        data.value = result.data || [];
        // 假设API返回分页信息
        if (result.data && 'total' in result.data) {
          pagination.total = result.data.total;
        }
      }

      return result;
    } catch (err) {
      error.value = err as ApiError;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => fetch();
  const reset = () => {
    pagination.page = 1;
    Object.keys(filters).forEach(key => delete filters[key]);
    Object.keys(sorter).forEach(key => delete sorter[key]);
    data.value = [];
  };

  // 监听分页变化
  watch([() => pagination.page, () => pagination.pageSize], () => {
    fetch();
  });

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    filters,
    sorter,
    fetch,
    refresh,
    reset
  };
}

export default useApi;