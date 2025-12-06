<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { NStatistic, NGrid, NGi, NSkeleton, NAlert } from 'naive-ui';
import {
  Server as NodesIcon,
  Analytics as AnalyticsIcon,
  DocumentText as ProfilesIcon,
  Globe as SubscriptionIcon,
  CheckmarkCircle as OnlineIcon,
  CloseCircle as OfflineIcon,
  People as VisitorsIcon,
  Eye as EyeIcon
} from '@vicons/ionicons5';
import { useAuthStore } from '@/stores/auth';
import { useNodeStatusStore } from '@/stores/nodeStatus';
import { api } from '@/utils/api';

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

interface StatsData {
  subscriptions: number;
  nodes: number;
  profiles: number;
}

interface StatsApiResponse {
  success: boolean;
  data?: StatsData;
  message?: string;
}

interface LogSummaryApiResponse {
  success: boolean;
  data?: {
    todayAccess: number;
    weeklyUniqueIps: number;
  };
  message?: string;
}

const onlineNodes = computed(() => Object.values(nodeStatusStore.statuses).filter(s => s.status === 'healthy').length);
const offlineNodes = computed(() => stats.value.nodes - onlineNodes.value);

// 计算统计数据用于现代化统计卡片
const dashboardStats = computed(() => [
  {
    key: 'todayAccess',
    label: '今日访问',
    value: logSummary.value.todayAccess,
    icon: EyeIcon,
    type: 'primary' as const,
    trend: {
      value: 12,
      direction: 'up' as const
    }
  },
  {
    key: 'weeklyVisitors',
    label: '7日访客',
    value: logSummary.value.weeklyUniqueIps,
    icon: VisitorsIcon,
    type: 'success' as const,
    trend: {
      value: 8,
      direction: 'up' as const
    }
  },
  {
    key: 'subscriptions',
    label: '订阅总数',
    value: stats.value.subscriptions,
    icon: SubscriptionIcon,
    type: 'info' as const
  },
  {
    key: 'profiles',
    label: '配置文件',
    value: stats.value.profiles,
    icon: ProfilesIcon,
    type: 'warning' as const
  },
  {
    key: 'totalNodes',
    label: '节点总数',
    value: stats.value.nodes,
    icon: NodesIcon,
    type: 'default' as const
  },
  {
    key: 'onlineNodes',
    label: '在线节点',
    value: onlineNodes.value,
    icon: OnlineIcon,
    type: 'success' as const
  },
  {
    key: 'offlineNodes',
    label: '离线节点',
    value: offlineNodes.value,
    icon: OfflineIcon,
    type: 'error' as const
  }
]);

