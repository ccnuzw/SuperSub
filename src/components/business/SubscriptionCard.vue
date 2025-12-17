/**
 * 订阅卡片组件
 * 用于展示订阅源的信息和状态
 */

<template>
  <div
    class="subscription-card"
    :class="{
      'subscription-card--selected': selected,
      'subscription-card--disabled': disabled
    }"
  >
    <!-- 选择框（多选模式） -->
    <div v-if="selectable" class="subscription-card__select">
      <input
        type="checkbox"
        :checked="selected"
        :disabled="disabled"
        @change="handleClickOnSelect"
        class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      />
    </div>

    <!-- 订阅状态 -->
    <div class="subscription-card__status">
      <SubscriptionStatusIndicator
        :status="subscription.status"
        :last-update="subscription.last_update"
        size="lg"
      />
    </div>

    <!-- 主要信息 -->
    <div class="subscription-card__content">
      <div class="subscription-card__header">
        <h3 class="subscription-card__name">{{ subscription.name }}</h3>
        <div class="subscription-card__badges">
          <SsBadge
            v-if="subscription.is_auto_update"
            variant="primary"
            size="sm"
          >
            自动更新
          </SsBadge>
          <SsBadge
            v-if="subscription.is_premium"
            variant="warning"
            size="sm"
          >
            高级
          </SsBadge>
        </div>
      </div>

      <!-- URL信息 -->
      <div class="subscription-card__url">
        <div class="url-info">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span class="url-text">{{ subscription.url }}</span>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="subscription-card__stats">
        <div class="stat-item">
          <span class="stat-value">{{ subscription.node_count || 0 }}</span>
          <span class="stat-label">节点</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ subscription.healthy_node_count || 0 }}</span>
          <span class="stat-label">可用</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ getProtocolCount() }}</span>
          <span class="stat-label">协议</span>
        </div>
      </div>

      <!-- 更新信息 -->
      <div class="subscription-card__update-info">
        <div class="update-time">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ formatUpdateTime(subscription.last_update) }}</span>
        </div>
        <div v-if="subscription.next_update" class="next-update">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ formatUpdateTime(subscription.next_update) }}</span>
        </div>
      </div>

      <!-- 协议分布（如果有数据） -->
      <div v-if="subscription.protocol_distribution" class="subscription-card__protocols">
        <div class="protocol-bars">
          <div
            v-for="(count, protocol) in subscription.protocol_distribution"
            :key="protocol"
            class="protocol-bar"
          >
            <span class="protocol-name">{{ protocol.toUpperCase() }}</span>
            <div class="protocol-bar-bg">
              <div
                class="protocol-bar-fill"
                :style="{ width: `${(count / (subscription.node_count || 1)) * 100}%` }"
              ></div>
            </div>
            <span class="protocol-count">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="subscription-card__actions">
      <SsButton
        variant="ghost"
        size="sm"
        @click="handleClickOnUpdate"
        :loading="updating"
        title="立即更新"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </SsButton>

      <NDropdown
        :options="actionOptions"
        placement="bottom-end"
        trigger="click"
        @select="handleSelectOnAction"
      >
        <SsButton variant="ghost" size="sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12h.01M12 19h.01M16 7h.01M8 7h.01M16 17h.01M8 17h.01" />
          </svg>
        </SsButton>
      </NDropdown>
    </div>

    <!-- 快捷操作（悬停显示） -->
    <div class="subscription-card__quick-actions">
      <SsButton
        variant="ghost"
        size="sm"
        @click="handleClickOnEdit"
        title="编辑订阅"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </SsButton>

      <SsButton
        variant="ghost"
        size="sm"
        @click="handleClickOnTest"
        title="测试连接"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </SsButton>

      <SsButton
        variant="ghost"
        size="sm"
        @click="handleClickOnCopyUrl"
        title="复制链接"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </SsButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { useMessage } from 'naive-ui';
import { NDropdown } from 'naive-ui';
import { SsButton, SsBadge } from '@/components/base';
import SubscriptionStatusIndicator from './SubscriptionStatusIndicator.vue';
import type { ISubscription } from '@/types';
import type { IStandardProps, IStandardEmits } from '@/utils/componentApiStandards';

interface IProps extends IStandardProps {
  subscription: ISubscription;
  selected?: boolean;
  selectable?: boolean;
  showActions?: boolean;
}

const props = withDefaults(defineProps<IProps>(), {
  selected: false,
  selectable: false,
  disabled: false,
  showActions: true
});

interface IEmits extends IStandardEmits {
  select: [subscriptionId: string, selected: boolean];
  update: [subscription: ISubscription];
  edit: [subscription: ISubscription];
  test: [subscription: ISubscription];
  copy: [subscription: ISubscription];
  delete: [subscription: ISubscription];
  export: [subscription: ISubscription];
}

const emit = defineEmits<IEmits>();

const message = useMessage();

// 响应式数据
const updating = ref(false);

// 计算属性
const actionOptions = computed(() => [
  {
    label: '编辑订阅',
    key: 'edit',
    icon: () => h('span', '✏️')
  },
  {
    label: '测试连接',
    key: 'test',
    icon: () => h('span', '🔗')
  },
  {
    label: '复制链接',
    key: 'copy',
    icon: () => h('span', '🔗')
  },
  {
    label: '导出节点',
    key: 'export',
    icon: () => h('span', '⬇️')
  },
  {
    type: 'divider'
  },
  {
    label: '删除订阅',
    key: 'delete',
    icon: () => h('span', '🗑️')
  }
]);

