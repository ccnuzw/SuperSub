/**
 * 节点分组管理器组件
 * 提供完整的分组管理功能
 */

<template>
  <div class="group-manager">
    <!-- 分组选择器 -->
    <div class="group-selector-section">
      <n-space align="center" class="w-full">
        <span class="selector-label">分组筛选：</span>

        <n-select
          :value="selectedGroupId"
          :options="groupOptions"
          :loading="loading"
          placeholder="选择分组"
          clearable
          class="flex-1 max-w-xs"
          @update:value="handleGroupChange"
        />

        <n-button
          type="primary"
          size="small"
          @click="showCreateModal"
        >
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          新建分组
        </n-button>

        <n-dropdown
          :options="groupActions"
          placement="bottom-end"
          @select="handleGroupAction"
        >
          <n-button quaternary size="small">
            <template #icon>
              <n-icon><EllipsisVerticalOutline /></n-icon>
            </template>
          </n-button>
        </n-dropdown>
      </n-space>
    </div>

    <!-- 分组统计信息 -->
    <div v-if="showStats" class="group-stats">
      <n-space size="small">
        <n-tag size="small" type="info">
          总计 {{ totalNodes }} 个节点
        </n-tag>
        <n-tag v-if="selectedGroupName" size="small" type="primary">
          {{ selectedGroupName }}: {{ selectedGroupNodes }} 个节点
        </n-tag>
        <n-tag v-if="enabledGroupsCount > 0" size="small" type="success">
          {{ enabledGroupsCount }} 个启用分组
        </n-tag>
        <n-tag v-if="disabledGroupsCount > 0" size="small" type="warning">
          {{ disabledGroupsCount }} 个禁用分组
        </n-tag>
      </n-space>
    </div>

    <!-- 分组列表视图（可选） -->
    <div v-if="showGroupList" class="group-list-section">
      <n-collapse>
        <n-collapse-item title="分组管理" name="groups">
          <div class="group-list">
            <!-- 搜索栏 -->
            <div class="search-bar">
              <n-input
                v-model:value="searchQuery"
                placeholder="搜索分组..."
                clearable
                class="max-w-md"
              >
                <template #prefix>
                  <n-icon><SearchOutline /></n-icon>
                </template>
              </n-input>
            </div>

            <!-- 分组网格 -->
            <div v-if="filteredGroups.length > 0" class="group-grid">
              <div
                v-for="group in filteredGroups"
                :key="group.id"
                class="group-card"
                :class="{
                  'selected': selectedGroupId === group.id,
                  'disabled': group.is_enabled === false
                }"
                @click="handleGroupCardClick(group)"
              >
                <div class="group-header">
                  <div class="group-info">
                    <h4 class="group-name">{{ group.name }}</h4>
                    <p v-if="group.description" class="group-description">
                      {{ group.description }}
                    </p>
                  </div>
                  <div class="group-actions">
                    <n-dropdown
                      :options="getGroupCardActions(group)"
                      placement="bottom-end"
                      @select="(key) => handleGroupCardAction(key, group)"
                    >
                      <n-button quaternary circle size="tiny">
                        <template #icon>
                          <n-icon><EllipsisVerticalOutline /></n-icon>
                        </template>
                      </n-button>
                    </n-dropdown>
                  </div>
                </div>

                <div class="group-stats-row">
                  <div class="stat-item">
                    <span class="stat-value">{{ group.node_count || 0 }}</span>
                    <span class="stat-label">节点</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value" :class="{ 'text-danger': group.is_enabled === false }">
                      {{ group.is_enabled !== false ? '启用' : '禁用' }}
                    </span>
                    <span class="stat-label">状态</span>
                  </div>
                </div>

                <!-- 颜色标识 -->
                <div v-if="group.color" class="group-color">
                  <div
                    class="color-dot"
                    :style="{ backgroundColor: group.color }"
                  />
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <n-empty description="暂无分组" />
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>

    <!-- 创建分组模态框 -->
    <n-modal
      v-model:show="createModalVisible"
      preset="dialog"
      title="创建新分组"
      style="width: 500px"
    >
      <GroupForm
        @submit="handleCreateGroup"
        @cancel="hideCreateModal"
      />
    </n-modal>

    <!-- 编辑分组模态框 -->
    <n-modal
      v-model:show="editModalVisible"
      preset="dialog"
      title="编辑分组"
      style="width: 500px"
    >
      <GroupForm
        :group="editingGroup"
        @submit="handleUpdateGroup"
        @cancel="hideEditModal"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import {
  NSpace,
  NSelect,
  NButton,
  NIcon,
  NDropdown,
  NTag,
  NCollapse,
  NCollapseItem,
  NInput,
  NModal,
  NEmpty,
  useDialog,
  useMessage,
  type DropdownOption
} from 'naive-ui'
import {
  AddOutline,
  EllipsisVerticalOutline,
  SearchOutline,
  CreateOutline,
  TrashOutline,
  CopyOutline,
  ColorPaletteOutline,
  CheckmarkOutline,
  CloseOutline
} from '@vicons/ionicons5'
import type { INodeGroup, ICreateGroupDto, IUpdateGroupDto } from '@/types'
import { useGroupManagement } from '@/composables/useGroupManagementLogic'
import GroupForm from './GroupForm.vue'

