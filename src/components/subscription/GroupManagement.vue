<template>
  <!-- 分组排序模态框 -->
  <n-modal
    v-model:show="showSortModalModel"
    preset="card"
    title="调整分组顺序"
    :style="{ width: isMobile ? '90vw' : '500px' }"
    :mask-closable="false"
  >
    <p class="text-gray-500 mb-4">拖动下方的分组名称来调整它们的显示顺序。</p>
    <n-list bordered>
      <draggable
        v-model="sortableGroupsModel"
        item-key="id"
        handle=".drag-handle"
      >
        <template #item="{ element: group }">
          <n-list-item>
            <div class="flex items-center">
              <n-icon class="drag-handle mr-2 cursor-move" :component="ReorderFourOutline" size="20" />
              <span>{{ group.name }}</span>
            </div>
          </n-list-item>
        </template>
      </draggable>
    </n-list>
    <template #footer>
      <n-space justify="end">
        <n-button @click="showSortModalModel = false">取消</n-button>
        <n-button type="primary" @click="handleSortSave" :loading="sortLoading">保存顺序</n-button>
      </n-space>
    </template>
  </n-modal>

  <!-- 新增分组模态框 -->
  <n-modal
    v-model:show="showAddGroupModalModel"
    preset="card"
    title="新增分组"
    style="width: 400px;"
    :mask-closable="false"
  >
    <n-form @submit.prevent="handleSaveGroup">
      <n-form-item label="分组名称" required>
        <n-input v-model:value="newGroupNameModel" placeholder="请输入分组名称" />
      </n-form-item>
      <n-form-item label="分组备注">
        <n-input
          v-model:value="newGroupDescriptionModel"
          type="textarea"
          placeholder="为分组添加一些备注信息（可选）"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </n-form-item>
      <n-space justify="end">
        <n-button @click="showAddGroupModalModel = false">取消</n-button>
        <n-button type="primary" @click="handleSaveGroup" :loading="addGroupLoading">保存</n-button>
      </n-space>
    </n-form>
  </n-modal>

  <!-- 编辑分组模态框 -->
  <n-modal
    v-model:show="showEditGroupModalModel"
    preset="card"
    title="编辑分组标签"
    style="width: 400px;"
    :mask-closable="false"
  >
    <n-form @submit.prevent="handleUpdateGroup">
      <n-form-item label="分组名称" required>
        <n-input v-model:value="editingGroupNameModel" placeholder="请输入新的分组名称" />
      </n-form-item>
      <n-form-item label="分组备注">
        <n-input
          v-model:value="editingGroupDescriptionModel"
          type="textarea"
          placeholder="为分组添加一些备注信息（可选）"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </n-form-item>
      <n-space justify="end">
        <n-button @click="showEditGroupModalModel = false">取消</n-button>
        <n-button type="primary" @click="handleUpdateGroup" :loading="editGroupLoading">保存</n-button>
      </n-space>
    </n-form>
  </n-modal>

  <!-- 分组下拉菜单 -->
  <n-dropdown
    placement="bottom-start"
    trigger="manual"
    :x="dropdownX"
    :y="dropdownY"
    :options="activeDropdownGroup ? getDropdownOptions(activeDropdownGroup) : []"
    :show="showDropdownModel"
    @select="handleGroupAction"
    @clickoutside="showDropdownModel = false"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NModal, NForm, NFormItem, NInput, NSpace, NButton,
  NList, NListItem, NIcon, NDropdown
} from 'naive-ui'
import draggable from 'vuedraggable'
import { ReorderFourOutline } from '@vicons/ionicons5'
import type { SubscriptionGroup } from '@/stores/subscriptionGroups'
import type { DropdownOption } from 'naive-ui'

