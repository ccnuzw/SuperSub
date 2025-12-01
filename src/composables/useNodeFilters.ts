import { ref, computed, watch } from 'vue';
import { debounce } from 'lodash-es';
import type { Node } from '@/types/entities';
import { useNodeHealth } from './useNodeHealth';
import { useNodeGroups } from './useNodeGroups';

// 过滤配置接口
export interface FilterConfig {
  keyword: string;
  protocol: string[];
  status: string[];
  groupId: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// 移动端分页配置
export interface PaginationConfig {
  page: number;
  pageSize: number;
  itemCount: number;
  pageCount: number;
}

// 排序选项
export const SORT_OPTIONS = [
  { label: '默认排序', value: 'default' },
  { label: '按名称', value: 'name' },
  { label: '按延迟', value: 'latency' },
  { label: '按创建时间', value: 'created_at' },
  { label: '按更新时间', value: 'updated_at' },
  { label: '按排序顺序', value: 'sort_order' },
];

// 协议选项
export const PROTOCOL_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: 'VMess', value: 'vmess' },
  { label: 'VLESS', value: 'vless' },
  { label: 'Trojan', value: 'trojan' },
  { label: 'Shadowsocks', value: 'ss' },
  { label: 'ShadowsocksR', value: 'ssr' },
  { label: 'Hysteria2', value: 'hysteria2' },
  { label: 'TUIC', value: 'tuic' },
  { label: 'AnyTLS', value: 'anytls' },
];

// 状态选项
export const STATUS_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
  { label: '错误', value: 'error' },
  { label: '测试中', value: 'testing' },
  { label: '未测试', value: 'pending' },
];