// 方法
const getProtocolCount = (): number => {
  if (!props.subscription.protocol_distribution) return 0;
  return Object.keys(props.subscription.protocol_distribution).length;
};

const formatUpdateTime = (dateString?: string): string => {
  if (!dateString) return '未知';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  } catch {
    return '未知';
  }
};

const handleClickOnSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('select', props.subscription.id, target.checked);
};

const handleClickOnUpdate = async () => {
  updating.value = true;
  try {
    emit('update', props.subscription);
    message.success('订阅更新完成');
  } finally {
    updating.value = false;
  }
};

const handleSelectOnAction = (key: string) => {
  switch (key) {
    case 'edit':
      emit('edit', props.subscription);
      break;
    case 'test':
      emit('test', props.subscription);
      break;
    case 'copy':
      emit('copy', props.subscription);
      break;
    case 'export':
      emit('export', props.subscription);
      break;
    case 'delete':
      emit('delete', props.subscription);
      break;
  }
};

const handleClickOnEdit = () => {
  emit('edit', props.subscription);
};

const handleClickOnTest = () => {
  emit('test', props.subscription);
};

const handleClickOnCopyUrl = () => {
  emit('copy', props.subscription);
};
</script>

<style scoped>
.subscription-card {
  @apply relative bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:shadow-md;
}

.subscription-card--selected {
  @apply border-primary-300 bg-primary-50;
}

.subscription-card--disabled {
  @apply opacity-60 cursor-not-allowed;
}

.subscription-card:hover .subscription-card__quick-actions {
  @apply opacity-100;
}

.subscription-card__select {
  @apply absolute top-4 left-4 z-10;
}

.subscription-card__status {
  @apply flex justify-center mb-4;
}

.subscription-card__content {
  @apply space-y-4;
}

.subscription-card__header {
  @apply flex items-center justify-between;
}

.subscription-card__name {
  @apply font-semibold text-gray-900 truncate flex-1 mr-3;
}

.subscription-card__badges {
  @apply flex space-x-2;
}

.subscription-card__url {
  @apply space-y-2;
}

.url-info {
  @apply flex items-center space-x-2 text-sm text-gray-600;
}

.url-text {
  @apply flex-1 truncate font-mono;
}

.subscription-card__stats {
  @apply grid grid-cols-3 gap-4;
}

.stat-item {
  @apply text-center;
}

.stat-value {
  @apply block text-lg font-semibold text-gray-900;
}

.stat-label {
  @apply block text-xs text-gray-500;
}

.subscription-card__update-info {
  @apply space-y-2 text-sm;
}

.update-time,
.next-update {
  @apply flex items-center space-x-2 text-gray-600;
}

.subscription-card__protocols {
  @apply space-y-2;
}

.protocol-bars {
  @apply space-y-1;
}

.protocol-bar {
  @apply flex items-center space-x-2 text-xs;
}

.protocol-name {
  @apply w-12 font-medium text-gray-700;
}

.protocol-bar-bg {
  @apply flex-1 bg-gray-200 rounded-full h-2;
}

.protocol-bar-fill {
  @apply bg-primary-500 h-2 rounded-full;
}

.protocol-count {
  @apply w-6 text-right text-gray-600;
}

.subscription-card__actions {
  @apply absolute top-4 right-4 flex space-x-2;
}

.subscription-card__quick-actions {
  @apply absolute bottom-4 right-4 opacity-0 bg-white rounded-md shadow-lg p-1 space-x-1 transition-opacity duration-200;
}

.subscription-card__quick-actions .ss-button {
  @apply text-gray-500 hover:text-gray-700;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .subscription-card__header {
    @apply flex-col items-start space-y-2;
  }

  .subscription-card__badges {
    @apply space-x-0 space-y-1 flex-col;
  }

  .subscription-card__stats {
    @apply grid-cols-3 gap-2;
  }

  .subscription-card__actions {
    @apply top-2 right-2;
  }

  .subscription-card__quick-actions {
    @apply static right-auto top-auto transform-none opacity-100 mt-3 flex justify-end space-x-2;
  }

  .protocol-bar {
    @apply space-x-1;
  }

  .protocol-name {
    @apply w-10;
  }

  .protocol-count {
    @apply w-5;
  }
}

/* 深色模式支持 */
.dark .subscription-card {
  @apply bg-gray-800 border-gray-700;
}

.dark .subscription-card--selected {
  @apply border-primary-600 bg-primary-900/20;
}

.dark .subscription-card__name {
  @apply text-gray-100;
}

.dark .url-info,
.dark .update-time,
.dark .next-update {
  @apply text-gray-400;
}

.dark .stat-value {
  @apply text-gray-100;
}

.dark .stat-label {
  @apply text-gray-500;
}

.dark .protocol-name {
  @apply text-gray-300;
}

.dark .protocol-bar-bg {
  @apply bg-gray-600;
}

.dark .protocol-count {
  @apply text-gray-400;
}

.dark .subscription-card__quick-actions {
  @apply bg-gray-700;
}

.dark .subscription-card__quick-actions .ss-button {
  @apply text-gray-400 hover:text-gray-200;
}
</style>