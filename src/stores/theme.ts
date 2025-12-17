/**
 * 主题状态管理
 * 直接使用 Pinia 和 Vue 组合式 API
 */

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * 主题模式类型
 */
export type ThemeMode = 'light' | 'dark';

/**
 * 主题Store
 * 提供主题切换的统一状态管理
 */
export const useThemeStore = defineStore('theme', () => {
  // 状态
  const theme = ref<Theme>('light');
  const systemTheme = ref<ThemeMode>('light');
  const effectiveTheme = ref<ThemeMode>('light');
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<string | null>(null);

  // 计算属性
  const isDark = computed(() => effectiveTheme.value === 'dark');
  const isLight = computed(() => effectiveTheme.value === 'light');
  const isAuto = computed(() => theme.value === 'auto');
  const themeIcon = computed(() => {
    switch (theme.value) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'auto':
        return '🌓';
      default:
        return '☀️';
    }
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

  /**
   * 检测系统主题
   */
  const detectSystemTheme = (): ThemeMode => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  /**
   * 更新有效主题
   */
  const updateEffectiveTheme = () => {
    if (theme.value === 'auto') {
      effectiveTheme.value = detectSystemTheme();
    } else {
      effectiveTheme.value = theme.value as ThemeMode;
    }
  };

  /**
   * 设置主题
   */
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme;
    updateEffectiveTheme();
    updateLastUpdated();

    // 应用主题到DOM
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', effectiveTheme.value);
      document.documentElement.classList.toggle('dark', effectiveTheme.value === 'dark');
    }
  };

  /**
   * 切换主题
   */
  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(theme.value);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  /**
   * 初始化主题
   */
  const initializeTheme = () => {
    // 从localStorage读取保存的主题
    const savedTheme = localStorage.getItem('supersub-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      theme.value = savedTheme;
    }

    // 检测系统主题
    systemTheme.value = detectSystemTheme();

    // 更新有效主题
    updateEffectiveTheme();

    // 应用主题到DOM
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', effectiveTheme.value);
      document.documentElement.classList.toggle('dark', effectiveTheme.value === 'dark');
    }
  };

  /**
   * 监听系统主题变化
   */
  const watchSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        systemTheme.value = e.matches ? 'dark' : 'light';
        if (theme.value === 'auto') {
          updateEffectiveTheme();
          // 应用主题到DOM
          document.documentElement.setAttribute('data-theme', effectiveTheme.value);
          document.documentElement.classList.toggle('dark', effectiveTheme.value === 'dark');
        }
      });
    }
  };

  // 监听主题变化，保存到localStorage
  watch(theme, (newTheme) => {
    localStorage.setItem('supersub-theme', newTheme);
  }, { immediate: true });

  /**
   * 重置主题
   */
  const reset = () => {
    setTheme('light');
    clearError();
  };

  // 初始化
  initializeTheme();
  watchSystemTheme();

  return {
    // 状态
    theme,
    systemTheme,
    effectiveTheme,
    loading,
    error,
    lastUpdated,

    // 计算属性
    isDark,
    isLight,
    isAuto,
    themeIcon,

    // 方法
    setTheme,
    toggleTheme,
    initializeTheme,
    setLoading,
    setError,
    clearError,
    reset
  };
});

export type ThemeStore = ReturnType<typeof useThemeStore>;