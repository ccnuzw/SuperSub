/**
 * 基础组件库索引文件
 * 统一导出所有基础组件
 */

// 按钮相关组件
import SsButton from './SsButton.vue';

// 输入框相关组件
import SsInput from './SsInput.vue';

// 卡片相关组件
import SsCard from './SsCard.vue';

// 状态指示组件
import SsStatus from './SsStatus.vue';

// 徽章组件
import SsBadge from './SsBadge.vue';

// 重新导出组件
export { default as SsButton } from './SsButton.vue';
export { default as SsInput } from './SsInput.vue';
export { default as SsCard } from './SsCard.vue';
export { default as SsStatus } from './SsStatus.vue';
export { default as SsBadge } from './SsBadge.vue';

// 组件类型定义
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type ButtonShape = 'rounded' | 'square' | 'pill';

export type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';
export type InputSize = 'sm' | 'md' | 'lg';

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled';
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';
export type CardShadow = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type CardRounded = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type CardBackground = 'default' | 'muted' | 'primary' | 'success' | 'warning' | 'error';

// 组件常量
export const COMPONENT_PRESET = {
  // 按钮预设
  button: {
    primary: {
      variant: 'primary' as ButtonVariant,
      size: 'md' as ButtonSize
    },
    secondary: {
      variant: 'secondary' as ButtonVariant,
      size: 'md' as ButtonSize
    },
    danger: {
      variant: 'danger' as ButtonVariant,
      size: 'md' as ButtonSize
    },
    success: {
      variant: 'success' as ButtonVariant,
      size: 'md' as ButtonSize
    }
  },

  // 输入框预设
  input: {
    default: {
      size: 'md' as InputSize,
      type: 'text' as InputType
    },
    search: {
      size: 'md' as InputSize,
      type: 'search' as InputType
    },
    password: {
      size: 'md' as InputSize,
      type: 'password' as InputType
    }
  },

  // 卡片预设
  card: {
    default: {
      variant: 'default' as CardVariant,
      size: 'md' as CardSize,
      shadow: 'md' as CardShadow,
      rounded: 'lg' as CardRounded,
      padding: 'md' as CardPadding,
      background: 'default' as CardBackground
    },
    elevated: {
      variant: 'elevated' as CardVariant,
      size: 'md' as CardSize,
      shadow: 'lg' as CardShadow,
      rounded: 'lg' as CardRounded,
      padding: 'lg' as CardPadding,
      background: 'default' as CardBackground
    },
    interactive: {
      variant: 'default' as CardVariant,
      size: 'md' as CardSize,
      shadow: 'md' as CardShadow,
      rounded: 'lg' as CardRounded,
      padding: 'md' as CardPadding,
      background: 'default' as CardBackground
    }
  }
} as const;

// 组件工具函数
export const componentUtils = {
  /**
   * 获取按钮样式类
   */
  getButtonClasses(variant: ButtonVariant, size: ButtonSize, disabled: boolean = false) {
    return [
      `ss-button--${variant}`,
      `ss-button--${size}`,
      { 'opacity-50 cursor-not-allowed': disabled }
    ];
  },

  /**
   * 获取输入框样式类
   */
  getInputClasses(size: InputSize, hasError: boolean = false, disabled: boolean = false) {
    return [
      'ss-input',
      `ss-input--${size}`,
      {
        'ss-input--error': hasError,
        'ss-input--disabled': disabled
      }
    ];
  },

  /**
   * 获取卡片样式类
   */
  getCardClasses(
    variant: CardVariant,
    size: CardSize,
    shadow: CardShadow,
    rounded: CardRounded,
    padding: CardPadding,
    background: CardBackground
  ) {
    return [
      'ss-card',
      `ss-card--${variant}`,
      `ss-card--${size}`,
      `ss-card--${shadow}`,
      `ss-card--${rounded}`,
      `ss-card--${padding}`,
      `ss-card--${background}`
    ];
  }
};

// 主题相关工具
export const themeUtils = {
  /**
   * 获取状态颜色
   */
  getStatusColor(status: 'healthy' | 'unhealthy' | 'pending' | 'testing' | 'unknown') {
    const colors = {
      healthy: 'text-success-600 bg-success-100',
      unhealthy: 'text-error-600 bg-error-100',
      pending: 'text-warning-600 bg-warning-100',
      testing: 'text-primary-600 bg-primary-100',
      unknown: 'text-gray-600 bg-gray-100'
    };
    return colors[status];
  },

  /**
   * 获取协议颜色
   */
  getProtocolColor(protocol: string) {
    const colors: Record<string, string> = {
      vmess: 'text-blue-600 bg-blue-100',
      vless: 'text-success-600 bg-success-100',
      trojan: 'text-warning-600 bg-warning-100',
      shadowsocks: 'text-error-600 bg-error-100',
      hysteria: 'text-purple-600 bg-purple-100',
      tuic: 'text-cyan-600 bg-cyan-100'
    };
    return colors[protocol] || colors.unknown;
  }
};

// 默认导出所有组件
export default {
  SsButton,
  SsInput,
  SsCard,
  SsStatus,
  SsBadge,
  COMPONENT_PRESET,
  componentUtils,
  themeUtils
};