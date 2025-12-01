import { ref, computed } from 'vue';
import type { Node } from '@/types/entities';
import { useNodeHealth } from './useNodeHealth';

// 节点统计信息接口
export interface NodeStatistics {
  total: number;
  online: number;
  offline: number;
  error: number;
  pending: number;
  testing: number;
  healthyRate: number; // 健康率
  avgLatency: number; // 平均延迟
}

// 协议分布统计接口
export interface ProtocolDistribution {
  protocol: string;
  count: number;
  percentage: number;
  color: string;
}

// 延迟分布统计接口
export interface LatencyDistribution {
  level: string;
  count: number;
  percentage: number;
  color: string;
  range: string;
}

// 分组统计接口
export interface GroupStatistics {
  groupId: string;
  groupName: string;
  nodeCount: number;
  onlineCount: number;
  healthyRate: number;
  avgLatency: number;
}

export function useNodeHealthStats(nodes: any) {
  const { getNodeHealthStatus } = useNodeHealth();

  // 基础统计信息
  const statistics = computed<NodeStatistics>(() => {
    if (!nodes?.value || nodes.value.length === 0) {
      return {
        total: 0,
        online: 0,
        offline: 0,
        error: 0,
        pending: 0,
        testing: 0,
        healthyRate: 0,
        avgLatency: 0,
      };
    }

    let online = 0;
    let offline = 0;
    let error = 0;
    let pending = 0;
    let testing = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    nodes.value.forEach((node: Node) => {
      const health = getNodeHealthStatus(node);

      switch (health.status) {
        case 'online':
          online++;
          break;
        case 'offline':
          offline++;
          break;
        case 'error':
          error++;
          break;
        case 'testing':
          testing++;
          break;
        case 'pending':
          pending++;
          break;
      }

      // 计算延迟统计
      if (health.latency && health.latency > 0) {
        totalLatency += health.latency;
        latencyCount++;
      }
    });

    const total = nodes.value.length;
    const healthyRate = total > 0 ? Math.round((online / total) * 100) : 0;
    const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;

    return {
      total,
      online,
      offline,
      error,
      pending,
      testing,
      healthyRate,
      avgLatency,
    };
  });

  // 协议分布统计
  const protocolDistribution = computed<ProtocolDistribution[]>(() => {
    if (!nodes?.value || nodes.value.length === 0) {
      return [];
    }

    const protocolMap = new Map<string, number>();
    const total = nodes.value.length;

    nodes.value.forEach((node: Node) => {
      const protocol = node.protocol || 'unknown';
      protocolMap.set(protocol, (protocolMap.get(protocol) || 0) + 1);
    });

    const colors: Record<string, string> = {
      vmess: '#1890ff',
      vless: '#52c41a',
      trojan: '#faad14',
      ss: '#722ed1',
      ssr: '#eb2f96',
      hysteria2: '#13c2c2',
      tuic: '#fa8c16',
      anytls: '#f5222d',
      unknown: '#d9d9d9',
    };

    const distribution: ProtocolDistribution[] = Array.from(protocolMap.entries())
      .map(([protocol, count]) => ({
        protocol,
        count,
        percentage: Math.round((count / total) * 100),
        color: colors[protocol] || colors.unknown,
      }))
      .sort((a, b) => b.count - a.count);

    return distribution;
  });

  // 延迟分布统计
  const latencyDistribution = computed<LatencyDistribution[]>(() => {
    if (!nodes?.value || nodes.value.length === 0) {
      return [];
    }

    const levels = [
      { level: '优秀', min: 0, max: 100, color: '#52c41a', range: '0-100ms' },
      { level: '良好', min: 100, max: 300, color: '#1890ff', range: '100-300ms' },
      { level: '一般', min: 300, max: 1000, color: '#faad14', range: '300-1000ms' },
      { level: '较差', min: 1000, max: Infinity, color: '#ff7a45', range: '1000ms+' },
      { level: '超时', min: -1, max: -1, color: '#ff4d4f', range: '超时' },
    ];

    const distribution: LatencyDistribution[] = [];
    const total = nodes.value.length;

    let timeoutCount = 0;

    nodes.value.forEach((node: Node) => {
      const health = getNodeHealthStatus(node);
      const latency = health.latency;

      if (latency === 0) {
        timeoutCount++;
      } else if (latency && latency > 0) {
        const level = levels.find(l => latency >= l.min && latency < l.max);
        if (level) {
          const existing = distribution.find(d => d.level === level.level);
          if (existing) {
            existing.count++;
          } else {
            distribution.push({
              level: level.level,
              count: 1,
              percentage: 0,
              color: level.color,
              range: level.range,
            });
          }
        }
      }
    });

    // 添加超时统计
    if (timeoutCount > 0) {
      distribution.push({
        level: '超时',
        count: timeoutCount,
        percentage: 0,
        color: '#ff4d4f',
        range: '超时',
      });
    }

    // 计算百分比
    distribution.forEach(item => {
      item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
    });

    // 按延迟等级排序
    const levelOrder = ['优秀', '良好', '一般', '较差', '超时'];
    return distribution.sort((a, b) => {
      const indexA = levelOrder.indexOf(a.level);
      const indexB = levelOrder.indexOf(b.level);
      return indexA - indexB;
    });
  });

  // 获取协议图标
  const getProtocolIcon = (protocol: string): string => {
    const icons: Record<string, string> = {
      vmess: '🚀',
      vless: '⚡',
      trojan: '🛡️',
      ss: '🔐',
      ssr: '🔒',
      hysteria2: '🌊',
      tuic: '🎯',
      anytls: '🔑',
      unknown: '❓',
    };
    return icons[protocol] || icons.unknown;
  };

  // 获取健康状态颜色
  const getHealthStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      online: '#52c41a',
      offline: '#ff4d4f',
      error: '#ff7a45',
      testing: '#1890ff',
      pending: '#d9d9d9',
    };
    return colors[status] || '#d9d9d9';
  };

  // 获取健康率等级
  const getHealthRateLevel = (rate: number): { level: string; color: string; description: string } => {
    if (rate >= 90) {
      return { level: '优秀', color: '#52c41a', description: '节点状态非常好' };
    }
    if (rate >= 75) {
      return { level: '良好', color: '#1890ff', description: '节点状态良好' };
    }
    if (rate >= 50) {
      return { level: '一般', color: '#faad14', description: '部分节点可能有问题' };
    }
    if (rate >= 25) {
      return { level: '较差', color: '#ff7a45', description: '多数节点存在问题' };
    }
    return { level: '糟糕', color: '#ff4d4f', description: '节点状态很糟糕' };
  };

  // 获取延迟等级
  const getLatencyLevel = (latency: number): { level: string; color: string; description: string } => {
    if (latency === 0) {
      return { level: '超时', color: '#ff4d4f', description: '连接超时' };
    }
    if (latency < 100) {
      return { level: '优秀', color: '#52c41a', description: '连接速度很快' };
    }
    if (latency < 300) {
      return { level: '良好', color: '#1890ff', description: '连接速度正常' };
    }
    if (latency < 1000) {
      return { level: '一般', color: '#faad14', description: '连接速度较慢' };
    }
    return { level: '较差', color: '#ff7a45', description: '连接速度很慢' };
  };

  // 格式化统计数字
  const formatStatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  // 计算分组统计信息
  const calculateGroupStats = (groupId: string, groupName: string, groupNodes: Node[]): GroupStatistics => {
    let onlineCount = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    groupNodes.forEach(node => {
      const health = getNodeHealthStatus(node);
      if (health.status === 'online') {
        onlineCount++;
      }
      if (health.latency && health.latency > 0) {
        totalLatency += health.latency;
        latencyCount++;
      }
    });

    const nodeCount = groupNodes.length;
    const healthyRate = nodeCount > 0 ? Math.round((onlineCount / nodeCount) * 100) : 0;
    const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;

    return {
      groupId,
      groupName,
      nodeCount,
      onlineCount,
      healthyRate,
      avgLatency,
    };
  };

  return {
    // 响应式数据
    statistics,
    protocolDistribution,
    latencyDistribution,

    // 工具方法
    getProtocolIcon,
    getHealthStatusColor,
    getHealthRateLevel,
    getLatencyLevel,
    formatStatNumber,
    calculateGroupStats,
  };
}