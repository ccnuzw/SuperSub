/**
 * 可排序节点表格组件
 * 支持拖拽排序的表格视图
 */

<template>
  <div class="sortable-node-table-container">
    <!-- 排序模式提示栏 -->
    <div class="sorting-info-bar">
      <div class="sorting-info-content">
        <n-icon :component="InformationCircleOutline" class="info-icon" />
        <span class="info-text">拖拽行来调整节点顺序，点击"保存排序"应用更改</span>
      </div>
      <div class="sorting-actions">
        <n-button
          type="success"
          size="small"
          @click="handleSaveOrder"
          :disabled="!orderChanged"
          :loading="saveLoading"
        >
          保存排序
        </n-button>
        <n-button
          size="small"
          @click="handleCancelSort"
        >
          取消
        </n-button>
      </div>
    </div>

    <!-- 可排序表格 -->
    <div class="n-data-table" :class="{ 'n-data-table--loading': loading }">
      <div class="n-data-table-wrapper">
        <table class="n-data-table-table n-data-table-table--bordered n-data-table-table--single-line">
          <thead class="n-data-table-thead">
            <tr class="n-data-table-tr">
              <th class="n-data-table-th drag-handle-header">排序</th>
              <th class="n-data-table-th">名称</th>
              <th class="n-data-table-th">服务器</th>
              <th class="n-data-table-th">端口</th>
              <th class="n-data-table-th">类型</th>
            </tr>
          </thead>
          <draggable
            :list="localNodes"
            item-key="id"
            tag="tbody"
            handle=".drag-handle"
            class="n-data-table-tbody"
            ghost-class="sortable-ghost"
            @end="handleDragEnd"
          >
            <template #item="{ element: node }">
              <tr class="n-data-table-tr" :key="node.id" v-if="filteredNodeIds.has(node.id)">
                <td class="n-data-table-td drag-handle">
                  <n-icon :component="ReorderFourOutline" :size="20" />
                </td>
                <td class="n-data-table-td">{{ node.name }}</td>
                <td class="n-data-table-td">{{ node.server }}</td>
                <td class="n-data-table-td">{{ node.port }}</td>
                <td class="n-data-table-td">
                  <n-tag size="small" :type="getProtocolTagType(node.protocol)">
                    {{ (node.protocol || node.type || 'N/A').toUpperCase() }}
                  </n-tag>
                </td>
              </tr>
            </template>
          </draggable>
        </table>
      </div>
      <div v-if="loading" class="n-data-table-loading-wrapper">
        <div class="n-data-table-loading-cover">
          <n-spin size="medium" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NButton, NIcon, NTag, NSpin } from 'naive-ui'
import {
  ReorderFourOutline,
  InformationCircleOutline
} from '@vicons/ionicons5'
import draggable from 'vuedraggable'
import type { INode } from '@/types'

interface IProps {
  nodes: INode[]
  loading?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  loading: false
})

const emit = defineEmits<{
  'save-order': [nodeIds: string[]]
  'cancel': []
}>()

// 本地节点列表（用于拖拽排序）
const localNodes = ref<INode[]>([...props.nodes])
const orderChanged = ref(false)
const saveLoading = ref(false)

// 过滤后的节点ID集合（用于显示）
const filteredNodeIds = computed(() => {
  return new Set(props.nodes.map(n => n.id))
})

// 监听外部节点变化，同步到本地
watch(() => props.nodes, (newNodes) => {
  localNodes.value = [...newNodes]
  orderChanged.value = false
}, { deep: true })

// 获取协议标签类型
const getProtocolTagType = (protocol: string): 'info' | 'success' | 'warning' | 'error' | 'default' => {
  const typeMap: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
    vmess: 'info',
    vless: 'success',
    trojan: 'warning',
    shadowsocks: 'error',
    ss: 'error',
    socks5: 'default',
    http: 'default',
    https: 'default'
  }
  return typeMap[protocol] || 'default'
}

// 拖拽结束处理
const handleDragEnd = () => {
  orderChanged.value = true
}

// 保存排序
const handleSaveOrder = () => {
  const nodeIds = localNodes.value
    .filter(node => filteredNodeIds.value.has(node.id))
    .map(node => node.id)

  emit('save-order', nodeIds)
}

// 取消排序
const handleCancelSort = () => {
  localNodes.value = [...props.nodes]
  orderChanged.value = false
  emit('cancel')
}
</script>

<style scoped>
.sortable-node-table-container {
  @apply bg-white rounded-lg shadow-sm;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 排序提示栏 */
.sorting-info-bar {
  @apply flex items-center justify-between px-4 py-3 bg-yellow-50 border-b border-yellow-200;
}

.sorting-info-content {
  @apply flex items-center space-x-2;
}

.info-icon {
  @apply text-yellow-600;
  flex-shrink: 0;
}

.info-text {
  @apply text-sm text-yellow-800 font-medium;
}

.sorting-actions {
  @apply flex items-center space-x-2;
}

/* 表格样式 */
.n-data-table {
  position: relative;
}

.n-data-table-wrapper {
  overflow-x: auto;
}

.n-data-table-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--n-td-color);
}

.n-data-table-thead .n-data-table-tr {
  background: var(--n-th-color);
}

.n-data-table-th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: var(--n-th-text-color);
  border-bottom: 1px solid var(--n-td-color-modal);
}

.drag-handle-header {
  width: 60px;
  text-align: center !important;
}

.n-data-table-tbody .n-data-table-tr {
  transition: background-color 0.2s;
}

.n-data-table-tbody .n-data-table-tr:hover {
  background-color: var(--n-td-color-hover);
}

.n-data-table-td {
  padding: 12px;
  border-bottom: 1px solid var(--n-td-color-modal);
}

.drag-handle {
  width: 60px;
  text-align: center;
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-handle:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

/* 拖拽中的样式 */
.sortable-ghost {
  opacity: 0.4;
  background-color: #63e2b7 !important;
}

/* 加载状态 */
.n-data-table--loading .n-data-table-wrapper {
  opacity: 0.5;
  pointer-events: none;
}

.n-data-table-loading-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.n-data-table-loading-cover {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 深色模式 */
.dark .sortable-node-table-container {
  @apply bg-gray-800;
  border-color: rgba(75, 85, 99, 0.3);
}

.dark .sorting-info-bar {
  @apply bg-yellow-900/20 border-yellow-800;
}

.dark .info-icon {
  @apply text-yellow-500;
}

.dark .info-text {
  @apply text-yellow-400;
}
</style>
