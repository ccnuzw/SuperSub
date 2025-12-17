/**
 * 通知状态管理
 * 直接使用 Pinia 和 Vue 组合式 API
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * 通知类型
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * 通知位置
 */
export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

/**
 * 通知接口
 */
export interface INotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // 毫秒，0表示不自动关闭
  persistent?: boolean; // 是否持久化（页面刷新后仍然存在）
  closable?: boolean; // 是否可手动关闭
  position?: NotificationPosition;
  timestamp: string;
  read?: boolean;
}

/**
 * 通知状态接口
 */
interface INotificationState {
  notifications: INotification[];
  maxNotifications: number;
  defaultDuration: number;
  defaultPosition: NotificationPosition;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * 通知Store
 */
export const useNotificationStore = defineStore('notifications', () => {
  // 状态
  const notifications = ref<INotification[]>([]);
  const maxNotifications = ref<number>(50);
  const defaultDuration = ref<number>(4500);
  const defaultPosition = ref<NotificationPosition>('top-right');
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<string | null>(null);

  // 计算属性
  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  );
  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.read)
  );
  const readNotifications = computed(() =>
    notifications.value.filter(n => n.read)
  );
  const notificationsByType = computed(() => {
    const byType: Record<NotificationType, INotification[]> = {
      info: [],
      success: [],
      warning: [],
      error: []
    };

    notifications.value.forEach(notification => {
      byType[notification.type].push(notification);
    });

    return byType;
  });

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

  // 通知操作方法
  const addNotification = (notification: Omit<INotification, 'id' | 'timestamp'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: INotification = {
      ...notification,
      id,
      timestamp: new Date().toISOString(),
      closable: notification.closable !== false,
      read: false
    };

    // 添加到开头
    notifications.value.unshift(newNotification);

    // 限制最大数量
    if (notifications.value.length > maxNotifications.value) {
      notifications.value = notifications.value.slice(0, maxNotifications.value);
    }

    // 自动移除非持久化通知
    if (newNotification.duration && newNotification.duration > 0 && !newNotification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    updateLastUpdated();
    return id;
  };

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
      updateLastUpdated();
    }
  };

  const markAsRead = (id: string) => {
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      updateLastUpdated();
    }
  };

  const markAllAsRead = () => {
    notifications.value.forEach(n => {
      n.read = true;
    });
    updateLastUpdated();
  };

  const clearNotifications = () => {
    notifications.value = [];
    updateLastUpdated();
  };

  const clearReadNotifications = () => {
    notifications.value = notifications.value.filter(n => !n.read);
    updateLastUpdated();
  };

  // 便捷方法
  const showInfo = (title: string, message?: string, options: Partial<Omit<INotification, 'id' | 'timestamp' | 'type' | 'title' | 'message'>> = {}) => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration: defaultDuration.value,
      position: defaultPosition.value,
      ...options
    });
  };

  const showSuccess = (title: string, message?: string, options: Partial<Omit<INotification, 'id' | 'timestamp' | 'type' | 'title' | 'message'>> = {}) => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration: defaultDuration.value,
      position: defaultPosition.value,
      ...options
    });
  };

  const showWarning = (title: string, message?: string, options: Partial<Omit<INotification, 'id' | 'timestamp' | 'type' | 'title' | 'message'>> = {}) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: defaultDuration.value,
      position: defaultPosition.value,
      ...options
    });
  };

  const showError = (title: string, message?: string, options: Partial<Omit<INotification, 'id' | 'timestamp' | 'type' | 'title' | 'message'>> = {}) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 0, // 错误通知默认不自动关闭
      position: defaultPosition.value,
      ...options
    });
  };

  const reset = () => {
    notifications.value = [];
    loading.value = false;
    error.value = null;
    lastUpdated.value = null;
  };

  return {
    // 状态
    notifications: notifications as any,
    maxNotifications,
    defaultDuration,
    defaultPosition,
    loading,
    error,
    lastUpdated,

    // 计算属性
    unreadCount,
    unreadNotifications,
    readNotifications,
    notificationsByType,

    // 方法
    setLoading,
    setError,
    clearError,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearReadNotifications,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    reset
  };
});

export type NotificationStore = ReturnType<typeof useNotificationStore>;