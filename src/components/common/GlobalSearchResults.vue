/**
 * 全局搜索结果组件
 * 提供统一的全局搜索体验
 */

<template>
  <div class="global-search-results">
    <!-- 搜索输入框 -->
    <div class="search-input-wrapper">
      <SsInput
        v-model="searchQuery"
        placeholder="搜索节点、订阅、配置文件..."
        prefix-icon="Search"
        clearable
        class="search-input"
        ref="searchInputRef"
        @keydown.enter="handleSearch"
      />
    </div>

    <!-- 搜索状态 -->
    <div v-if="loading" class="search-loading">
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
        <span class="text-gray-600">搜索中...</span>
      </div>
    </div>

    <!-- 无结果 -->
    <div v-else-if="!hasResults && searchQuery" class="search-no-results">
      <div class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">未找到相关结果</h3>
        <p class="text-gray-500">尝试使用不同的关键词或检查拼写</p>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-else-if="hasResults" class="search-results">
      <!-- 节点结果 -->
      <div v-if="results.nodes?.length" class="result-section">
        <h4 class="result-section__title">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          节点 ({{ results.nodes.length }})
        </h4>
        <div class="result-section__content">
          <div
            v-for="node in results.nodes"
            :key="node.id"
            class="result-item"
            @click="handleNodeClick(node)"
          >
            <div class="result-item__icon">
              <div class="node-status" :class="`node-status--${node.status}`"></div>
            </div>
            <div class="result-item__content">
              <div class="result-item__title">{{ node.name }}</div>
              <div class="result-item__description">
                {{ node.protocol }} • {{ node.server }}:{{ node.port }}
              </div>
            </div>
            <div class="result-item__meta">
              <SsBadge variant="outline" size="sm">{{ node.protocol }}</SsBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- 订阅结果 -->
      <div v-if="results.subscriptions?.length" class="result-section">
        <h4 class="result-section__title">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          订阅源 ({{ results.subscriptions.length }})
        </h4>
        <div class="result-section__content">
          <div
            v-for="subscription in results.subscriptions"
            :key="subscription.id"
            class="result-item"
            @click="handleSubscriptionClick(subscription)"
          >
            <div class="result-item__icon">
              <SsStatus :status="subscription.status" size="sm" />
            </div>
            <div class="result-item__content">
              <div class="result-item__title">{{ subscription.name }}</div>
              <div class="result-item__description">
                {{ subscription.node_count }} 个节点 • 更新于 {{ formatDate(subscription.updated_at) }}
              </div>
            </div>
            <div class="result-item__meta">
              <SsBadge
                :variant="subscription.status === 'healthy' ? 'success' : 'error'"
                size="sm"
              >
                {{ subscription.status === 'healthy' ? '正常' : '异常' }}
              </SsBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- 配置文件结果 -->
      <div v-if="results.profiles?.length" class="result-section">
        <h4 class="result-section__title">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          配置文件 ({{ results.profiles.length }})
        </h4>
        <div class="result-section__content">
          <div
            v-for="profile in results.profiles"
            :key="profile.id"
            class="result-item"
            @click="handleProfileClick(profile)"
          >
            <div class="result-item__icon">
              <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="result-item__content">
              <div class="result-item__title">{{ profile.name }}</div>
              <div class="result-item__description">
                {{ profile.generation_mode === 'local' ? '本地生成' : '远程生成' }} •
                {{ profile.subscription_count + profile.node_count }} 个节点
              </div>
            </div>
            <div class="result-item__meta">
              <SsBadge
                :variant="profile.generation_mode === 'local' ? 'primary' : 'secondary'"
                size="sm"
              >
                {{ profile.generation_mode === 'local' ? '本地' : '远程' }}
              </SsBadge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索建议 -->
    <div v-if="!searchQuery" class="search-suggestions">
      <h4 class="result-section__title">快速访问</h4>
      <div class="suggestions-grid">
        <div
          v-for="suggestion in quickAccessSuggestions"
          :key="suggestion.key"
          class="suggestion-item"
          @click="handleSuggestionClick(suggestion)"
        >
          <component :is="suggestion.icon" class="w-4 h-4" />
          <span>{{ suggestion.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { SsInput, SsBadge, SsStatus } from '@/components/base';
import {
  HardwareChipOutline as NodeIcon,
  CloudDownloadOutline as SubscriptionIcon,
  DocumentTextOutline as ProfileIcon,
  SettingsOutline as SettingsIcon,
  AnalyticsOutline as DashboardIcon,
} from '@vicons/ionicons5';

interface Props {
  query: string;
}

const props = defineProps<{
  query: string;
}>();

const emit = defineEmits<{
  resultClick: [result: any];
  close: [];
}>();

const router = useRouter();

// 响应式数据
const searchQuery = ref('');
const loading = ref(false);
const results = ref<{
  nodes?: any[];
  subscriptions?: any[];
  profiles?: any[];
}>({});

const searchInputRef = ref();

// 计算属性
const hasResults = computed(() => {
  return Object.values(results.value).some(arr => arr && arr.length > 0);
});

// 快速访问建议
const quickAccessSuggestions = [
  { key: 'dashboard', label: '仪表板', icon: DashboardIcon, route: { name: 'home' } },
  { key: 'nodes', label: '节点管理', icon: NodeIcon, route: { name: 'nodes' } },
  { key: 'subscriptions', label: '订阅管理', icon: SubscriptionIcon, route: { name: 'subscriptions' } },
  { key: 'profiles', label: '配置文件', icon: ProfileIcon, route: { name: 'profiles' } },
  { key: 'settings', label: '系统设置', icon: SettingsIcon, route: { name: 'settings' } },
];

// 方法
const performSearch = async (query: string) => {
  if (!query.trim()) {
    results.value = {};
    return;
  }

  loading.value = true;

  try {
    // 模拟搜索API调用
    await new Promise(resolve => setTimeout(resolve, 500));

    // 模拟搜索结果
    results.value = {
      nodes: [
        {
          id: '1',
          name: '香港节点-1',
          protocol: 'vmess',
          server: 'hk1.example.com',
          port: 443,
          status: 'healthy'
        },
        {
          id: '2',
          name: '美国节点-1',
          protocol: 'trojan',
          server: 'us1.example.com',
          port: 443,
          status: 'unhealthy'
        }
      ].filter(node =>
        node.name.toLowerCase().includes(query.toLowerCase()) ||
        node.server.toLowerCase().includes(query.toLowerCase())
      ),
      subscriptions: [
        {
          id: '1',
          name: '主要订阅',
          node_count: 150,
          status: 'healthy',
          updated_at: '2024-01-15T10:30:00Z'
        }
      ].filter(sub =>
        sub.name.toLowerCase().includes(query.toLowerCase())
      ),
      profiles: [
        {
          id: '1',
          name: '主要配置',
          generation_mode: 'local',
          subscription_count: 2,
          node_count: 10
        }
      ].filter(profile =>
        profile.name.toLowerCase().includes(query.toLowerCase())
      )
    };
  } catch (error) {
    console.error('Search failed:', error);
    results.value = {};
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  performSearch(searchQuery.value);
};

const handleNodeClick = (node: any) => {
  emit('resultClick', { type: 'node', data: node });
  emit('close');
};

const handleSubscriptionClick = (subscription: any) => {
  emit('resultClick', { type: 'subscription', data: subscription });
  emit('close');
};

const handleProfileClick = (profile: any) => {
  emit('resultClick', { type: 'profile', data: profile });
  emit('close');
};

const handleSuggestionClick = (suggestion: any) => {
  router.push(suggestion.route);
  emit('close');
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return hours === 0 ? '刚刚' : `${hours}小时前`;
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  } catch {
    return dateString;
  }
};

// 监听器
watch(() => props.query, (newQuery) => {
  searchQuery.value = newQuery;
});

watch(searchQuery, (newQuery) => {
  performSearch(newQuery);
});

// 生命周期
onMounted(() => {
  // 聚焦搜索框
  nextTick(() => {
    searchInputRef.value?.focus();
  });
});
</script>

<style scoped>
.global-search-results {
  @apply space-y-4 max-h-96 overflow-y-auto;
}

.search-input-wrapper {
  @apply sticky top-0 bg-white z-10 pb-4 border-b border-gray-100;
}

.search-input {
  @apply w-full;
}

.search-loading {
  @apply py-4;
}

.search-no-results {
  @apply py-4;
}

.search-results {
  @apply space-y-6;
}

.result-section {
  @apply space-y-3;
}

.result-section__title {
  @apply flex items-center space-x-2 text-sm font-semibold text-gray-700 px-2;
}

.result-section__content {
  @apply space-y-1;
}

.result-item {
  @apply flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-150;
}

.result-item__icon {
  @apply flex-shrink-0;
}

.node-status {
  @apply w-2 h-2 rounded-full;
}

.node-status--healthy {
  @apply bg-green-500;
}

.node-status--unhealthy {
  @apply bg-red-500;
}

.node-status--unknown {
  @apply bg-gray-400;
}

.result-item__content {
  @apply flex-1 min-w-0;
}

.result-item__title {
  @apply font-medium text-gray-900 truncate;
}

.result-item__description {
  @apply text-sm text-gray-500 truncate;
}

.result-item__meta {
  @apply flex-shrink-0;
}

.search-suggestions {
  @apply space-y-3;
}

.suggestions-grid {
  @apply grid grid-cols-2 gap-2;
}

.suggestion-item {
  @apply flex items-center space-x-2 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-150;
}

.suggestion-item svg {
  @apply text-gray-500;
}

/* 滚动条样式 */
.global-search-results::-webkit-scrollbar {
  @apply w-2;
}

.global-search-results::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

.global-search-results::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded;
}

.global-search-results::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}

/* 深色模式支持 */
.dark .search-input-wrapper {
  @apply bg-gray-800 border-gray-700;
}

.dark .result-item {
  @apply hover:bg-gray-700;
}

.dark .result-section__title {
  @apply text-gray-300;
}

.dark .result-item__title {
  @apply text-gray-100;
}

.dark .result-item__description {
  @apply text-gray-400;
}

.dark .suggestion-item {
  @apply hover:bg-gray-700;
}
</style>