onMounted(async () => {
  loading.value = true;
  try {
    const [statsResponse, logSummaryResponse] = await Promise.all([
      api.get<StatsApiResponse>('/stats'),
      api.get<LogSummaryApiResponse>('/admin/logs/summary')
    ]);

    if (statsResponse.data.success && statsResponse.data.data) {
      stats.value = statsResponse.data.data;
    } else {
      throw new Error(statsResponse.data.message || 'Failed to fetch stats');
    }

    if (logSummaryResponse.data.success && logSummaryResponse.data.data) {
      logSummary.value = logSummaryResponse.data.data;
    } else {
      // Non-critical, so just log it
      console.error('Failed to fetch log summary:', logSummaryResponse.data.message);
    }

  } catch (err: any) {
    error.value = err.message;
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
  <ModernPageLayout
    title="仪表盘"
    :subtitle="`欢迎回来，${authStore.user?.username}`"
    :breadcrumb="[
      { label: 'SuperSub', href: '#' },
      { label: '仪表盘', active: true }
    ]"
    :show-stats="false"
  >
    <!-- 错误提示 -->
    <div v-if="error" class="mb-6">
      <n-alert
        title="数据加载错误"
        type="error"
        :closable="false"
        class="modern-alert"
      >
        {{ error }}
      </n-alert>
    </div>

    <!-- 统计卡片网格 -->
    <div v-if="!loading" class="modern-stats-grid">
      <div
        v-for="stat in dashboardStats"
        :key="stat.key"
        class="modern-stat-card"
        :class="`stat-card--${stat.type}`"
        @click="() => {}"
      >
        <div class="modern-stat-content">
          <div class="modern-stat-info">
            <h3 class="modern-stat-label">{{ stat.label }}</h3>
            <p class="modern-stat-value">{{ stat.value.toLocaleString() }}</p>
            <div
              v-if="stat.trend"
              class="modern-stat-trend"
              :class="{
                'trend--up': stat.trend.direction === 'up',
                'trend--down': stat.trend.direction !== 'up'
              }"
            >
              <span class="trend-value">{{ stat.trend.value }}%</span>
              <component
                :is="stat.trend.direction === 'up' ? 'ArrowUpIcon' : 'ArrowDownIcon'"
                class="trend-icon"
              />
            </div>
          </div>
          <div
            v-if="stat.icon"
            class="modern-stat-icon"
            :class="`stat-icon--${stat.type}`"
          >
            <component :is="stat.icon" />
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else class="modern-stats-grid">
      <div
        v-for="i in 7"
        :key="i"
        class="modern-stat-card loading"
      >
        <div class="modern-stat-content">
          <div class="modern-stat-info">
            <n-skeleton text height="16px" width="80px" class="mb-2" />
            <n-skeleton text height="32px" width="120px" />
          </div>
          <div class="modern-stat-icon">
            <n-skeleton circle size="medium" />
          </div>
        </div>
      </div>
    </div>

    <!-- 系统概览 -->
    <div class="mt-8">
      <ModernContentCard
        title="系统概览"
        subtitle="SuperSub代理管理系统运行状态"
        variant="elevated"
        padding="xl"
        :show-top-line="true"
      >
        <n-grid cols="1 s:2 m:3" responsive="screen" :x-gap="24" :y-gap="24">
          <n-gi>
            <div class="overview-section">
              <h4 class="overview-title">访问统计</h4>
              <div class="overview-stats">
                <div class="overview-item">
                  <span class="overview-label">今日访问</span>
                  <span class="overview-value">{{ logSummary.todayAccess.toLocaleString() }}</span>
                </div>
                <div class="overview-item">
                  <span class="overview-label">7日访客</span>
                  <span class="overview-value">{{ logSummary.weeklyUniqueIps.toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </n-gi>

          <n-gi>
            <div class="overview-section">
              <h4 class="overview-title">资源统计</h4>
              <div class="overview-stats">
                <div class="overview-item">
                  <span class="overview-label">订阅数</span>
                  <span class="overview-value">{{ stats.subscriptions }}</span>
                </div>
                <div class="overview-item">
                  <span class="overview-label">配置文件</span>
                  <span class="overview-value">{{ stats.profiles }}</span>
                </div>
              </div>
            </div>
          </n-gi>

          <n-gi>
            <div class="overview-section">
              <h4 class="overview-title">节点状态</h4>
              <div class="overview-stats">
                <div class="overview-item">
                  <span class="overview-label">在线</span>
                  <span class="overview-value online">{{ onlineNodes }}</span>
                </div>
                <div class="overview-item">
                  <span class="overview-label">离线</span>
                  <span class="overview-value offline">{{ offlineNodes }}</span>
                </div>
              </div>
            </div>
          </n-gi>
        </n-grid>
      </ModernContentCard>
    </div>
  </ModernPageLayout>
</template>

<style scoped>
/* ===== 仪表盘专用样式 ===== */
.modern-alert {
  margin-bottom: var(--spacing-xl);
  border-radius: var(--radius-lg);
}

/* 概览部分样式 */
.overview-section {
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-normal) var(--ease-out-cubic);
}

.overview-section:hover {
  background: rgba(255, 255, 255, 0.7);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.overview-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.overview-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background: var(--gradient-primary);
  border-radius: var(--radius-sm);
}

.overview-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.overview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.overview-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.overview-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.overview-value.online {
  color: var(--success);
}

.overview-value.offline {
  color: var(--error);
}

/* 统计类型样式 */
.stat-card--primary .modern-stat-icon {
  background: var(--gradient-primary);
}

.stat-card--success .modern-stat-icon {
  background: var(--gradient-success);
}

.stat-card--warning .modern-stat-icon {
  background: var(--gradient-warning);
}

.stat-card--error .modern-stat-icon {
  background: var(--gradient-error);
}

.stat-card--info .modern-stat-icon {
  background: var(--gradient-neutral);
}

.stat-card--default .modern-stat-icon {
  background: var(--gradient-primary);
}

/* 加载状态样式 */
.modern-stat-card.loading {
  pointer-events: none;
}

.modern-stat-card.loading .modern-stat-icon {
  background: var(--bg-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .overview-section {
    padding: var(--spacing-md);
  }

  .overview-title {
    font-size: 0.875rem;
  }

  .overview-value {
    font-size: 1rem;
  }
}

/* 深色主题 */
.dark .overview-section {
  background: rgba(24, 24, 28, 0.6);
  border-color: var(--border-primary);
}

.dark .overview-section:hover {
  background: rgba(24, 24, 28, 0.8);
}
</style>