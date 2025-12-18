/**
 * 布局组件索引文件
 * 统一导出所有布局相关组件
 */

// 主要布局组件
export { default as AppLayout } from './AppLayout.vue';
export { default as AppHeader } from './AppHeader.vue';
export { default as ContentHeader } from './ContentHeader.vue';
export { default as DynamicHeader } from './DynamicHeader.vue';
export { default as Sidebar } from './Sidebar.vue';

// 类型定义
export interface LayoutProps {
  sidebar?: {
    collapsible?: boolean;
    collapsed?: boolean;
  };
  header?: {
    showSearch?: boolean;
    title?: string;
    description?: string;
  };
}

export interface SidebarProps {
  collapsed?: boolean;
  logo?: {
    icon?: string;
    text?: string;
  };
  user?: {
    name?: string;
    role?: string;
    avatar?: string;
  };
}

export interface HeaderProps {
  title?: string;
  description?: string;
  showSearch?: boolean;
  user?: {
    name?: string;
    role?: string;
    avatar?: string;
  };
}

// 布局工具函数
export const layoutUtils = {
  /**
   * 获取页面标题
   */
  getPageTitle(routeName: string): string {
    const titleMap: Record<string, string> = {
      home: '仪表板',
      subscriptions: '订阅管理',
      nodes: '节点管理',
      profiles: '配置文件',
      'user-management': '用户管理',
      settings: '系统设置',
      login: '登录',
      register: '注册'
    };
    return titleMap[routeName] || 'SuperSub';
  },

  /**
   * 获取页面描述
   */
  getPageDescription(routeName: string): string {
    const descriptionMap: Record<string, string> = {
      home: '查看系统概览和快速操作',
      subscriptions: '管理和监控订阅源',
      nodes: '管理代理节点和连接状态',
      profiles: '创建和管理配置文件',
      'user-management': '管理用户账户和权限',
      settings: '配置系统参数和个人偏好',
      login: '登录到您的账户',
      register: '创建新的账户'
    };
    return descriptionMap[routeName] || '';
  },

  /**
   * 检查是否应该显示侧边栏
   */
  shouldShowSidebar(routeName: string): boolean {
    const noSidebarRoutes = ['login', 'register', '404', '500'];
    return !noSidebarRoutes.includes(routeName);
  },

  /**
   * 获取侧边栏菜单项
   */
  getSidebarMenuItems(isAdmin: boolean) {
    const baseItems = [
      { key: 'home', label: '仪表板', icon: 'HomeOutline', route: 'home' },
      { key: 'subscriptions', label: '订阅管理', icon: 'CloudDownloadOutline', route: 'subscriptions' },
      { key: 'nodes', label: '节点管理', icon: 'HardwareChipOutline', route: 'nodes' },
      { key: 'profiles', label: '配置文件', icon: 'PersonCircleOutline', route: 'profiles' }
    ];

    const adminItems = [
      { key: 'user-management', label: '用户管理', icon: 'PeopleOutline', route: 'user-management' }
    ];

    const settingItems = [
      { key: 'settings', label: '系统设置', icon: 'SettingsOutline', route: 'settings' }
    ];

    let items = [...baseItems];
    if (isAdmin) {
      items = [...items, ...adminItems];
    }
    items = [...items, ...settingItems];

    return items;
  }
};

// 常量定义
export const LAYOUT_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  SIDEBAR_COLLAPSED_WIDTH: 64,
  HEADER_HEIGHT: 64,
  CONTENT_HEADER_HEIGHT: 80,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1280
} as const;

// 默认导出
export default {
  layoutUtils,
  LAYOUT_CONSTANTS
};