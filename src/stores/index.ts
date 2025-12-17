/**
 * Store模块索引文件
 * 统一导出所有Store模块
 */

// 导出Store基类
export { default as StoreBase, AsyncStoreBase, type IStoreState, type IStoreConfig } from './base/StoreBase';

// 导入基类用于默认导出
import StoreBase from './base/StoreBase';

// 导入具体Store模块用于默认导出
import { useAuthStore } from './auth';
import { useGroupStore } from './groups';
import { useSubscriptionGroupStore } from './subscriptionGroups';
import { useNodeStatusStore } from './nodeStatus';
import { useThemeStore } from './theme';
import { useNotificationStore } from './notifications';
import { useSettingsStore } from './settings';

// 导出具体Store模块
export { useAuthStore } from './auth';
export { useGroupStore, type GroupStore } from './groups';
export { useSubscriptionGroupStore, type SubscriptionGroupStore } from './subscriptionGroups';
export { useNodeStatusStore, type NodeStatusStore } from './nodeStatus';
export { useThemeStore, type ThemeStore, type Theme, type ThemeMode } from './theme';
export { useNotificationStore, type NotificationStore, type NotificationType, type NotificationPosition } from './notifications';
export { useSettingsStore } from './settings';

// Store类型定义
export type {
  ILoginCredentials,
  IRegisterCredentials
} from './auth';

// Store工具函数
export const storeUtils = {
  /**
   * 创建标准的Store状态
   */
  createStandardState<T>(initialData: T = {} as T) {
    return {
      ...initialData,
      loading: false,
      error: null,
      lastUpdated: null
    };
  },

  /**
   * 验证Store配置
   */
  validateConfig(config: any) {
    const requiredFields = ['persist', 'persistKey', 'enableErrorHandler'];
    return requiredFields.every(field => field in config);
  },

  /**
   * 生成Store的persist键名
   */
  generatePersistKey(storeName: string, userId?: string) {
    const baseKey = `supersub-${storeName}`;
    return userId ? `${baseKey}-${userId}` : baseKey;
  },

  /**
   * 清理所有Store数据
   */
  clearAllStores() {
    const keys = Object.keys(localStorage);
    const supersubKeys = keys.filter(key => key.startsWith('supersub-'));

    supersubKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key} from localStorage:`, error);
      }
    });
  },

  /**
   * 获取所有Store状态信息
   */
  getAllStoreInfo() {
    const keys = Object.keys(localStorage);
    const storeKeys = keys.filter(key => key.startsWith('supersub-'));

    const info: Record<string, any> = {};

    storeKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          info[key] = {
            size: data.length,
            timestamp: JSON.parse(data).lastUpdated,
            data: JSON.parse(data)
          };
        }
      } catch (error) {
        info[key] = {
          error: 'Failed to parse store data',
          size: 0
        };
      }
    });

    return info;
  },

  /**
   * 重置所有Store到初始状态
   */
  resetAllStores() {
    // 这里需要在应用中调用各个store的$reset方法
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('supersub-stores-reset'));
    }
  },

  /**
   * 获取Store健康状态
   */
  getStoreHealth() {
    const storeInfo = this.getAllStoreInfo();
    const health = {
      totalStores: Object.keys(storeInfo).length,
      healthyStores: 0,
      corruptedStores: 0,
      totalSize: 0,
      stores: {} as Record<string, any>
    };

    Object.entries(storeInfo).forEach(([key, info]) => {
      health.totalSize += info.size || 0;

      if (info.error) {
        health.corruptedStores++;
        health.stores[key] = { status: 'corrupted', error: info.error };
      } else {
        health.healthyStores++;
        health.stores[key] = { status: 'healthy', size: info.size };
      }
    });

    return health;
  }
};

// Store插件
export const StorePlugin = {
  /**
   * 安装Store插件到Vue应用
   */
  install(app: any) {
    // 提供Store工具函数
    app.provide('storeUtils', storeUtils);

    // 全局属性
    app.config.globalProperties.$storeUtils = storeUtils;

    // 错误处理
    if (typeof window !== 'undefined') {
      // 监听存储事件（多标签页同步）
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('supersub-')) {
          // 触发Store刷新
          window.dispatchEvent(new CustomEvent('supersub-store-update', {
            detail: {
              key: event.key,
              newValue: event.newValue,
              oldValue: event.oldValue
            }
          }));
        }
      });

      // 监听Store重置事件
      window.addEventListener('supersub-stores-reset', () => {
        console.info('All stores have been reset');
      });
    }
  }
};

// 默认导出
export default {
  StoreBase,
  useAuthStore,
  useGroupStore,
  useSubscriptionGroupStore,
  useNodeStatusStore,
  useThemeStore,
  useNotificationStore,
  useSettingsStore,
  storeUtils,
  StorePlugin
};