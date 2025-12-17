import { ref, computed, watch } from 'vue';
import { useMessage } from 'naive-ui';
import httpClient from '@/services/http/HttpClient';
import type { ApiResponse } from '@/types';

interface LogRecord {
  ip_address: string;
  user_agent: string;
  country: string;
  city: string;
  accessed_at: string;
}

interface LogMetrics {
  totalAccess: number;
  uniqueIps: number;
}

interface LogData {
  metrics: LogMetrics;
  trends: Array<{ date: string; count: number }>;
  distribution: {
    countries: Array<{ country: string; count: number }>;
  };
  logs: {
    data: LogRecord[];
    total: number;
    page: number;
    limit: number;
  };
}

export function useSubscriptionLogs() {
  const message = useMessage();
  const loading = ref(false);
  const logData = ref<LogData | null>(null);

  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
  });

  const columns = [
    { title: 'IP 地址', key: 'ip_address', width: 150 },
    { title: 'User Agent', key: 'user_agent', ellipsis: { tooltip: true } },
    { title: '国家', key: 'country', width: 100 },
    { title: '城市', key: 'city', width: 120 },
    {
      title: '访问时间',
      key: 'accessed_at',
      width: 200,
      render: (row: LogRecord) => new Date(row.accessed_at).toLocaleString()
    },
  ];

  const lineChartOptions = computed(() => {
    const trendData = logData.value?.trends || [];
    const dates = trendData.map((d: any) => d.date);
    const counts = trendData.map((d: any) => d.count);
    return {
      title: { text: '最近30日访问趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value' },
      series: [{ data: counts, type: 'line', smooth: true }]
    };
  });

  const pieChartOptions = computed(() => {
    const countryData = logData.value?.distribution?.countries || [];
    return {
      title: { text: '访问来源国家分布', left: 'center' },
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        name: '国家',
        type: 'pie',
        radius: '50%',
        data: countryData.map((c: any) => ({ name: c.country, value: c.count })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  });

  const fetchLogs = async (profileId: string, page = 1, limit = 10) => {
    if (!profileId) return;
    loading.value = true;
    try {
      const response = await httpClient.get<ApiResponse<LogData>>(`/admin/logs/profile/${profileId}?page=${page}&limit=${limit}`);
      if (response.data.success) {
        logData.value = response.data.data;
        pagination.value.total = response.data.data.logs.total;
        pagination.value.page = response.data.data.logs.page;
      } else {
        message.error(response.data.message || '获取日志失败');
      }
    } catch (err: any) {
      message.error(err.message || '请求日志失败');
    } finally {
      loading.value = false;
    }
  };

  const handlePageChange = (page: number) => {
    pagination.value.page = page;
    return { page, limit: pagination.value.limit };
  };

  const resetLogs = () => {
    logData.value = null;
    pagination.value = {
      page: 1,
      limit: 10,
      total: 0,
    };
  };

  return {
    loading,
    logData,
    pagination,
    columns,
    lineChartOptions,
    pieChartOptions,
    fetchLogs,
    handlePageChange,
    resetLogs,
  };
}