interface IProps {
  selectedGroupId?: string | null
  showStats?: boolean
  showGroupList?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  selectedGroupId: null,
  showStats: true,
  showGroupList: false
})

const emit = defineEmits<{
  'update:selectedGroupId': [groupId: string | null]
  'group-created': [group: INodeGroup]
  'group-updated': [group: INodeGroup]
  'group-deleted': [groupId: string]
  'toggle-list': []
}>()

const message = useMessage()
const dialog = useDialog()

// 使用分组管理逻辑
const {
  groups,
  loading,
  selectedGroup,
  hasGroups,
  groupOptions,
  enabledGroups,
  disabledGroups,
  fetchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  toggleGroupEnabled,
  duplicateGroup,
  selectGroup,
  showCreateModal,
  showEditModal,
  hideCreateModal,
  hideEditModal,
  search
} = useGroupManagement()

// 本地状态
const searchQuery = ref('')
const createModalVisible = ref(false)
const editModalVisible = ref(false)
const editingGroup = ref<INodeGroup | null>(null)

// 计算属性
const totalNodes = computed(() =>
  groups.value.reduce((sum, group) => sum + (group.node_count || 0), 0)
)

const selectedGroupName = computed(() => selectedGroup.value?.name || '')

const selectedGroupNodes = computed(() => selectedGroup.value?.node_count || 0)

const enabledGroupsCount = computed(() => enabledGroups.value.length)

const disabledGroupsCount = computed(() => disabledGroups.value.length)

const filteredGroups = computed(() => {
  let filtered = groups.value

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(group =>
      group.name.toLowerCase().includes(query) ||
      (group.description && group.description.toLowerCase().includes(query))
    )
  }

  return filtered
})

// 分组操作菜单
const groupActions: DropdownOption[] = [
  {
    label: '刷新分组列表',
    key: 'refresh',
    icon: () => h(NIcon, null, { default: () => h(CheckmarkOutline) })
  },
  {
    label: '创建新分组',
    key: 'create',
    icon: () => h(NIcon, null, { default: () => h(AddOutline) })
  },
  {
    type: 'divider'
  },
  {
    label: '展开分组列表',
    key: 'toggle-list',
    icon: () => h(NIcon, null, { default: () => h(SearchOutline) })
  }
]

// 事件处理
const handleGroupChange = (groupId: string | null) => {
  selectGroup(groupId)
  emit('update:selectedGroupId', groupId)
}

const handleGroupAction = (key: string) => {
  switch (key) {
    case 'refresh':
      refreshGroups()
      break
    case 'create':
      createModalVisible.value = true
      break
    case 'toggle-list':
      // 通过emit通知父组件切换显示状态
      emit('toggle-list')
      break
  }
}

const handleGroupCardClick = (group: INodeGroup) => {
  handleGroupChange(group.id)
}

const handleGroupCardAction = async (key: string, group: INodeGroup) => {
  switch (key) {
    case 'edit':
      editingGroup.value = group
      editModalVisible.value = true
      break
    case 'delete':
      await handleDeleteGroup(group)
      break
    case 'toggle':
      await toggleGroupEnabled(group.id)
      break
    case 'duplicate':
      await handleDuplicateGroup(group)
      break
    case 'copy-id':
      await copyToClipboard(group.id)
      message.success('分组ID已复制到剪贴板')
      break
  }
}

