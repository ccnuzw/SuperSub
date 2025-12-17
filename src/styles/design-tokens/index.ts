/**
 * 设计令牌系统 - Design Tokens
 * 定义全局设计变量，确保UI一致性
 */

// 颜色系统
export const ColorTokens = {
  // 主色调
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // 主色
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },

  // 灰色调
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  },

  // 语义化颜色
  semantic: {
    success: {
      light: '#dcfce7',
      main: '#16a34a',
      dark: '#15803d'
    },
    warning: {
      light: '#fef3c7',
      main: '#d97706',
      dark: '#92400e'
    },
    error: {
      light: '#fee2e2',
      main: '#dc2626',
      dark: '#991b1b'
    },
    info: {
      light: '#dbeafe',
      main: '#2563eb',
      dark: '#1d4ed8'
    }
  },

  // 状态颜色
  status: {
    healthy: '#10b981',
    unhealthy: '#ef4444',
    pending: '#f59e0b',
    testing: '#3b82f6',
    unknown: '#6b7280'
  },

  // 协议颜色
  protocol: {
    vmess: '#3b82f6',
    vless: '#10b981',
    trojan: '#f59e0b',
    shadowsocks: '#ef4444',
    hysteria: '#8b5cf6',
    tuic: '#06b6d4'
  }
} as const;

// 间距系统
export const SpacingTokens = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
  '5xl': '8rem'    // 128px
} as const;

// 字体系统
export const TypographyTokens = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Cascadia Code', 'SF Mono', 'monospace']
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
    '5xl': ['3rem', { lineHeight: '1' }],          // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],       // 60px
  },

  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  }
} as const;

// 圆角系统
export const BorderRadiusTokens = {
  none: '0',
  sm: '0.25rem',    // 4px
  base: '0.375rem', // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  full: '9999px'
} as const;

// 阴影系统
export const ShadowTokens = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
} as const;

// 断点系统
export const BreakpointTokens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// 动画系统
export const AnimationTokens = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },

  easing: {
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
} as const;

// Z-index层级系统
export const ZIndexTokens = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800
} as const;

// 主题系统
export const ThemeTokens = {
  light: {
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6'
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af'
    },
    border: {
      light: '#f3f4f6',
      medium: '#e5e7eb',
      dark: '#d1d5db'
    }
  },

  dark: {
    background: {
      primary: '#111827',
      secondary: '#1f2937',
      tertiary: '#374151'
    },
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      tertiary: '#9ca3af'
    },
    border: {
      light: '#374151',
      medium: '#4b5563',
      dark: '#6b7280'
    }
  }
} as const;

// 组件特定令牌
export const ComponentTokens = {
  // 按钮令牌
  button: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem'       // 48px
    },
    padding: {
      sm: '0.5rem 1rem',
      md: '0.75rem 1.5rem',
      lg: '1rem 2rem'
    },
    fontSize: {
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem'
    },
    borderRadius: BorderRadiusTokens.md
  },

  // 输入框令牌
  input: {
    height: '2.5rem',    // 40px
    padding: '0.625rem 0.875rem', // 10px 14px
    fontSize: '1rem',
    borderRadius: BorderRadiusTokens.md,
    borderWidth: '1px'
  },

  // 卡片令牌
  card: {
    padding: SpacingTokens.lg,
    borderRadius: BorderRadiusTokens.lg,
    shadow: ShadowTokens.md
  },

  // 表格令牌
  table: {
    headerHeight: '3rem',      // 48px
    rowHeight: '2.5rem',       // 40px
    padding: SpacingTokens.md,
    borderRadius: BorderRadiusTokens.md
  }
} as const;

// 导出所有设计令牌
export const DesignTokens = {
  colors: ColorTokens,
  spacing: SpacingTokens,
  typography: TypographyTokens,
  borderRadius: BorderRadiusTokens,
  shadows: ShadowTokens,
  breakpoints: BreakpointTokens,
  animation: AnimationTokens,
  zIndex: ZIndexTokens,
  theme: ThemeTokens,
  components: ComponentTokens
} as const;

// 导出类型定义
export type ColorToken = typeof ColorTokens;
export type SpacingToken = typeof SpacingTokens;
export type TypographyToken = typeof TypographyTokens;
export type BorderRadiusToken = typeof BorderRadiusTokens;
export type ShadowToken = typeof ShadowTokens;
export type BreakpointToken = typeof BreakpointTokens;
export type AnimationToken = typeof AnimationTokens;
export type ZIndexToken = typeof ZIndexTokens;
export type ThemeToken = typeof ThemeTokens;
export type ComponentToken = typeof ComponentTokens;