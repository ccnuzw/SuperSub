/**
 * 分组选择器组件
 * 用于选择和创建节点分组
 */

<template>
  <div class="group-selector">
    <n-space align="center">
      <span class="label-text">分组筛选：</span>

      <n-select
        :value="selectedGroupId"
        :options="groups"
        :loading="loading"
        placeholder="选择分组"
        clearable
        style="min-width: 200px"
        @update:value="$emit('update:selectedGroupId', $event)"
      />

      <n-dropdown
        :options="groupActions"
        placement="bottom-start"
        @select="handleGroupAction"
      >
        <n-button quaternary circle size="small">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
        </n-button>
      </n-dropdown>
    </n-space>

    <!-- 分组统计信息 -->
    <div v-if="groupStats" class="group-stats">
      <n-space size="small">
        <n-tag size="small" type="info">
          共 {{ groupStats.total }} 个节点
        </n-tag>
        <n-tag v-if="selectedGroupName" size="small" type="primary">
          {{ selectedGroupName }}: {{ groupStats.current }} 个节点
        </n-tag>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import {
  NSelect,
  NSpace,
  NButton,
  NIcon,
  NDropdown,
  NTag,
  useDialog,
  useMessage,
  type DropdownOption,
  type InputInst
} from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'

interface IProps {
  selectedGroupId: string
  groups: Array<{ label: string; value: string }>
  loading?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  loading: false
})

const emit = defineEmits<{
  'update:selectedGroupId': [groupId: string]
  'create-group': [groupName: string]
}>()

const message = useMessage()
const dialog = useDialog()

// 计算当前选中的分组名称
const selectedGroupName = computed(() => {
  if (!props.selectedGroupId) return ''
  const group = props.groups.find(g => g.value === props.selectedGroupId)
  return group?.label || ''
})

// 分组统计信息
const groupStats = computed(() => {
  // 这里可以添加统计逻辑，暂时返回 null
  return null
})

// 分组操作菜单
const groupActions: DropdownOption[] = [
  {
    label: '创建新分组',
    key: 'create',
    icon: () => h(NIcon, null, { default: () => h(AddOutline) })
  }
]

// 处理分组操作
const handleGroupAction = (key: string) => {
  switch (key) {
    case 'create':
      showCreateGroupDialog()
      break
  }
}

// 显示创建分组对话框
const showCreateGroupDialog = () => {
  let groupName = ''

  dialog.create({
    title: '创建新分组',
    content: () => {
      return h('div', { class: 'py-2' }, [
        h('p', { class: 'text-gray-600 mb-4' }, '请输入分组名称'),
        h('input', {
          ref: 'inputRef',
          type: 'text',
          placeholder: '分组名称',
          value: groupName,
          onInput: (e: any) => {
            groupName = e.target.value
          },
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              dialog.destroyAll()
              if (groupName.trim()) {
                emit('create-group', groupName.trim())
              }
            }
          },
          class: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          autofocus: true
        })
      ])
    },
    positiveText: '创建',
    negativeText: '取消',
    onPositiveClick: () => {
      if (groupName.trim()) {
        emit('create-group', groupName.trim())
        return true
      } else {
        message.warning('分组名称不能为空')
        return false
      }
    }
  })
}
</script>

<style scoped>
.group-selector {
  @apply w-full bg-white rounded-lg shadow-sm p-4;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.group-selector-content {
  @apply flex items-center justify-between;
}

.left-section {
  @apply flex items-center space-x-4;
}

.right-section {
  @apply flex items-center space-x-3;
}

.label-text {
  @apply text-sm font-medium text-gray-700 whitespace-nowrap;
}

.group-stats {
  @apply flex items-center space-x-4 text-sm text-gray-600;
}

.stat-item {
  @apply flex items-center space-x-1;
}

/* 选择器样式优化 */
:deep(.n-select) {
  min-width: 200px;
  transition: all 0.2s ease;
}

:deep(.n-select:hover) {
  transform: translateY(-1px);
}

/* 按钮动画 */
:deep(.n-button) {
  transition: all 0.2s ease;
}

:deep(.n-button:hover) {
  transform: scale(1.05);
}

/* 深色模式 */
.dark .group-selector {
  @apply bg-gray-800/90;
  border-color: rgba(75, 85, 99, 0.3);
}

.dark .label-text {
  @apply text-gray-300;
}

.dark .group-stats {
  @apply text-gray-400;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .group-selector {
    @apply p-3;
  }

  .group-selector-content {
    @apply flex-col items-start space-y-3;
  }

  .left-section {
    @apply w-full flex-col items-start space-x-0 space-y-2;
  }

  .right-section {
    @apply w-full justify-between;
  }

  :deep(.n-select) {
    @apply w-full;
    min-width: auto;
  }
}
</style>
