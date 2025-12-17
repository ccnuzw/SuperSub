<script setup lang="ts">
import { computed, watch } from 'vue';
import { useMessage, NModal, NSpin, NGrid, NGi, NCard, NStatistic, NDataTable, NPagination } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { use as useEcharts } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { useSubscriptionLogs } from '@/composables/useSubscriptionLogs';

useEcharts([
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

const {
  loading,
  logData,
  pagination,
  columns,
  lineChartOptions,
  pieChartOptions,
  fetchLogs,
  handlePageChange,
  resetLogs,
} = useSubscriptionLogs();

const showModal = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
});

watch(() => props.profileId, (newId) => {
  if (newId && props.show) {
    fetchLogs(newId, pagination.value.page, pagination.value.limit);
  }
}, { immediate: true });

watch(() => props.show, (newVal) => {
    if (newVal && props.profileId) {
        fetchLogs(props.profileId, 1, 10);
    } else if (!newVal) {
        resetLogs();
    }
});

const handlePageChangeInternal = (page: number) => {
  const { page: newPage, limit } = handlePageChange(page);
  if (props.profileId) {
    fetchLogs(props.profileId, newPage, limit);
  }
};

</script>

<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="`订阅日志 - ${profileName}`"
    class="w-[1200px]"
    :mask-closable="true"
    :trap-focus="false"
  >
    <n-spin :show="loading">
      <div v-if="logData" class="max-h-[75vh] overflow-y-auto pr-4">
        <n-card title="核心指标" :bordered="false">
          <n-grid :cols="4" :x-gap="12">
            <n-gi><n-statistic label="总访问次数" :value="logData.metrics.totalAccess" /></n-gi>
            <n-gi><n-statistic label="独立IP数" :value="logData.metrics.uniqueIps" /></n-gi>
          </n-grid>
        </n-card>

        <n-grid :cols="2" :x-gap="16" class="mt-4">
          <n-gi>
            <n-card title="访问趋势">
              <v-chart class="chart h-[300px]" :option="lineChartOptions" autoresize />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card title="来源分布">
              <v-chart class="chart h-[300px]" :option="pieChartOptions" autoresize />
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
              @update:page="handlePageChangeInternal"
            />
          </div>
        </n-card>
      </div>
      <div v-else-if="!loading" class="text-center p-10">
        没有找到相关日志记录。
      </div>
    </n-spin>
  </n-modal>
</template>