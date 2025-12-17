/**
 * Profile相关组件索引文件
 * 统一导出所有Profile相关组件
 */

// 主要组件
export { default as ProfileForm } from './ProfileForm.vue';
export { default as ProfileBasicForm } from './ProfileBasicForm.vue';
export { default as ProfileDataSource } from './ProfileDataSource.vue';
export { default as ProfilePreview } from './ProfilePreview.vue';

// 业务组件库
// export { default as BusinessComponents } from './BusinessComponents';

// 类型定义
export type ProfileFormData = {
  id: string;
  name: string;
  alias: string;
  subscription_ids: string[];
  node_ids: string[];
  generation_mode: 'local' | 'remote';
  subconverter_backend_id: number | null;
  subconverter_config_id: number | null;
  airport_subscription_options: {
    strategy: 'all' | 'polling' | 'random';
    polling_mode: 'hourly' | 'request' | 'group_request';
    use_all: boolean;
    random: boolean;
    timeout: number;
    polling_threshold: number | null;
    polling_interval: number | null;
  };
  node_prefix_settings: {
    enable_subscription_prefix: boolean;
    manual_node_prefix: string;
    enable_group_name_prefix: boolean;
    manual_nodes_first: boolean;
  };
};

// 组件工具
export const profileComponents = {
  // 验证工具
  validateProfileName: (name: string): string | null => {
    if (!name.trim()) {
      return '配置名称不能为空';
    }
    if (name.length > 100) {
      return '配置名称不能超过100个字符';
    }
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/.test(name)) {
      return '配置名称只能包含中文、字母、数字、下划线和连字符';
    }
    return null;
  },

  validateAlias: (alias: string): string | null => {
    if (!alias) return null; // 别名可选
    if (alias.length > 50) {
      return '别名不能超过50个字符';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
      return '别名只能包含字母、数字、下划线和连字符';
    }
    return null;
  },

  validateGenerationMode: (mode: string): string | null => {
    if (!['local', 'remote'].includes(mode)) {
      return '生成模式必须是local或remote';
    }
    return null;
  },

  validateStrategy: (strategy: string): string | null => {
    if (!['all', 'polling', 'random'].includes(strategy)) {
      return '策略必须是all、polling或random';
    }
    return null;
  },

  validatePollingInterval: (interval: number | null): string | null => {
    if (interval !== null && (interval < 10 || interval > 3600)) {
      return '轮询间隔必须在10-3600秒之间';
    }
    return null;
  }
};

// 常量定义
export const PROFILE_CONSTANTS = {
  // 生成模式
  GENERATION_MODE: {
    LOCAL: 'local',
    REMOTE: 'remote'
  } as const,

  // 策略类型
  STRATEGY: {
    ALL: 'all',
    POLLING: 'polling',
    RANDOM: 'random'
  } as const,

  // 轮询模式
  POLLING_MODE: {
    HOURLY: 'hourly',
    REQUEST: 'request',
    GROUP_REQUEST: 'group_request'
  } as const,

  // 默认值
  DEFAULTS: {
    STRATEGY: 'all',
    POLLING_MODE: 'hourly',
    GENERATION_MODE: 'local',
    TIMEOUT: 10,
    POLLING_INTERVAL: 200,
    POLLING_THRESHOLD: 5
  } as const,

  // 验证规则
  VALIDATION: {
    NAME_MAX_LENGTH: 100,
    ALIAS_MAX_LENGTH: 50,
    POLLING_INTERVAL_MIN: 10,
    POLLING_INTERVAL_MAX: 3600,
    POLLING_THRESHOLD_MIN: 1,
    POLLING_THRESHOLD_MAX: 100
  } as const
};

// 工具函数
export const profileUtils = {
  /**
   * 生成配置文件URL
   */
  generateProfileUrl(alias: string, subToken: string): string {
    return `${window.location.origin}/api/public/${subToken}/${alias}`;
  },

  /**
   * 格式化轮询间隔
   */
  formatPollingInterval(interval: number): string {
    if (interval < 60) {
      return `${interval}秒`;
    } else if (interval < 3600) {
      return `${Math.floor(interval / 60)}分钟`;
    } else {
      return `${Math.floor(interval / 3600)}小时`;
    }
  },

  /**
   * 获取策略显示名称
   */
  getStrategyDisplayName(strategy: string): string {
    const names = {
      all: '使用全部',
      polling: '轮询模式',
      random: '随机选择'
    };
    return names[strategy as keyof typeof names] || strategy;
  },

  /**
   * 转换表单数据为API格式
   */
  transformFormToApi(formData: ProfileFormData): any {
    return {
      name: formData.name,
      alias: formData.alias,
      subscription_ids: formData.subscription_ids,
      node_ids: formData.node_ids,
      generation_mode: formData.generation_mode,
      subconverter_backend_id: formData.subconverter_backend_id,
      subconverter_config_id: formData.subconverter_config_id,
      airport_subscription_options: {
        ...formData.airport_subscription_options,
        use_all: formData.airport_subscription_options.strategy === 'all'
      },
      node_prefix_settings: formData.node_prefix_settings
    };
  },

  /**
   * 转换API数据为表单格式
   */
  transformApiToForm(apiData: any): ProfileFormData {
    return {
      id: apiData.id || '',
      name: apiData.name || '',
      alias: apiData.alias || '',
      subscription_ids: apiData.subscription_ids || [],
      node_ids: apiData.node_ids || [],
      generation_mode: apiData.generation_mode || 'local',
      subconverter_backend_id: apiData.subconverter_backend_id || null,
      subconverter_config_id: apiData.subconverter_config_id || null,
      airport_subscription_options: {
        strategy: apiData.airport_subscription_options?.use_all ? 'all' :
                apiData.airport_subscription_options?.strategy || 'all',
        polling_mode: apiData.airport_subscription_options?.polling_mode || 'hourly',
        use_all: apiData.airport_subscription_options?.use_all !== false,
        random: apiData.airport_subscription_options?.random || false,
        timeout: apiData.airport_subscription_options?.timeout || 10,
        polling_threshold: apiData.airport_subscription_options?.polling_threshold || null,
        polling_interval: apiData.airport_subscription_options?.polling_interval || null
      },
      node_prefix_settings: apiData.node_prefix_settings || {
        enable_subscription_prefix: false,
        manual_node_prefix: '',
        enable_group_name_prefix: false,
        manual_nodes_first: false
      }
    };
  },

  /**
   * 检查配置是否完整
   */
  isConfigComplete(formData: ProfileFormData): boolean {
    return !!(formData.name &&
      (formData.subscription_ids.length > 0 || formData.node_ids.length > 0));
  },

  /**
   * 检查远程生成配置是否完整
   */
  isRemoteConfigComplete(formData: ProfileFormData): boolean {
    return formData.generation_mode === 'remote' &&
           !!formData.subconverter_backend_id &&
           !!formData.subconverter_config_id;
  }
};

// 默认导出
export default {
  profileComponents,
  profileUtils,
  PROFILE_CONSTANTS
};