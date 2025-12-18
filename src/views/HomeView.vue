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
  <!-- 仪表板页面容器 -->
  <div class="dashboard-container">
    <!-- 页面标题区域 -->
    <div class="header-section">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <span class="title-icon">📊</span>
            仪表盘
          </h1>
          <p class="welcome-message">欢迎回来, {{ authStore.user?.username }}</p>
        </div>
      </div>
    </div>

    <!-- 错误提示区域 -->
    <div v-if="error" class="error-section">
      <n-alert title="错误" type="error" class="error-alert">
        {{ error }}
      </n-alert>
    </div>

    <!-- 统计卡片网格 -->
    <div class="stats-grid">
      <div class="stat-card access-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-label">今日总访问</div>
          <div class="stat-value">
            <n-skeleton v-if="loading" text style="width: 80px; height: 32px;" />
            <span v-else>{{ logSummary.todayAccess }}</span>
          </div>
        </div>
      </div>

      <div class="stat-card visitors-card">
        <div class="stat-icon">🌐</div>
        <div class="stat-content">
          <div class="stat-label">7日独立访客</div>
          <div class="stat-value">
            <n-skeleton v-if="loading" text style="width: 80px; height: 32px;" />
            <span v-else>{{ logSummary.weeklyUniqueIps }}</span>
          </div>
        </div>
      </div>

      <div class="stat-card subscription-card">
        <div class="stat-icon">📡</div>
        <div class="stat-content">
          <div class="stat-label">订阅数</div>
          <div class="stat-value">
            <n-skeleton v-if="loading" text style="width: 80px; height: 32px;" />
            <span v-else>{{ stats.subscriptions }}</span>
          </div>
        </div>
      </div>

      <div class="stat-card profile-card">
        <div class="stat-icon">⚙️</div>
        <div class="stat-content">
          <div class="stat-label">配置文件</div>
          <div class="stat-value">
            <n-skeleton v-if="loading" text style="width: 80px; height: 32px;" />
            <span v-else>{{ stats.profiles }}</span>
          </div>
        </div>
      </div>

      <div class="stat-card nodes-card">
        <div class="stat-icon">🖥️</div>
        <div class="stat-content">
          <div class="stat-label">节点总数</div>
          <div class="stat-value">
            <n-skeleton v-if="loading" text style="width: 80px; height: 32px;" />
            <span v-else>{{ stats.nodes }}</span>
          </div>
        </div>
      </div>

      <div class="stat-card online-card">
        <div class="stat-icon">🟢</div>
        <div class="stat-content">
          <div class="stat-label">在线节点</div>
          <div class="stat-value">
            <n-skeleton v-if="loading" text style="width: 80px; height: 32px;" />
            <span v-else>{{ onlineNodes }}</span>
          </div>
        </div>
      </div>

      <div class="stat-card offline-card">
        <div class="stat-icon">🔴</div>
        <div class="stat-content">
          <div class="stat-label">离线节点</div>
          <div class="stat-value">
            <n-skeleton v-if="loading" text style="width: 80px; height: 32px;" />
            <span v-else>{{ offlineNodes }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 仪表板容器样式 ===== */
.dashboard-container {
  @apply min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50;
  padding: 1.5rem;
}

/* ===== 页面标题区域 ===== */
.header-section {
  @apply mb-8;
}

.header-content {
  @apply flex flex-col bg-white w-full max-w-none m-0 py-6 px-6;
}

.title-section {
  @apply flex flex-col space-y-2;
}

.page-title {
  @apply text-3xl font-bold text-gray-900 flex items-center space-x-3;
  font-family: 'Inter', sans-serif;
}

.title-icon {
  @apply text-4xl;
}

.welcome-message {
  @apply text-gray-600 text-lg ml-11;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
}

/* ===== 错误提示区域 ===== */
.error-section {
  @apply mb-6 flex flex-col bg-white w-full max-w-none m-0 py-6 px-6;
}

.error-alert {
  @apply rounded-lg border-l-4 border-error-500;
}

/* ===== 统计卡片网格 ===== */
.stats-grid {
  @apply flex flex-col bg-white w-full max-w-none m-0 py-6 px-6;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  animation: fadeInUp 0.6s ease-out;
}

/* ===== 统计卡片样式 ===== */
.stat-card {
  @apply bg-white rounded-2xl p-6 shadow-sm border border-gray-100;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, var(--card-color) 0%, var(--card-color-light) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04);
}

.stat-card:hover::before {
  opacity: 1;
}

/* 卡片图标容器 */
.stat-icon {
  @apply text-3xl mb-4;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--card-color-light) 0%, var(--card-color) 100%);
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
  box-shadow: 0 8px 16px rgba(var(--card-color-rgb), 0.2);
}

/* 卡片内容 */
.stat-content {
  @apply flex flex-col space-y-2;
}

.stat-label {
  @apply text-gray-600 font-medium text-sm;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  letter-spacing: 0.025em;
}

.stat-value {
  @apply text-gray-900 font-bold text-2xl;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  line-height: 1.2;
}

.stat-value span {
  @apply block;
}