interface Props {
  showSortModal?: boolean
  showAddGroupModal?: boolean
  showEditGroupModal?: boolean
  showDropdown?: boolean
  dropdownX?: number
  dropdownY?: number
  activeDropdownGroup?: SubscriptionGroup | null
  sortableGroups?: SubscriptionGroup[]
  newGroupName?: string
  newGroupDescription?: string
  editingGroupName?: string
  editingGroupDescription?: string
  sortLoading?: boolean
  addGroupLoading?: boolean
  editGroupLoading?: boolean
  isMobile?: boolean
}

interface Emits {
  (e: 'update:showSortModal', value: boolean): void
  (e: 'update:showAddGroupModal', value: boolean): void
  (e: 'update:showEditGroupModal', value: boolean): void
  (e: 'update:showDropdown', value: boolean): void
  (e: 'update:sortableGroups', value: SubscriptionGroup[]): void
  (e: 'update:newGroupName', value: string): void
  (e: 'update:newGroupDescription', value: string): void
  (e: 'update:editingGroupName', value: string): void
  (e: 'update:editingGroupDescription', value: string): void
  (e: 'saveGroup'): void
  (e: 'updateGroup'): void
  (e: 'sortSave'): void
  (e: 'groupAction', key: string): void
}

const props = withDefaults(defineProps<Props>(), {
  showSortModal: false,
  showAddGroupModal: false,
  showEditGroupModal: false,
  showDropdown: false,
  dropdownX: 0,
  dropdownY: 0,
  activeDropdownGroup: null,
  sortableGroups: () => [],
  newGroupName: '',
  newGroupDescription: '',
  editingGroupName: '',
  editingGroupDescription: '',
  sortLoading: false,
  addGroupLoading: false,
  editGroupLoading: false,
  isMobile: false
})

const emit = defineEmits<Emits>()

// 使用computed实现双向绑定
const showSortModalModel = computed({
  get: () => props.showSortModal,
  set: (value) => emit('update:showSortModal', value)
})

const showAddGroupModalModel = computed({
  get: () => props.showAddGroupModal,
  set: (value) => emit('update:showAddGroupModal', value)
})

const showEditGroupModalModel = computed({
  get: () => props.showEditGroupModal,
  set: (value) => emit('update:showEditGroupModal', value)
})

const showDropdownModel = computed({
  get: () => props.showDropdown,
  set: (value) => emit('update:showDropdown', value)
})

const sortableGroupsModel = computed({
  get: () => props.sortableGroups,
  set: (value) => emit('update:sortableGroups', value)
})

const newGroupNameModel = computed({
  get: () => props.newGroupName,
  set: (value) => emit('update:newGroupName', value)
})

const newGroupDescriptionModel = computed({
  get: () => props.newGroupDescription,
  set: (value) => emit('update:newGroupDescription', value)
})

const editingGroupNameModel = computed({
  get: () => props.editingGroupName,
  set: (value) => emit('update:editingGroupName', value)
})

const editingGroupDescriptionModel = computed({
  get: () => props.editingGroupDescription,
  set: (value) => emit('update:editingGroupDescription', value)
})

// 处理操作
const handleSaveGroup = () => emit('saveGroup')
const handleUpdateGroup = () => emit('updateGroup')
const handleSortSave = () => emit('sortSave')
const handleGroupAction = (key: string) => emit('groupAction', key)

// 获取下拉菜单选项
const getDropdownOptions = (group: SubscriptionGroup): DropdownOption[] => {
  return [
    { label: '更新本组', key: 'update-group' },
    { label: '一键去重', key: 'deduplicate-group' },
    { label: '导出订阅', key: 'export-group' },
    { label: '分组规则', key: 'group-rules' },
    { type: 'divider', key: 'd1' },
    { label: '批量替换', key: 'batch-replace-group' },
    { label: '标签编辑', key: 'rename' },
    { label: group.is_enabled ? '禁用' : '启用', key: 'toggle' },
    { type: 'divider', key: 'd2' },
    { label: '删除', key: 'delete', props: { style: 'color: red;' } }
  ]
}
</script>

<style scoped>
.drag-handle {
  cursor: move;
}
</style>