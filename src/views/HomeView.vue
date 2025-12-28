<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNodeStatusStore } from '@/stores/nodeStatus';
import { statsApi } from '@/api/stats';
import { adminApi } from '@/api/admin';
import StatsCard from '@/components/ui/StatsCard.vue';
import {
  StatsChartOutline as TrendIcon,
  PeopleOutline as VisitorIcon,
  CloudDownloadOutline as SubIcon,
  DocumentTextOutline as FileIcon,
  ServerOutline as NodeIcon,
  WifiOutline as OnlineIcon,
  AlertCircleOutline as OfflineIcon
} from '@vicons/ionicons5'

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
      authStore.isAdmin ? adminApi.fetchLogSummary() : Promise.resolve({ data: { success: true, data: { todayAccess: 0, weeklyUniqueIps: 0 } } })
    ]);

    if (statsResponse.data.success && statsResponse.data.data) {
      const data = statsResponse.data.data;
      stats.value = {
        subscriptions: data.total_subscriptions || 0,
        nodes: data.total_nodes || 0,
        profiles: data.total_profiles || 0
      };
    } else {
      throw new Error('无法获取统计数据');
    }

    if (logSummaryResponse.data.success && logSummaryResponse.data.data) {
      logSummary.value = logSummaryResponse.data.data;
    }
  } catch (err: any) {
    console.error('Dashboard load error:', err);
    error.value = err.message || '无法加载仪表盘数据';
  } finally {
    loading.value = false;
  }

  if (Object.keys(nodeStatusStore.statuses).length === 0) {
    await nodeStatusStore.fetchStatuses();
  }
});
</script>

<template>
  <div class="space-y-8">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">仪表盘</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">欢迎回来, {{ authStore.user?.username }}</p>
      </div>
      <div v-if="error" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm border border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20">
        {{ error }}
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      
      <!-- Visitor Stats (Admin Only or General) -->
      <StatsCard
        title="今日访问"
        :value="logSummary.todayAccess"
        :icon="TrendIcon"
        :loading="loading"
      />
      
      <StatsCard
        title="7日独立访客"
        :value="logSummary.weeklyUniqueIps"
        :icon="VisitorIcon"
        :loading="loading"
      />

      <!-- Resource Stats -->
      <StatsCard
        title="总订阅数"
        :value="stats.subscriptions"
        :icon="SubIcon"
        :loading="loading"
      />

      <StatsCard
        title="配置档案"
        :value="stats.profiles"
        :icon="FileIcon"
        :loading="loading"
      />

      <StatsCard
        title="总节点数"
        :value="stats.nodes"
        :icon="NodeIcon"
        :loading="loading"
      />

      <!-- Node Health -->
      <StatsCard
        title="在线节点"
        :value="onlineNodes"
        :icon="OnlineIcon"
        class="border-green-100 dark:border-green-900/30"
        :class="{'text-green-600': !loading}"
        :loading="loading"
      />

      <StatsCard
        title="离线节点"
        :value="offlineNodes"
        :icon="OfflineIcon"
        class="border-red-100 dark:border-red-900/30"
        :class="{'text-red-600': !loading}"
        :loading="loading"
      />

    </div>
  </div>
</template>