/**
 * 布局组件相关类型定义
 */

// 面包屑导航项
export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

// 页面头部统计项
export interface StatItem {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  icon?: any; // Vue组件
  type?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  onClick?: () => void;
}

// 统计卡片类型
export interface StatCard {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  icon?: any; // Vue组件
  color?: string;
  background?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  onClick?: () => void;
}

// 页面布局配置
export interface PageLayoutConfig {
  // 基础配置
  title?: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];

  // 统计信息
  showStats?: boolean;
  stats?: StatItem[];

  // 头部操作按钮
  actions?: Array<{
    key: string;
    label: string;
    icon?: any;
    type?: 'primary' | 'default' | 'success' | 'warning' | 'error';
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  }>;

  // 样式配置
  maxWidth?: string;
  padding?: string;
  background?: 'gradient' | 'solid' | 'glass';
  showHeader?: boolean;
  showBreadcrumb?: boolean;

  // 响应式配置
  responsive?: {
    mobile?: {
      padding?: string;
      showStats?: boolean;
      collapsedActions?: boolean;
    };
    tablet?: {
      padding?: string;
      gridColumns?: number;
    };
  };
}

// 内容卡片配置
export interface ContentCardConfig {
  // 基础属性
  title?: string;
  subtitle?: string;

  // 样式变体
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'sm' | 'md' | 'lg' | 'xl';

  // 交互状态
  hoverable?: boolean;
  clickable?: boolean;
  loading?: boolean;

  // 头部配置
  header?: {
    title?: string;
    subtitle?: string;
    actions?: Array<{
      key: string;
      label: string;
      icon?: any;
      onClick: () => void;
    }>;
  };

  // 底部配置
  footer?: {
    content?: string;
    actions?: Array<{
      key: string;
      label: string;
      type?: 'primary' | 'default';
      onClick: () => void;
    }>;
  };
}

// 表单容器配置
export interface FormContainerConfig {
  // 基础配置
  title?: string;
  subtitle?: string;
  description?: string;

  // 样式配置
  size?: 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: string;
  centered?: boolean;

  // 头部配置
  header?: {
    title?: string;
    subtitle?: string;
    showBack?: boolean;
    backText?: string;
    onBack?: () => void;
  };

  // 底部配置
  footer?: {
    align?: 'left' | 'center' | 'right' | 'space-between';
    actions?: Array<{
      key: string;
      label: string;
      type?: 'primary' | 'default' | 'success' | 'warning' | 'error';
      loading?: boolean;
      disabled?: boolean;
      onClick: () => void;
    }>;
  };
}

// 动画配置
export interface AnimationConfig {
  // 入场动画
  enter?: 'fade-in' | 'fade-in-up' | 'slide-in-left' | 'slide-in-right' | 'scale-in' | 'bounce-in';

  // 动画延迟
  delay?: number;

  // 动画时长
  duration?: 'fast' | 'normal' | 'slow';

  // 交错动画（用于列表项）
  stagger?: boolean;
  staggerDelay?: number;
}

// 响应式断点
export interface BreakpointConfig {
  mobile: number;    // < 768px
  tablet: number;    // 768px - 1024px
  desktop: number;   // > 1024px
}

// 主题配置
export interface ThemeConfig {
  mode?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl';

  // 自定义CSS变量
  customVariables?: Record<string, string>;
}

// 布局尺寸预设
export const LAYOUT_PRESETS = {
  // 页面容器最大宽度
  maxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    full: '100%'
  },

  // 内边距预设
  padding: {
    sm: 'var(--spacing-md)',
    md: 'var(--spacing-lg)',
    lg: 'var(--spacing-xl)',
    xl: 'var(--spacing-2xl)'
  },

  // 统计卡片网格
  statsGrid: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
  }
} as const;

// 默认配置
export const DEFAULT_LAYOUT_CONFIG: Partial<PageLayoutConfig> = {
  background: 'gradient',
  showHeader: true,
  showBreadcrumb: true,
  maxWidth: '1200px',
  padding: 'var(--spacing-xl)'
};

export const DEFAULT_CARD_CONFIG: Partial<ContentCardConfig> = {
  variant: 'default',
  padding: 'lg',
  hoverable: true
};

export const DEFAULT_FORM_CONFIG: Partial<FormContainerConfig> = {
  size: 'lg',
  centered: true,
  maxWidth: '400px'
};