export function useNodeFilters(
  nodes: any,
  groupId: any,
  mobilePagination: any
) {
  const { getNodeHealthStatus } = useNodeHealth();
  const { filterNodeByGroup } = useNodeGroups(nodes);

  // 过滤状态
  const filterConfig = ref<FilterConfig>({
    keyword: '',
    protocol: [],
    status: [],
    groupId: '',
    sortBy: 'default',
    sortOrder: 'asc',
  });

  // 移动端分页状态
  const pagination = computed<PaginationConfig>(() => {
    if (!mobilePagination?.value) return { page: 1, pageSize: 15, itemCount: 0, pageCount: 1 };

    return {
      page: mobilePagination.value.page || 1,
      pageSize: mobilePagination.value.pageSize || 15,
      itemCount: mobilePagination.value.itemCount || 0,
      pageCount: mobilePagination.value.pageCount || 1,
    };
  });

  // 过滤后的节点（不分页）
  const filteredNodes = computed(() => {
    if (!nodes?.value) return [];

    let result = [...nodes.value];

    // 分组过滤
    if (groupId.value) {
      result = result.filter(node => filterNodeByGroup(node, groupId.value));
    }

    // 关键词搜索
    if (filterConfig.value.keyword) {
      const keyword = filterConfig.value.keyword.toLowerCase();
      result = result.filter(node =>
        node.name?.toLowerCase().includes(keyword) ||
        node.server?.toLowerCase().includes(keyword) ||
        node.protocol?.toLowerCase().includes(keyword)
      );
    }

    // 协议过滤
    if (filterConfig.value.protocol.length > 0) {
      result = result.filter(node =>
        filterConfig.value.protocol.includes(node.protocol)
      );
    }

    // 健康状态过滤
    if (filterConfig.value.status.length > 0) {
      result = result.filter(node => {
        const health = getNodeHealthStatus(node);
        return filterConfig.value.status.includes(health.status);
      });
    }

    // 排序
    if (filterConfig.value.sortBy !== 'default') {
      result = sortNodes(result, filterConfig.value.sortBy, filterConfig.value.sortOrder);
    }

    return result;
  });

  // 排序方法
  const sortNodes = (
    nodeList: Node[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Node[] => {
    return [...nodeList].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'latency':
          aValue = getNodeHealthStatus(a).latency || Infinity;
          bValue = getNodeHealthStatus(b).latency || Infinity;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        case 'sort_order':
          aValue = a.sort_order || 0;
          bValue = b.sort_order || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // 移动端分页后的节点
  const paginatedNodes = computed(() => {
    if (!filteredNodes.value.length) return [];

    const startIndex = (pagination.value.page - 1) * pagination.value.pageSize;
    const endIndex = startIndex + pagination.value.pageSize;

    return filteredNodes.value.slice(startIndex, endIndex);
  });

  // 更新分页信息
  const updatePagination = () => {
    if (!mobilePagination.value) return;

    mobilePagination.value.itemCount = filteredNodes.value.length;

    // 如果当前页超出范围，重置到第一页
    if (pagination.value.page > pagination.value.pageCount && pagination.value.pageCount > 0) {
      mobilePagination.value.page = 1;
    }
  };

  // 防抖搜索
  const debouncedSearch = debounce((keyword: string) => {
    filterConfig.value.keyword = keyword;
  }, 300);

  // 搜索处理
  const handleSearch = (keyword: string) => {
    debouncedSearch(keyword);
  };

  // 更新过滤器
  const updateFilter = (key: keyof FilterConfig, value: any) => {
    (filterConfig.value as any)[key] = value;
  };

  // 批量更新过滤器
  const updateFilters = (filters: Partial<FilterConfig>) => {
    Object.assign(filterConfig.value, filters);
  };

  // 重置过滤器
  const resetFilters = () => {
    filterConfig.value = {
      keyword: '',
      protocol: [],
      status: [],
      groupId: '',
      sortBy: 'default',
      sortOrder: 'asc',
    };
  };

  // 清空搜索
  const clearSearch = () => {
    filterConfig.value.keyword = '';
  };

  // 切换排序
  const toggleSort = (sortBy: string) => {
    if (filterConfig.value.sortBy === sortBy) {
      // 如果是相同字段，切换排序顺序
      filterConfig.value.sortOrder =
        filterConfig.value.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // 如果是不同字段，设置为升序
      filterConfig.value.sortBy = sortBy;
      filterConfig.value.sortOrder = 'asc';
    }
  };

  // 获取过滤条件摘要
  const getFilterSummary = computed(() => {
    const conditions: string[] = [];

    if (filterConfig.value.keyword) {
      conditions.push(`搜索: "${filterConfig.value.keyword}"`);
    }

    if (filterConfig.value.protocol.length > 0) {
      const protocols = filterConfig.value.protocol
        .map(p => PROTOCOL_OPTIONS.find(opt => opt.value === p)?.label)
        .join(', ');
      conditions.push(`协议: ${protocols}`);
    }

    if (filterConfig.value.status.length > 0) {
      const statuses = filterConfig.value.status
        .map(s => STATUS_OPTIONS.find(opt => opt.value === s)?.label)
        .join(', ');
      conditions.push(`状态: ${statuses}`);
    }

    if (filterConfig.value.sortBy !== 'default') {
      const sortOption = SORT_OPTIONS.find(opt => opt.value === filterConfig.value.sortBy);
      const orderText = filterConfig.value.sortOrder === 'asc' ? '升序' : '降序';
      conditions.push(`排序: ${sortOption?.label} ${orderText}`);
    }

    return conditions.join(' | ');
  });

  // 检查是否有活动过滤器
  const hasActiveFilters = computed(() => {
    return (
      filterConfig.value.keyword !== '' ||
      filterConfig.value.protocol.length > 0 ||
      filterConfig.value.status.length > 0 ||
      filterConfig.value.sortBy !== 'default'
    );
  });

  // 获取排序后的表格数据
  const getSortedTableData = (sortKey: string, sortOrder: 'asc' | 'desc') => {
    if (sortKey === 'default') {
      return filteredNodes.value;
    }

    return sortNodes(filteredNodes.value, sortKey, sortOrder);
  };

  // 监听过滤结果变化，更新分页
  watch(filteredNodes, () => {
    updatePagination();
  }, { immediate: true });

  return {
    // 响应式状态
    filterConfig,
    filteredNodes,
    paginatedNodes,
    pagination,
    getFilterSummary,
    hasActiveFilters,

    // 方法
    handleSearch,
    updateFilter,
    updateFilters,
    resetFilters,
    clearSearch,
    toggleSort,
    getSortedTableData,
    updatePagination,

    // 常量
    SORT_OPTIONS,
    PROTOCOL_OPTIONS,
    STATUS_OPTIONS,
  };
}