<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useMessage, NModal, NSpin, NGrid, NGi, NCard, NStatistic, NDataTable, NTag, NPagination } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { adminApi, type ProfileLogsResponse } from '@/api/admin';
import type { ApiResponse } from '@/types';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

const props = defineProps<{
  show: boolean;
  profileId: string | null;
  profileName: string | null;
}>();

const emit = defineEmits(['update:show']);

const message = useMessage();
const loading = ref(false);
const logData = ref<ProfileLogsResponse | null>(null);

const showModal = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
});

const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
});

interface LogRecord {
  ip_address: string;
  user_agent: string;
  country: string;
  city: string;
  accessed_at: string;
}

const columns: DataTableColumns<LogRecord> = [
  { title: 'IP 地址', key: 'ip_address', width: 150 },
  { title: 'User Agent', key: 'user_agent', ellipsis: { tooltip: true } },
  { title: '国家', key: 'country', width: 100 },
  { title: '城市', key: 'city', width: 120 },
  { title: '访问时间', key: 'accessed_at', width: 200, render: (row) => new Date(row.accessed_at).toLocaleString() },
];

const fetchLogs = async (profileId: string, page = 1, limit = 10) => {
  if (!profileId) return;
  loading.value = true;
  try {
    const response = await adminApi.fetchProfileLogs(profileId, page, limit);
    if (response.data.success && response.data.data) {
      logData.value = response.data.data;
      // Add safe checks for response.data.data.logs before accessing properties
      if (response.data.data.logs) {
        pagination.value.total = response.data.data.logs.total;
        pagination.value.page = response.data.data.logs.page;
      } else {
        // If logs property is missing, reset pagination or handle as an error
        pagination.value.total = 0;
        pagination.value.page = 1;
      }
    } else {
      message.error(response.data.message || '获取日志失败'); // Assuming message might be on top level if data null
      logData.value = null; // Clear data if fetch failed
      pagination.value.total = 0;
      pagination.value.page = 1;
    }
  } catch (err: any) {
    message.error(err.message || '请求日志失败');
    logData.value = null; // Clear data on error
    pagination.value.total = 0;
    pagination.value.page = 1;
  } finally {
    loading.value = false;
  }
};

watch(() => props.profileId, (newId) => {
  if (newId && props.show) {
    fetchLogs(newId, pagination.value.page, pagination.value.limit);
  }
}, { immediate: true });

watch(() => props.show, (newVal) => {
    if (newVal && props.profileId) {
        fetchLogs(props.profileId, 1, 10);
    }
});


const handlePageChange = (page: number) => {
  pagination.value.page = page;
  if (props.profileId) {
    fetchLogs(props.profileId, page, pagination.value.limit);
  }
};

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

</script>

<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="`订阅日志 - ${profileName}`"
    style="width: 1200px;"
    :mask-closable="true"
    :trap-focus="false"
  >
    <n-spin :show="loading">
      <div v-if="logData" style="max-height: 75vh; overflow-y: auto; padding-right: 16px;">
        <n-card title="核心指标" :bordered="false">
          <n-grid :cols="4" :x-gap="12">
            <n-gi><n-statistic label="总访问次数" :value="logData.metrics.totalAccess" /></n-gi>
            <n-gi><n-statistic label="独立IP数" :value="logData.metrics.uniqueIps" /></n-gi>
          </n-grid>
        </n-card>

        <n-grid :cols="2" :x-gap="16" class="mt-4">
          <n-gi>
            <n-card title="访问趋势">
              <v-chart class="chart" :option="lineChartOptions" style="height: 300px;" autoresize />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card title="来源分布">
              <v-chart class="chart" :option="pieChartOptions" style="height: 300px;" autoresize />
            </n-card>
          </n-gi>
        </n-grid>

        <n-card title="详细日志" class="mt-4">
          <n-data-table
            :columns="columns"
            :data="logData.logs.data"
            :bordered="false"
            :single-line="false"
          />
          <div class="flex justify-end mt-4">
            <n-pagination
              v-model:page="pagination.page"
              :item-count="pagination.total"
              :page-size="pagination.limit"
              @update:page="handlePageChange"
            />
          </div>
        </n-card>
      </div>
      <div v-else-if="!loading" style="text-align: center; padding: 40px;">
        没有找到相关日志记录。
      </div>
    </n-spin>
  </n-modal>
</template>