/* ===== 不同卡片类型的颜色方案 ===== */

/* 访问卡片 - 蓝色系 */
.access-card {
  --card-color: #3b82f6;
  --card-color-light: #93c5fd;
  --card-color-rgb: 59, 130, 246;
}

.access-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.15), 0 8px 16px rgba(59, 130, 246, 0.08);
}

/* 访客卡片 - 绿色系 */
.visitors-card {
  --card-color: #10b981;
  --card-color-light: #86efac;
  --card-color-rgb: 16, 185, 129;
}

.visitors-card:hover {
  border-color: #10b981;
  box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15), 0 8px 16px rgba(16, 185, 129, 0.08);
}

/* 订阅卡片 - 紫色系 */
.subscription-card {
  --card-color: #8b5cf6;
  --card-color-light: #c4b5fd;
  --card-color-rgb: 139, 92, 246;
}

.subscription-card:hover {
  border-color: #8b5cf6;
  box-shadow: 0 20px 40px rgba(139, 92, 246, 0.15), 0 8px 16px rgba(139, 92, 246, 0.08);
}

/* 配置文件卡片 - 橙色系 */
.profile-card {
  --card-color: #f59e0b;
  --card-color-light: #fcd34d;
  --card-color-rgb: 245, 158, 11;
}

.profile-card:hover {
  border-color: #f59e0b;
  box-shadow: 0 20px 40px rgba(245, 158, 11, 0.15), 0 8px 16px rgba(245, 158, 11, 0.08);
}

/* 节点卡片 - 青色系 */
.nodes-card {
  --card-color: #06b6d4;
  --card-color-light: #67e8f9;
  --card-color-rgb: 6, 182, 212;
}

.nodes-card:hover {
  border-color: #06b6d4;
  box-shadow: 0 20px 40px rgba(6, 182, 212, 0.15), 0 8px 16px rgba(6, 182, 212, 0.08);
}

/* 在线节点卡片 - 绿色系 */
.online-card {
  --card-color: #22c55e;
  --card-color-light: #86efac;
  --card-color-rgb: 34, 197, 94;
}

.online-card:hover {
  border-color: #22c55e;
  box-shadow: 0 20px 40px rgba(34, 197, 94, 0.15), 0 8px 16px rgba(34, 197, 94, 0.08);
}

/* 离线节点卡片 - 红色系 */
.offline-card {
  --card-color: #ef4444;
  --card-color-light: #fca5a5;
  --card-color-rgb: 239, 68, 68;
}

.offline-card:hover {
  border-color: #ef4444;
  box-shadow: 0 20px 40px rgba(239, 68, 68, 0.15), 0 8px 16px rgba(239, 68, 68, 0.08);
}

/* ===== 骨架屏美化 ===== */
:deep(.n-skeleton) {
  @apply rounded-lg;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s infinite;
}

/* ===== 动画效果 ===== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes skeletonShimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 卡片入场动画 - 延迟效果 */
.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }
.stat-card:nth-child(5) { animation-delay: 0.5s; }
.stat-card:nth-child(6) { animation-delay: 0.6s; }
.stat-card:nth-child(7) { animation-delay: 0.7s; }

/* ===== 响应式优化 ===== */
@media (max-width: 640px) {
  .dashboard-container {
    padding: 1rem;
  }

  .page-title {
    @apply text-2xl;
  }

  .welcome-message {
    @apply text-base;
    margin-left: 2.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-card {
    @apply p-4;
  }

  .stat-icon {
    @apply text-2xl mb-3;
    width: 48px;
    height: 48px;
  }

  .stat-value {
    @apply text-xl;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.25rem;
  }
}

@media (min-width: 1025px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.75rem;
  }

  .stat-card {
    @apply p-7;
  }
}

/* ===== 深色模式支持 ===== */
@media (prefers-color-scheme: dark) {
  .dashboard-container {
    @apply bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900;
  }

  .stat-card {
    @apply bg-gray-800 border-gray-700;
  }

  .page-title {
    @apply text-gray-100;
  }

  .welcome-message {
    @apply text-gray-400;
  }

  .stat-label {
    @apply text-gray-400;
  }

  .stat-value {
    @apply text-gray-100;
  }
}

/* ===== 微交互效果 ===== */
.stat-card:active {
  transform: translateY(-6px) scale(0.98);
  transition: transform 0.1s ease;
}

/* 加载状态的脉冲效果 */
.stat-card.loading {
  animation: cardPulse 2s ease-in-out infinite;
}

@keyframes cardPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* ===== 页面容器样式 ===== */
.page-container {
  @apply flex flex-col;
  background: #ffffff;
  width: 100%;
  max-width: none;
  margin: 0;
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .page-container {
    padding-top: 1rem;
    padding-bottom: 1rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .page-container {
    padding-top: 1.25rem;
    padding-bottom: 1.25rem;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }
}

@media (min-width: 1921px) {
  .page-container {
    padding-top: 2rem;
    padding-bottom: 2rem;
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

/* 深色模式适配 */
.dark .page-container {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
}

/* 加载动画 */
.page-container {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>