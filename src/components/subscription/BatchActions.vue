<template>
  <!-- 移动到分组模态框 -->
  <n-modal
    v-model:show="showMoveToGroupModalModel"
    preset="card"
    title="移动订阅到分组"
    style="width: 400px;"
    :mask-closable="false"
  >
    <n-form @submit.prevent="handleMoveToGroup">
      <n-form-item label="目标分组" required>
        <n-select
          v-model:value="moveToGroupIdModel"
          placeholder="请选择目标分组（可清空变为未分组）"
          :options="groups.map(g => ({ label: g.name, value: g.id }))"
          clearable
        />
      </n-form-item>
      <n-space justify="end">
        <n-button @click="showMoveToGroupModalModel = false">取消</n-button>
        <n-button type="primary" @click="handleMoveToGroup" :loading="moveToGroupLoading">确认移动</n-button>
      </n-space>
    </n-form>
  </n-modal>

  <!-- 批量替换模态框 -->
  <n-modal
    v-model:show="showBatchReplaceModalModel"
    preset="card"
    title="批量替换订阅链接"
    style="width: 600px;"
    :mask-closable="false"
  >
    <p class="mb-4">将对该分组下的 <b>{{ batchReplaceCount }}</b> 个订阅链接执行替换操作。</p>
    <n-form>
      <n-form-item label="查找内容">
        <n-input v-model:value="batchReplaceFindModel" placeholder="例如，旧的域名或参数" />
      </n-form-item>
      <n-form-item label="替换为">
        <n-input v-model:value="batchReplaceReplaceModel" placeholder="例如，新的域名或参数（可留空）" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="showBatchReplaceModalModel = false">取消</n-button>
        <n-button type="primary" @click="handleBatchReplace" :loading="batchReplaceLoading">确认替换</n-button>
      </n-space>
    </template>
  </n-modal>

  <!-- 导出分组模态框 -->
  <n-modal
    v-model:show="showExportModalModel"
    preset="card"
    :title="`导出分组 '${exportGroupName}' 的订阅`"
    style="width: 600px;"
    :mask-closable="false"
  >
    <p class="mb-2">共 {{ exportCount }} 个订阅链接：</p>
    <n-input
      v-model:value="exportUrlsModel"
      type="textarea"
      readonly
      :autosize="{ minRows: 10, maxRows: 20 }"
      placeholder="没有订阅链接"
    />
    <template #footer>
      <n-space justify="end">
        <n-button @click="showExportModalModel = false">关闭</n-button>
        <n-button type="primary" @click="handleCopyExportUrls">复制</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NModal, NForm, NFormItem, NSelect, NSpace, NButton,
  NInput
} from 'naive-ui'
import { SubscriptionGroup } from '@/stores/subscriptionGroups'

interface Props {
  showMoveToGroupModal?: boolean
  showBatchReplaceModal?: boolean
  showExportModal?: boolean
  moveToGroupId?: string | null
  moveToGroupLoading?: boolean
  batchReplaceFind?: string
  batchReplaceReplace?: string
  batchReplaceCount?: number
  batchReplaceLoading?: boolean
  exportUrls?: string
  exportGroupName?: string
  exportCount?: number
  groups?: SubscriptionGroup[]
}

interface Emits {
  (e: 'update:showMoveToGroupModal', value: boolean): void
  (e: 'update:showBatchReplaceModal', value: boolean): void
  (e: 'update:showExportModal', value: boolean): void
  (e: 'update:moveToGroupId', value: string | null): void
  (e: 'update:batchReplaceFind', value: string): void
  (e: 'update:batchReplaceReplace', value: string): void
  (e: 'update:exportUrls', value: string): void
  (e: 'moveToGroup'): void
  (e: 'batchReplace'): void
  (e: 'copyExportUrls'): void
}

const props = withDefaults(defineProps<Props>(), {
  showMoveToGroupModal: false,
  showBatchReplaceModal: false,
  showExportModal: false,
  moveToGroupId: null,
  moveToGroupLoading: false,
  batchReplaceFind: '',
  batchReplaceReplace: '',
  batchReplaceCount: 0,
  batchReplaceLoading: false,
  exportUrls: '',
  exportGroupName: '',
  exportCount: 0,
  groups: () => []
})

const emit = defineEmits<Emits>()

// 使用computed实现双向绑定
const showMoveToGroupModalModel = computed({
  get: () => props.showMoveToGroupModal,
  set: (value) => emit('update:showMoveToGroupModal', value)
})

const showBatchReplaceModalModel = computed({
  get: () => props.showBatchReplaceModal,
  set: (value) => emit('update:showBatchReplaceModal', value)
})

const showExportModalModel = computed({
  get: () => props.showExportModal,
  set: (value) => emit('update:showExportModal', value)
})

const moveToGroupIdModel = computed({
  get: () => props.moveToGroupId,
  set: (value) => emit('update:moveToGroupId', value)
})

const batchReplaceFindModel = computed({
  get: () => props.batchReplaceFind,
  set: (value) => emit('update:batchReplaceFind', value)
})

const batchReplaceReplaceModel = computed({
  get: () => props.batchReplaceReplace,
  set: (value) => emit('update:batchReplaceReplace', value)
})

const exportUrlsModel = computed({
  get: () => props.exportUrls,
  set: (value) => emit('update:exportUrls', value)
})

// 处理操作
const handleMoveToGroup = () => emit('moveToGroup')
const handleBatchReplace = () => emit('batchReplace')
const handleCopyExportUrls = () => emit('copyExportUrls')
</script>