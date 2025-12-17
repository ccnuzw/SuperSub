<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { NStatistic, NGrid, NGi, NCard, NSkeleton, NAlert, NPageHeader } from 'naive-ui';
import { useAuthStore } from '@/stores/auth';
import { useNodeStatusStore } from '@/stores/nodeStatus';
import { httpClient } from '@/services/http/HttpClient';

const authStore = useAuthStore();
const nodeStatusStore = useNodeStatusStore();

const stats = ref({
  subscriptions: 0,
  nodes: 0,
  profiles: 0,
});

const logSummary = ref({
  todayAccess: 0,
  weeklyUniqueIps: 0,
});

const loading = ref(true);
const error = ref<string | null>(null);

interface IStatsData {
  subscriptions: number;
  nodes: number;
  profiles: number;
}

interface IStatsApiResponse {
  success: boolean;
  data?: IStatsData;
  message?: string;
}

interface ILogSummaryApiResponse {
  success: boolean;
  data?: {
    todayAccess: number;
    weeklyUniqueIps: number;
  };
  message?: string;
}

const onlineNodes = computed(() => Object.values(nodeStatusStore.statuses).filter((s: any) => s.status === 'healthy').length);
const offlineNodes = computed(() => stats.value.nodes - onlineNodes.value);


onMounted(async () => {
  loading.value = true;
  try {
    const [statsResponse, logSummaryResponse] = await Promise.all([
      httpClient.get<IStatsApiResponse>('/stats'),
      httpClient.get<ILogSummaryApiResponse>('/admin/logs/summary')
    ]);

    if (statsResponse.success && statsResponse.data) {
      stats.value = statsResponse.data as any;
    } else {
      throw new Error(statsResponse.message || 'Failed to fetch stats');
    }

    if (logSummaryResponse.success && logSummaryResponse.data) {
      logSummary.value = logSummaryResponse.data as any;
    } else {
      // Non-critical, so just log it
      console.error('Failed to fetch log summary:', logSummaryResponse.message);
    }

  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }

  // Fetch node statuses if not already fetched
  // Note: This requires specific node IDs to fetch
  // if (Object.keys(nodeStatusStore.statuses).length === 0) {
  //   await nodeStatusStore.fetchStatuses([]);
  // }
});
</script>

<template>
  <div>
    <n-page-header>
        <template #title>仪表盘</template>
        <template #subtitle>欢迎回来, {{ authStore.user?.username }}</template>
    </n-page-header>

    <div v-if="error" class="mt-4">
      <n-alert title="错误" type="error">
        {{ error }}
      </n-alert>
    </div>

    <n-grid cols="1 s:2 m:4" responsive="screen" :x-gap="16" :y-gap="16" class="mt-4">
      <n-gi>
        <n-card>
          <n-skeleton v-if="loading" text :repeat="2" />
          <n-statistic v-else label="今日总访问" :value="logSummary.todayAccess" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card>
          <n-skeleton v-if="loading" text :repeat="2" />
          <n-statistic v-else label="7日独立访客" :value="logSummary.weeklyUniqueIps" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card>
          <n-skeleton v-if="loading" text :repeat="2" />
          <n-statistic v-else label="订阅数" :value="stats.subscriptions" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card>
          <n-skeleton v-if="loading" text :repeat="2" />
          <n-statistic v-else label="配置文件" :value="stats.profiles" />
        </n-card>
      </n-gi>
      <n-gi>
        <n-card>
          <n-skeleton v-if="loading" text :repeat="2" />
          <n-statistic v-else label="节点总数" :value="stats.nodes" />
        </n-card>
      </n-gi>
       <n-gi>
        <n-card>
          <n-skeleton v-if="loading" text :repeat="2" />
          <n-statistic v-else label="在线节点" :value="onlineNodes" />
        </n-card>
      </n-gi>
       <n-gi>
        <n-card>
          <n-skeleton v-if="loading" text :repeat="2" />
          <n-statistic v-else label="离线节点" :value="offlineNodes" />
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>