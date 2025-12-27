<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { NStatistic, NGrid, NGi, NCard, NSkeleton, NAlert, NPageHeader } from 'naive-ui';
import { useAuthStore } from '@/stores/auth';
import { useNodeStatusStore } from '@/stores/nodeStatus';
import { statsApi } from '@/api/stats';
import { adminApi } from '@/api/admin';

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

const onlineNodes = computed(() => Object.values(nodeStatusStore.statuses).filter(s => s.status === 'healthy').length);
const offlineNodes = computed(() => stats.value.nodes - onlineNodes.value);


onMounted(async () => {
  loading.value = true;
  try {
    const [statsResponse, logSummaryResponse] = await Promise.all([
      statsApi.fetchUserStats(),
      adminApi.fetchLogSummary() // This might fail if user is not admin, logic should handle permissions ideally
    ]);

    if (statsResponse.data.success && statsResponse.data.data) {
      // Map API response to local state structure
      const data = statsResponse.data.data;
      stats.value = {
        subscriptions: data.total_subscriptions || 0,
        nodes: data.total_nodes || 0,
        profiles: 0 // API doesn't seem to return profiles count yet?
      };
    } else {
      throw new Error('Failed to fetch stats');
    }

    // Admin endpoint might fail for non-admins, or return empty/error.
    // Assuming backend returns success=false or throws 403.
    // Client interceptor throws on 401, but maybe not 403.
    if (logSummaryResponse.data.success && logSummaryResponse.data.data) {
      logSummary.value = logSummaryResponse.data.data;
    }
  } catch (err: any) {
    // If it's a 403 for the log summary, we might want to ignore it if the user isn't admin
    // But since we catch all, we just set error. 
    // Ideally we differentiate.
    console.error('Dashboard load error:', err);
    // error.value = err.message; // Don't block the whole dashboard for partial failure logic (if designed so)
    // But for now, let's keep original behavior: any error displays alert.
    error.value = err.message || 'Failed to load dashboard data';
  } finally {
    loading.value = false;
  }

  // Fetch node statuses if not already fetched
  if (Object.keys(nodeStatusStore.statuses).length === 0) {
    await nodeStatusStore.fetchStatuses();
  }
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