const getGroupCardActions = (group: INodeGroup): DropdownOption[] => [
  {
    label: '编辑',
    key: 'edit',
    icon: () => h(NIcon, null, { default: () => h(CreateOutline) })
  },
  {
    label: group.is_enabled !== false ? '禁用' : '启用',
    key: 'toggle',
    icon: () => h(NIcon, null, {
      default: () => group.is_enabled !== false ? h(CloseOutline) : h(CheckmarkOutline)
    })
  },
  {
    label: '复制',
    key: 'duplicate',
    icon: () => h(NIcon, null, { default: () => h(CopyOutline) })
  },
  {
    label: '复制ID',
    key: 'copy-id',
    icon: () => h(NIcon, null, { default: () => h(ColorPaletteOutline) })
  },
  {
    type: 'divider'
  },
  {
    label: '删除',
    key: 'delete',
    icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
    props: {
      style: { color: 'var(--n-error-color)' }
    }
  }
]

const handleCreateGroup = async (groupData: ICreateGroupDto) => {
  try {
    const newGroup = await createGroup(groupData)
    emit('group-created', newGroup)
    createModalVisible.value = false
  } catch (error) {
    console.error('Create group failed:', error)
  }
}

const handleUpdateGroup = async (groupData: IUpdateGroupDto) => {
  if (!editingGroup.value) return

  try {
    const updatedGroup = await updateGroup(editingGroup.value.id, groupData)
    emit('group-updated', updatedGroup)
    editModalVisible.value = false
    editingGroup.value = null
  } catch (error) {
    console.error('Update group failed:', error)
  }
}

const handleDeleteGroup = async (group: INodeGroup) => {
  try {
    await deleteGroup(group.id)
    emit('group-deleted', group.id)
  } catch (error) {
    console.error('Delete group failed:', error)
  }
}

const handleDuplicateGroup = async (group: INodeGroup) => {
  try {
    await duplicateGroup(group.id, `${group.name} (副本)`)
  } catch (error) {
    console.error('Duplicate group failed:', error)
  }
}

const refreshGroups = async () => {
  try {
    await fetchGroups(true)
    message.success('分组列表已刷新')
  } catch (error) {
    console.error('Refresh groups failed:', error)
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error('Copy to clipboard failed:', error)
  }
}

// 搜索处理
const handleSearch = () => {
  search(searchQuery.value)
}

// 生命周期
onMounted(() => {
  fetchGroups()
})
</script>

<style scoped>
.group-manager {
  @apply space-y-4;
}

.group-selector-section {
  @apply bg-white rounded-lg shadow-sm p-4;
}

.selector-label {
  @apply text-sm font-medium text-gray-700 whitespace-nowrap;
}

.group-stats {
  @apply bg-gray-50 rounded-lg p-3;
}

.group-list-section {
  @apply bg-white rounded-lg shadow-sm;
}

.group-list {
  @apply p-4 space-y-4;
}

.search-bar {
  @apply mb-4;
}

.group-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.group-card {
  @apply bg-white border border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:shadow-md relative overflow-hidden;
}

.group-card.selected {
  @apply border-blue-500 bg-blue-50;
}

.group-card.disabled {
  @apply opacity-60 bg-gray-50;
}

.group-header {
  @apply flex justify-between items-start mb-3;
}

.group-info {
  @apply flex-1 min-w-0;
}

.group-name {
  @apply text-base font-semibold text-gray-900 truncate mb-1;
}

.group-description {
  @apply text-sm text-gray-600 line-clamp-2;
}

.group-actions {
  @apply ml-2;
}

.group-stats-row {
  @apply flex justify-between items-center;
}

.stat-item {
  @apply text-center;
}

.stat-value {
  @apply block text-lg font-semibold text-gray-900;
}

.stat-label {
  @apply block text-xs text-gray-500 mt-1;
}

.group-color {
  @apply absolute top-2 right-2;
}

.color-dot {
  @apply w-4 h-4 rounded-full border-2 border-white shadow-sm;
}

.empty-state {
  @apply py-8 text-center;
}

/* 深色模式 */
.dark .group-manager {
  @apply space-y-4;
}

.dark .group-selector-section {
  @apply bg-gray-800;
}

.dark .selector-label {
  @apply text-gray-300;
}

.dark .group-stats {
  @apply bg-gray-700;
}

.dark .group-list-section {
  @apply bg-gray-800;
}

.dark .group-card {
  @apply bg-gray-700 border-gray-600 hover:border-blue-400;
}

.dark .group-card.selected {
  @apply border-blue-500 bg-blue-900/20;
}

.dark .group-card.disabled {
  @apply bg-gray-800;
}

.dark .group-name {
  @apply text-gray-100;
}

.dark .group-description {
  @apply text-gray-400;
}

.dark .stat-value {
  @apply text-gray-100;
}

.dark .stat-label {
  @apply text-gray-400;
}
</style>