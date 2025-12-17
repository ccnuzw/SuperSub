/**
 * @fileoverview Composable for unified notification handling
 * Provides centralized notification management with consistent messaging
 */

import { ref, Ref, VNodeChild } from 'vue';
import { useMessage, useDialog, useNotification, type MessageReactive, type NotificationReactive } from 'naive-ui';

/**
 * Notification types
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Message configuration
 */
export interface MessageConfig {
  type: NotificationType;
  content: string;
  duration?: number;
  closable?: boolean;
  keepAliveOnHover?: boolean;
}

/**
 * Dialog configuration
 */
export interface DialogConfig {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  content: string;
  positiveText?: string;
  negativeText?: string;
  showIcon?: boolean;
  onPositiveClick?: () => void | Promise<void>;
  onNegativeClick?: () => void | Promise<void>;
}

/**
 * Notification configuration
 */
export interface NotificationConfig {
  title: string;
  content?: string;
  type?: NotificationType;
  duration?: number;
  closable?: boolean;
  keepAliveOnHover?: boolean;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Message templates
 */
export const MESSAGE_TEMPLATES = {
  // Success messages
  CREATE_SUCCESS: (item: string) => `${item}创建成功`,
  UPDATE_SUCCESS: (item: string) => `${item}更新成功`,
  DELETE_SUCCESS: (item: string) => `${item}删除成功`,
  COPY_SUCCESS: (item: string) => `${item}已复制到剪贴板`,
  SAVE_SUCCESS: (item: string) => `${item}保存成功`,
  UPLOAD_SUCCESS: (item: string) => `${item}上传成功`,
  IMPORT_SUCCESS: (item: string) => `${item}导入成功`,
  EXPORT_SUCCESS: (item: string) => `${item}导出成功`,

  // Error messages
  CREATE_FAILED: (item: string) => `${item}创建失败`,
  UPDATE_FAILED: (item: string) => `${item}更新失败`,
  DELETE_FAILED: (item: string) => `${item}删除失败`,
  SAVE_FAILED: (item: string) => `${item}保存失败`,
  UPLOAD_FAILED: (item: string) => `${item}上传失败`,
  DOWNLOAD_FAILED: (item: string) => `${item}下载失败`,
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  SERVER_ERROR: '服务器错误，请稍后重试',
  PERMISSION_DENIED: '权限不足，无法执行此操作',
  INVALID_INPUT: '输入数据无效，请检查后重试',

  // Warning messages
  DELETE_WARNING: (item: string) => `确定要删除${item}吗？此操作不可撤销`,
  UNSAVED_CHANGES: '存在未保存的更改，确定要离开吗？',
  OPERATION_WARNING: (operation: string) => `执行${operation}可能会影响现有数据`,

  // Info messages
  LOADING: '正在加载...',
  PROCESSING: '正在处理...',
  NO_DATA: '暂无数据',
  OPERATION_SUCCESS: '操作完成',
};

/**
 * Composable for unified notification handling
 *
 * Provides a centralized interface for all user notifications:
 * - Toast messages (success, error, warning, info)
 * - Dialog confirmations
 * - Persistent notifications
 * - Batch operation results
 * - Template-based messages
 *
 * @example
 * ```typescript
 * const { success, error, warning, info, confirm, notify } = useNotifications();
 *
 * // Simple success message
 * success('操作成功');
 *
 * // Template-based message
 * success(MESSAGE_TEMPLATES.CREATE_SUCCESS('用户'));
 *
 * // Confirmation dialog
 * await confirm('确定删除？', '此操作不可撤销');
 *
 * // Batch operation result
 * showBatchResult({
 *   total: 10,
 *   success: 8,
 *   failed: 2,
 *   errors: ['Item 5 failed', 'Item 7 failed']
 * });
 * ```
 */
export function useNotifications() {
  const message = useMessage();
  const dialog = useDialog();
  const notification = useNotification();

  // State for tracking notifications
  const notifications = ref<Array<{ id: string; config: NotificationConfig }>>([]);
  const isLoading = ref(false);

  /**
   * Show success message
   */
  const success = (content: string, options: Partial<MessageConfig> = {}): void => {
    message.success(content, {
      duration: 3000,
      ...options,
    });
  };

  /**
   * Show error message
   */
  const error = (content: string, options: Partial<MessageConfig> = {}): void => {
    message.error(content, {
      duration: 5000,
      closable: true,
      ...options,
    });
  };

  /**
   * Show warning message
   */
  const warning = (content: string, options: Partial<MessageConfig> = {}): void => {
    message.warning(content, {
      duration: 4000,
      closable: true,
      ...options,
    });
  };

  /**
   * Show info message
   */
  const info = (content: string, options: Partial<MessageConfig> = {}): void => {
    message.info(content, {
      duration: 3000,
      ...options,
    });
  };

  /**
   * Show loading message
   */
  const loading = (content: string = '正在处理...'): void => {
    isLoading.value = true;
    message.loading(content, {
      duration: 0, // No auto dismiss
    });
  };

  /**
   * Hide all messages
   */
  const destroyAll = (): void => {
    isLoading.value = false;
    message.destroyAll();
  };

  /**
   * Show confirmation dialog
   */
  const confirm = (title: string, content: string, options: Partial<DialogConfig> = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      dialog.warning({
        title,
        content,
        positiveText: '确定',
        negativeText: '取消',
        showIcon: true,
        onPositiveClick: () => {
          resolve(true);
          options.onPositiveClick?.();
        },
        onNegativeClick: () => {
          resolve(false);
          options.onNegativeClick?.();
        },
        ...options,
      });
    });
  };

  /**
   * Show info dialog
   */
  const alertDialog = (title: string, content: string, options: Partial<DialogConfig> = {}): Promise<void> => {
    return new Promise((resolve) => {
      dialog.info({
        title,
        content,
        positiveText: '确定',
        showIcon: true,
        onPositiveClick: () => {
          resolve();
          options.onPositiveClick?.();
        },
        ...options,
      });
    });
  };

  /**
   * Show persistent notification
   */
  const notify = (config: NotificationConfig): { id: string; destroy: () => void } => {
    const id = Date.now().toString();
    const instance = notification.create({
      title: config.title,
      content: config.content,
      type: config.type || 'info',
      duration: config.duration || 4000,
      closable: config.closable !== false,
      keepAliveOnHover: config.keepAliveOnHover !== false,
    });

    const notificationObj = { id, config };
    notifications.value.push(notificationObj);

    const destroy = () => {
      instance.destroy();
      const index = notifications.value.findIndex(n => n.id === id);
      if (index > -1) {
        notifications.value.splice(index, 1);
      }
    };

    return { id, destroy };
  };

  /**
   * Show API error with automatic formatting
   */
  const apiError = (apiErr: unknown, defaultMessage: string = '操作失败'): void => {
    let messageText = defaultMessage;

    if (apiErr && typeof apiErr === 'object') {
      if ('message' in apiErr && typeof apiErr.message === 'string') {
        messageText = apiErr.message;
      } else if ('response' in apiErr && apiErr.response && typeof apiErr.response === 'object') {
        const response = apiErr.response as any;
        if (response.data?.message) {
          messageText = response.data.message;
        } else if (response.statusText) {
          messageText = response.statusText;
        }
      }
    }

    error(messageText);
  };

  /**
   * Show batch operation result
   */
  const showBatchResult = (
    result: BatchOperationResult,
    operation: string = '批量操作'
  ): void => {
    const { total, success: successCount, failed, errors } = result;

    if (failed === 0) {
      success(`${operation}完成，成功处理 ${successCount} 项`);
    } else if (successCount === 0) {
      error(`${operation}失败，所有 ${failed} 项处理失败`);
    } else {
      warning(`${operation}部分完成，成功 ${successCount} 项，失败 ${failed} 项`);

      // Show error details if there are specific errors
      if (errors.length > 0 && errors.length <= 5) {
        errors.forEach(err => error(err));
      } else if (errors.length > 5) {
        notify({
          title: '详细错误信息',
          content: errors.slice(0, 5).join('\n') + `\n...还有 ${errors.length - 5} 个错误`,
          type: 'error',
          duration: 8000,
        });
      }
    }
  };

  /**
   * Show operation result with automatic success/error handling
   */
  const showOperationResult = (
    isSuccessful: boolean,
    operation: string,
    data?: unknown
  ): void => {
    if (isSuccessful) {
      success(`${operation}成功`);
    } else {
      error(`${operation}失败`);
    }
  };

  /**
   * Show progress notification for long-running operations
   */
  const showProgress = (
    title: string,
    current: number,
    total: number
  ): { id: string; update: (current: number, total: number) => void; destroy: () => void } => {
    const percentage = Math.round((current / total) * 100);

    const { id, destroy } = notify({
      title,
      content: `进度: ${current}/${total} (${percentage}%)`,
      type: 'info',
      duration: 0, // No auto dismiss
      closable: false,
    });

    const update = (newCurrent: number, newTotal: number) => {
      const newPercentage = Math.round((newCurrent / newTotal) * 100);
      // Update notification content if possible (would need to track instance)
    };

    return { id, update, destroy };
  };

  /**
   * Handle form validation errors
   */
  const showValidationErrors = (errors: Record<string, string[]>): void => {
    const errorMessages = Object.entries(errors)
      .flatMap(([field, messages]) => messages.map(msg => `${field}: ${msg}`))
      .slice(0, 5); // Limit to first 5 errors

    if (errorMessages.length === 1) {
      error(errorMessages[0]);
    } else {
      notify({
        title: '表单验证失败',
        content: errorMessages.join('\n'),
        type: 'error',
        duration: 6000,
      });
    }
  };

  /**
   * Clear all notifications
   */
  const clearNotifications = (): void => {
    notifications.value = [];
    notification.destroyAll();
  };

  return {
    // State
    notifications: notifications as Readonly<Ref<Array<{ id: string; config: NotificationConfig }>>>,
    isLoading: isLoading as Readonly<Ref<boolean>>,

    // Message methods
    success,
    error,
    warning,
    info,
    loading,
    destroyAll,

    // Dialog methods
    confirm,
    alertDialog,

    // Notification methods
    notify,
    clearNotifications,

    // Specialized methods
    apiError,
    showBatchResult,
    showOperationResult,
    showProgress,
    showValidationErrors,

    // Templates
    templates: MESSAGE_TEMPLATES,
  };
}

/**
 * Default export
 */
export default useNotifications;