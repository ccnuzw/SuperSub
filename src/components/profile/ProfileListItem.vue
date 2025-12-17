/**
 * 配置文件列表项组件
 * 单个配置文件的展示和操作
 */

<template>
  <div
    class="profile-item"
    :class="{ 'profile-item--selected': selected }"
  >
    <div class="profile-item__content">
      <!-- 选择框 -->
      <div class="profile-item__select">
        <input
          type="checkbox"
          :checked="selected"
          @change="handleSelect"
          class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
      </div>

      <!-- 基本信息 -->
      <div class="profile-item__info">
        <div class="profile-item__header">
          <div class="profile-item__title">
            <h3 class="profile-item__name">{{ profile.name }}</h3>
            <SsBadge
              :variant="profile.generation_mode === 'local' ? 'primary' : 'secondary'"
              size="sm"
            >
              {{ profile.generation_mode === 'local' ? '本地生成' : '远程生成' }}
            </SsBadge>
          </div>

          <div v-if="profile.alias" class="profile-item__alias">
            <code class="profile-item__alias-code">{{ profile.alias }}</code>
          </div>
        </div>

        <!-- 配置URL -->
        <div v-if="profile.alias && subToken" class="profile-item__url">
          <span class="profile-item__url-text">
            {{ generateProfileUrl() }}
          </span>
        </div>
      </div>

      <!-- 状态信息 -->
      <div class="profile-item__status">
        <div class="profile-item__stats">
          <div class="stat-item">
            <span class="stat-label">订阅:</span>
            <span class="stat-value">{{ subscriptionCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">节点:</span>
            <span class="stat-value">{{ nodeCount }}</span>
          </div>
        </div>

        <div class="profile-item__dates">
          <div class="date-item">
            <span class="date-label">创建:</span>
            <span class="date-value">{{ formatDate(profile.created_at) }}</span>
          </div>
          <div class="date-item">
            <span class="date-label">更新:</span>
            <span class="date-value">{{ formatDate(profile.updated_at) }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="profile-item__actions">
        <!-- 更多操作下拉菜单 -->
        <NDropdown
          :options="actionOptions"
          placement="bottom-end"
          @select="handleAction"
        >
          <SsButton variant="ghost" size="sm">
            更多操作
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12h.01M12 19h.01M16 7h.01M8 7h.01M16 17h.01M8 17h.01" />
            </svg>
          </SsButton>
        </NDropdown>
      </div>
    </div>

    <!-- 快捷操作栏（悬停时显示） -->
    <div class="profile-item__quick-actions">
      <SsButton
        variant="ghost"
        size="sm"
        @click="handlePreview"
        title="预览配置"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 6z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7" />
        </svg>
      </SsButton>

      <SsButton
        variant="ghost"
        size="sm"
        @click="handleCopyUrl"
        title="复制链接"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2M8 12a2 2 0 002 2h8a2 2 0 002-2M16 6h-2a2 2 0 00-2-2h-4a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002 2h2" />
        </svg>
      </SsButton>

      <SsButton
        variant="ghost"
        size="sm"
        @click="handleEdit"
        title="编辑配置"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5h-1v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10l1 1m3-4l1 1m0-4l1 1m-5-4l1 1" />
        </svg>
      </SsButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { NDropdown, useMessage } from 'naive-ui';
import { SsButton, SsBadge } from '@/components/base';
import { useClipboard } from '@/composables/common/useClipboard';
import type { Profile } from '@/types';

const message = useMessage();

interface Props {
  // 配置数据
  profile: Profile;
  // 是否选中
  selected: boolean;
  // 订阅令牌
  subToken: string;
  // 订阅数量
  subscriptionCount?: number;
  // 节点数量
  nodeCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  subscriptionCount: 0,
  nodeCount: 0
});

const emit = defineEmits<{
  select: [profileId: string, selected: boolean];
  preview: [profile: Profile];
  edit: [profile: Profile];
  duplicate: [profile: Profile];
  delete: [profile: Profile];
  'copy-url': [profile: Profile];
  export: [profile: Profile];
}>();

const { copy } = useClipboard();

// 计算属性
const actionOptions = computed(() => [
  {
    label: '预览配置',
    key: 'preview',
    icon: () => h('span', '👁️')
  },
  {
    label: '复制链接',
    key: 'copy-url',
    icon: () => h('span', '🔗')
  },
  {
    label: '编辑配置',
    key: 'edit',
    icon: () => h('span', '✏️')
  },
  {
    label: '复制配置',
    key: 'duplicate',
    icon: () => h('span', '📋')
  },
  {
    label: '导出配置',
    key: 'export',
    icon: () => h('span', '⬇️')
  },
  {
    label: '删除配置',
    key: 'delete',
    icon: () => h('span', '🗑️')
  }
]);

// 方法
const generateProfileUrl = (): string => {
  if (!props.profile.alias || !props.subToken) {
    return '';
  }
  return `${window.location.origin}/api/public/${props.subToken}/${props.profile.alias}`;
};

const handleSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('select', props.profile.id, target.checked);
};

const handleAction = (key: string) => {
  switch (key) {
    case 'preview':
      emit('preview', props.profile);
      break;
    case 'copy-url':
      handleCopyUrl();
      break;
    case 'edit':
      emit('edit', props.profile);
      break;
    case 'duplicate':
      emit('duplicate', props.profile);
      break;
    case 'export':
      emit('export', props.profile);
      break;
    case 'delete':
      handleDelete();
      break;
  }
};

const handlePreview = () => {
  emit('preview', props.profile);
};

const handleCopyUrl = () => {
  handleCopy();
};

const handleEdit = () => {
  emit('edit', props.profile);
};

const handleCopy = async () => {
  const url = generateProfileUrl();
  if (url) {
    await copy(url);
    emit('copy-url', props.profile);
  }
};

const handleDelete = async () => {
  try {
    // 这里应该调用API删除配置
    // await api.delete(`/profiles/${props.profile.id}`);
    message.success('配置删除成功');
    emit('delete', props.profile);
  } catch (error) {
    message.error('删除配置失败');
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
};
</script>

<style scoped>
.profile-item {
  @apply relative bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:shadow-md;
}

.profile-item--selected {
  @apply border-primary-300 bg-primary-50;
}

.profile-item:hover .profile-item__quick-actions {
  @apply opacity-100;
}

.profile-item__content {
  @apply flex items-center space-x-4;
}

.profile-item__select {
  @apply flex-shrink-0;
}

.profile-item__info {
  @apply flex-1 min-w-0;
}

.profile-item__header {
  @apply flex items-center space-x-2 mb-2;
}

.profile-item__name {
  @apply font-semibold text-gray-900 truncate;
}

.profile-item__alias {
  @apply text-sm text-gray-500;
}

.profile-item__alias-code {
  @apply bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-600;
}

.profile-item__url {
  @apply text-sm text-gray-500 truncate mb-2;
}

.profile-item__url-text {
  @apply font-mono;
}

.profile-item__status {
  @apply flex-shrink-0 space-y-2 text-sm;
}

.profile-item__stats {
  @apply space-x-4 flex items-center;
}

.stat-item {
  @apply flex items-center space-x-1;
}

.stat-label {
  @apply text-gray-500;
}

.stat-value {
  @apply font-medium text-gray-900;
}

.profile-item__dates {
  @apply space-x-4 text-xs text-gray-500;
}

.date-item {
  @apply flex items-center space-x-1;
}

.date-label {
  @apply text-gray-500;
}

.date-value {
  @apply text-gray-700;
}

.profile-item__actions {
  @apply flex-shrink-0;
}

.profile-item__quick-actions {
  @apply absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 bg-white rounded-md shadow-lg p-1 space-x-1 transition-opacity duration-200;
}

.profile-item__quick-actions .ss-button {
  @apply text-gray-500 hover:text-gray-700;
}

/* 动画效果 */
.profile-item {
  transform: translateY(0);
  transition: all 0.2s ease-in-out;
}

.profile-item:hover {
  transform: translateY(-1px);
}

/* 选中状态高亮 */
.profile-item--selected {
  border-color: theme('colors.primary.500');
  background-color: theme('colors.primary.50');
}

/* 响应式布局 */
@media (max-width: 768px) {
  .profile-item__content {
    @apply flex-col items-start space-x-0 space-y-2;
  }

  .profile-item__status {
    @apply flex-col items-start space-x-0 space-y-1;
    width: 100%;
  }

  .profile-item__stats {
    @apply flex-col items-start space-x-0 space-y-1;
  }

  .profile-item__dates {
    @apply flex-col items-start space-x-0 space-y-1;
  }

  .profile-item__actions {
    @apply w-full flex justify-end mt-2;
  }

  .profile-item__quick-actions {
    @apply static right-auto top-auto transform-none opacity-100;
    @apply mt-2 p-2 rounded-md;
    @apply border border-gray-200;
  }
}

/* 徽章链接样式 */
.profile-item__url-text {
  @apply text-xs break-all;
  word-break: break-all;
}

/* 状态指示器样式优化 */
.stat-value {
  @apply font-semibold;
}

/* 快捷按钮布局优化 */
.profile-item__quick-actions .ss-button {
  @apply p-2;
}

/* 卡片阴影效果 */
.profile-item {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.profile-item:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* 复选框样式优化 */
input[type="checkbox"]:checked {
  @apply bg-primary-600 border-primary-600;
}

/* 徽章链接交互效果 */
.profile-item__url {
  @apply cursor-text select-text bg-gray-50 px-2 py-1 rounded transition-colors duration-150 hover:bg-gray-100;
}

/* 状态标签样式 */
.profile-item__badge {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium;
}

/* 操作图标 */
.action-icon {
  @apply w-4 h-4;
}

/* 列表项之间的间距 */
.profile-item + .profile-item {
  @apply mt-2;
}
</style>