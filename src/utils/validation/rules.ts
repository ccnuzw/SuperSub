import type { ValidationRule } from '@/types/common';

/**
 * 通用验证规则
 */
export const commonRules = {
  // 必填验证
  required: (message = '此字段为必填项'): ValidationRule => ({
    required: true,
    message
  }),

  // 字符串长度验证
  minLength: (min: number, message?: string): ValidationRule => ({
    min,
    message: message || `最少需要 ${min} 个字符`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    max,
    message: message || `最多只能输入 ${max} 个字符`
  }),

  rangeLength: (min: number, max: number, message?: string): ValidationRule => ({
    min,
    max,
    message: message || `长度需要在 ${min} 到 ${max} 之间`
  }),

  // 数值验证
  min: (min: number, message?: string): ValidationRule => ({
    min,
    message: message || `最小值为 ${min}`
  }),

  max: (max: number, message?: string): ValidationRule => ({
    max,
    message: message || `最大值为 ${max}`
  }),

  // 正则表达式验证
  pattern: (pattern: RegExp, message: string): ValidationRule => ({
    pattern,
    message
  }),

  // 自定义验证器
  custom: (validator: (value: any) => boolean | string, message: string): ValidationRule => ({
    validator,
    message
  })
};

/**
 * 字段专用验证规则
 */
export const fieldRules = {
  // 用户名验证
  username: [
    commonRules.required('请输入用户名'),
    commonRules.minLength(3, '用户名至少3个字符'),
    commonRules.maxLength(20, '用户名最多20个字符'),
    commonRules.pattern(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线')
  ],

  // 密码验证
  password: [
    commonRules.required('请输入密码'),
    commonRules.minLength(6, '密码至少6个��符'),
    commonRules.maxLength(100, '密码最多100个字符')
  ],

  // 邮箱验证
  email: [
    commonRules.required('请输入邮箱'),
    commonRules.pattern(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      '请输入有效的邮箱地址'
    )
  ],

  // URL验证
  url: [
    commonRules.required('请输入URL'),
    commonRules.custom((value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return '请输入有效的URL地址';
      }
    }, '请输入有效的URL地址')
  ],

  // 名称验证
  name: [
    commonRules.required('请输入名称'),
    commonRules.minLength(1, '名称不能为空'),
    commonRules.maxLength(100, '名称最多100个字符')
  ],

  // 描述验证
  description: [
    commonRules.maxLength(500, '描述最多500个字符')
  ],

  // 端口号验证
  port: [
    commonRules.custom((value: number) => {
      if (!value || value < 1 || value > 65535) {
        return '端口号必须在1-65535之间';
      }
      return true;
    }, '端口号必须在1-65535之间')
  ],

  // IP地址验证
  ipAddress: [
    commonRules.custom((value: string) => {
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

      if (!ipv4Regex.test(value) && !ipv6Regex.test(value)) {
        return '请输入有效的IP地址';
      }
      return true;
    }, '请输入有效的IP地址')
  ]
};

/**
 * 验证器函数
 */
export const validators = {
  // 验证URL
  isValidUrl: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  // 验证JSON字符串
  isValidJson: (value: string): boolean => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },

  // 验证正整数
  isPositiveInteger: (value: number): boolean => {
    return Number.isInteger(value) && value > 0;
  },

  // 验证是否为空
  isEmpty: (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },

  // 验证用户名格式
  isValidUsername: (username: string): boolean => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  },

  // 验证密码强度
  isStrongPassword: (password: string): boolean => {
    // 至少8个字符，包含大小写字母和数字
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(password);
  },

  // 验证节点协议
  isValidProtocol: (protocol: string): boolean => {
    const validProtocols = [
      'vmess', 'vless', 'trojan', 'shadowsocks', 'hysteria',
      'hysteria2', 'tuic', 'wireguard', 'brook'
    ];
    return validProtocols.includes(protocol);
  },

  // 验证分组名称唯一性
  isUniqueGroupName: (name: string, existingGroups: string[], currentId?: string): boolean => {
    const filteredGroups = currentId
      ? existingGroups.filter(id => id !== currentId)
      : existingGroups;
    return !filteredGroups.includes(name);
  }
};

/**
 * 表单验证工具函数
 */
export const validateForm = async (
  formData: Record<string, any>,
  rules: Record<string, ValidationRule[]>
): Promise<{ valid: boolean; errors: Record<string, string> }> => {
  const errors: Record<string, string> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = formData[field];

    for (const rule of fieldRules) {
      // 必填验证
      if (rule.required && validators.isEmpty(value)) {
        errors[field] = rule.message;
        break;
      }

      // 如果值为空且不是必填，跳过其他验证
      if (validators.isEmpty(value) && !rule.required) {
        continue;
      }

      // 长度验证
      if (rule.min !== undefined && String(value).length < rule.min) {
        errors[field] = rule.message;
        break;
      }

      if (rule.max !== undefined && String(value).length > rule.max) {
        errors[field] = rule.message;
        break;
      }

      // 正则表达式验证
      if (rule.pattern && !rule.pattern.test(String(value))) {
        errors[field] = rule.message;
        break;
      }

      // 自定义验证器
      if (rule.validator) {
        const result = rule.validator(value);
        if (result !== true) {
          errors[field] = typeof result === 'string' ? result : rule.message;
          break;
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * 创建动态验证规则
 */
export const createDynamicRule = (
  validator: (value: any, formData: Record<string, any>) => boolean | string,
  message: string,
  dependsOn?: string[]
): ValidationRule => ({
  validator: (value: any) => {
    // 这里需要传入完整的表单数据，简化版本只传入当前值
    // 在实际使用时，需要在调用验证器时传入完整表单数据
    return validator(value, {}); // 这里的空对象应该被替换为实际的表单数据
  },
  message
});