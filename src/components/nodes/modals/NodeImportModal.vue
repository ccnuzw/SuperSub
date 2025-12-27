<script setup lang="ts">
import { ref, watch, h } from 'vue'
import { NModal, NInput, NFormItem, NSelect, NDataTable, NSpace, NButton, NCode } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { debounce } from 'lodash-es'
import { parseNodeLinks, ParsedNode } from '@/utils/nodeParser'
import { NodeGroup } from '@/stores/groups'

const props = defineProps<{
  show: boolean
  loading: boolean
  groups: NodeGroup[]
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'import', payload: { nodes: (ParsedNode & { id: string; raw: string })[]; groupId: string | null }): void
}>()

const link = ref('')
const importGroupId = ref<string | null>(null)
const previewNodes = ref<(ParsedNode & { id: string; raw: string })[]>([])

const previewColumns: DataTableColumns<ParsedNode> = [
    {
        type: 'expand',
        renderExpand: (rowData) => {
            return h(NCode, {
                code: JSON.stringify(rowData.protocol_params, null, 2),
                language: 'json',
                class: 'my-2'
            })
        }
    },
  { title: '名称', key: 'name', ellipsis: { tooltip: true } },
  { title: '协议', key: 'protocol', width: 80 },
  { title: '服务器', key: 'server', ellipsis: { tooltip: true } },
  { title: '端口', key: 'port', width: 70 },
];

watch(link, debounce((newVal: string) => {
  if (newVal.trim()) {
    previewNodes.value = parseNodeLinks(newVal)
  } else {
    previewNodes.value = []
  }
}, 300))

watch(() => props.show, (val) => {
    if (val) {
        link.value = ''
        importGroupId.value = null
        previewNodes.value = []
    }
})

const handleImport = () => {
    emit('import', { nodes: previewNodes.value, groupId: importGroupId.value })
}
</script>

<template>
  <n-modal
    :show="show"
    @update:show="(val) => emit('update:show', val)"
    preset="card"
    title="导入节点"
    style="width: 600px; max-width: 90%;"
  >
    <n-input
      v-model:value="link"
      type="textarea"
      placeholder="粘贴订阅链接或节点链接，每行一个..."
      :autosize="{ minRows: 5, maxRows: 10 }"
    />
    <n-form-item label="导入到分组" class="mt-4">
      <n-select
        v-model:value="importGroupId"
        :options="groups.map(g => ({ label: g.name, value: g.id }))"
        placeholder="选择分组 (可选)"
        clearable
      />
    </n-form-item>
    <div class="mt-4" v-if="previewNodes.length > 0">
      <p>预览 ({{ previewNodes.length }} 个节点):</p>
      <n-data-table
        :columns="previewColumns"
        :data="previewNodes"
        :pagination="{ pageSize: 5 }"
        size="small"
        class="mt-2"
      />
    </div>
    <template #footer>
      <n-space justify="end">
        <n-button @click="emit('update:show', false)">取消</n-button>
        <n-button type="primary" @click="handleImport" :loading="loading" :disabled="previewNodes.length === 0">导入</n-button>
      </n-space>
    </template>
  </n-modal>
</template>
