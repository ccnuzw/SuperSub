/**
 * 业务组件库索引文件
 * 统一导出所有业务相关组件
 */

import { h } from 'vue';

// 节点相关组件
import NodeCard from './NodeCard.vue';
import NodeStatusIndicator from './NodeStatusIndicator.vue';

// 订阅相关组件
import SubscriptionCard from './SubscriptionCard.vue';
import SubscriptionStatusIndicator from './SubscriptionStatusIndicator.vue';

// 重新导出组件
export { default as NodeCard } from './NodeCard.vue';
export { default as NodeStatusIndicator } from './NodeStatusIndicator.vue';
export { default as SubscriptionCard } from './SubscriptionCard.vue';
export { default as SubscriptionStatusIndicator } from './SubscriptionStatusIndicator.vue';

// 类型定义（使用统一的I前缀类型）
export type {
  ISubscription,
  IProfile,
  NodeStatus,
  SubscriptionStatus,
  ProtocolType
} from '@/types';

// 业务组件工具函数
export const businessUtils = {
  /**
   * 获取协议显示名称
   */
  getProtocolName(protocol: string): string {
    const protocolNames: Record<string, string> = {
      vmess: 'VMess',
      vless: 'VLESS',
      trojan: 'Trojan',
      shadowsocks: 'Shadowsocks',
      socks5: 'SOCKS5',
      http: 'HTTP',
      https: 'HTTPS'
    };
    return protocolNames[protocol] || protocol.toUpperCase();
  },

  /**
   * 获取协议颜色变体
   */
  getProtocolVariant(protocol: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' {
    const variantMap: Record<string, any> = {
      vmess: 'primary',
      vless: 'secondary',
      trojan: 'success',
      shadowsocks: 'warning',
      socks5: 'error',
      http: 'info',
      https: 'info'
    };
    return variantMap[protocol] || 'secondary';
  },

  /**
   * 获取延迟等级
   */
  getLatencyGrade(latency: number): 'excellent' | 'good' | 'moderate' | 'poor' {
    if (latency < 100) return 'excellent';
    if (latency < 200) return 'good';
    if (latency < 500) return 'moderate';
    return 'poor';
  },

  /**
   * 获取延迟等级文本
   */
  getLatencyGradeText(latency: number): string {
    const grade = this.getLatencyGrade(latency);
    const gradeTexts: Record<string, string> = {
      excellent: '优秀',
      good: '良好',
      moderate: '一般',
      poor: '较差'
    };
    return gradeTexts[grade] || '未知';
  },

  /**
   * 格式化延迟时间
   */
  formatLatency(latency: number): string {
    if (latency < 1000) {
      return `${Math.round(latency)}ms`;
    } else {
      return `${(latency / 1000).toFixed(1)}s`;
    }
  },

  /**
   * 格式化相对时间
   */
  formatRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        return `${days}天前`;
      } else if (hours > 0) {
        return `${hours}小时前`;
      } else if (minutes > 0) {
        return `${minutes}分钟前`;
      } else {
        return '刚刚';
      }
    } catch {
      return '未知';
    }
  },

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  /**
   * 获取状态显示文本
   */
  getStatusText(status: string): string {
    const statusTexts: Record<string, string> = {
      healthy: '正常',
      unhealthy: '异常',
      testing: '测试中',
      unknown: '未知',
      updating: '更新中',
      error: '错误',
      expired: '过期',
      online: '在线',
      offline: '离线'
    };
    return statusTexts[status] || status;
  },

  /**
   * 获取状态颜色
   */
  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      healthy: 'green',
      unhealthy: 'red',
      testing: 'blue',
      unknown: 'gray',
      updating: 'blue',
      error: 'red',
      expired: 'yellow',
      online: 'green',
      offline: 'red'
    };
    return statusColors[status] || 'gray';
  },

  /**
   * 生成随机节点名称
   */
  generateNodeName(region: string, protocol: string): string {
    const prefixes = ['极速', '高速', '稳定', '高级'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix}${region}-${protocol.toUpperCase()}`;
  },

  /**
   * 计算协议分布百分比
   */
  calculateProtocolDistribution(nodes: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    nodes.forEach(node => {
      distribution[node.protocol] = (distribution[node.protocol] || 0) + 1;
    });

    return distribution;
  },

  /**
   * 计算地区分布百分比
   */
  calculateRegionDistribution(nodes: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    nodes.forEach(node => {
      const region = node.region || '未知';
      distribution[region] = (distribution[region] || 0) + 1;
    });

    return distribution;
  },

  /**
   * 过滤可用节点
   */
  filterHealthyNodes(nodes: any[]): any[] {
    return nodes.filter(node => node.status === 'healthy');
  },

  /**
   * 按延迟排序节点
   */
  sortNodesByLatency(nodes: any[], ascending = true): any[] {
    return [...nodes].sort((a, b) => {
      const aLatency = a.latency || Infinity;
      const bLatency = b.latency || Infinity;
      return ascending ? aLatency - bLatency : bLatency - aLatency;
    });
  }
};

// 业务组件常量
export const BUSINESS_CONSTANTS = {
  // 协议类型
  PROTOCOLS: {
    VMESS: 'vmess',
    VLESS: 'vless',
    TROJAN: 'trojan',
    SHADOWSOCKS: 'shadowsocks',
    SOCKS5: 'socks5',
    HTTP: 'http',
    HTTPS: 'https'
  } as const,

  // 状态类型
  STATUS: {
    HEALTHY: 'healthy',
    UNHEALTHY: 'unhealthy',
    TESTING: 'testing',
    UNKNOWN: 'unknown',
    UPDATING: 'updating',
    ERROR: 'error',
    EXPIRED: 'expired'
  } as const,

  // 延迟阈值
  LATENCY_THRESHOLD: {
    EXCELLENT: 100,
    GOOD: 200,
    MODERATE: 500
  } as const,

  // 更新间隔
  UPDATE_INTERVAL: {
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000
  } as const
} as const;

// 默认导出
export default {
  NodeCard,
  NodeStatusIndicator,
  SubscriptionCard,
  SubscriptionStatusIndicator,
  businessUtils,
  BUSINESS_CONSTANTS
};