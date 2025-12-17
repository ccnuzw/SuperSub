/**
 * 通用组件索引文件
 * 统一导出所有通用组件
 */

// 搜索相关
export { default as GlobalSearchResults } from './GlobalSearchResults.vue';

// 类型定义
export interface SearchResultItem {
  id: string;
  name: string;
  type: 'node' | 'subscription' | 'profile';
  description?: string;
  meta?: Record<string, any>;
  route: { name: string; params?: any };
}

export interface QuickAccessSuggestion {
  key: string;
  label: string;
  icon: any;
  route: { name: string; params?: any };
}

// 工具函数
export const commonUtils = {
  /**
   * 格式化相对时间
   */
  formatRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        return hours === 0 ? '刚刚' : `${hours}小时前`;
      } else if (days === 1) {
        return '昨天';
      } else if (days < 7) {
        return `${days}天前`;
      } else if (days < 30) {
        const weeks = Math.floor(days / 7);
        return `${weeks}周前`;
      } else if (days < 365) {
        const months = Math.floor(days / 30);
        return `${months}个月前`;
      } else {
        const years = Math.floor(days / 365);
        return `${years}年前`;
      }
    } catch {
      return dateString;
    }
  },

  /**
   * 获取状态显示文本
   */
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      healthy: '正常',
      unhealthy: '异常',
      pending: '等待中',
      unknown: '未知',
      online: '在线',
      offline: '离线'
    };
    return statusMap[status] || status;
  },

  /**
   * 获取协议显示文本
   */
  getProtocolText(protocol: string): string {
    const protocolMap: Record<string, string> = {
      vmess: 'VMess',
      vless: 'VLESS',
      trojan: 'Trojan',
      shadowsocks: 'Shadowsocks',
      socks5: 'SOCKS5',
      http: 'HTTP',
      https: 'HTTPS'
    };
    return protocolMap[protocol] || protocol.toUpperCase();
  },

  /**
   * 高亮搜索关键词
   */
  highlightSearchTerm(text: string, searchTerm: string): string {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900">$1</mark>');
  },

  /**
   * 防抖函数
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * 节流函数
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// 默认导出
export default {
  commonUtils
};