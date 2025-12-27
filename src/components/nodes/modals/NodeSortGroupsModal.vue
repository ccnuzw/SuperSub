<script setup lang="ts">
import { ref, watch } from 'vue'
import { NModal, NList, NListItem, NSpace, NButton, NIcon } from 'naive-ui'
import draggable from 'vuedraggable'
import { ReorderFourOutline as DragHandleIcon } from '@vicons/ionicons5'
import type { NodeGroup } from '@/stores/groups'

const props = defineProps<{
    show: boolean
    loading: boolean
    groups: NodeGroup[]
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'save', sortedIds: string[]): void
}>()

const localGroups = ref<NodeGroup[]>([])

watch(() => props.show, (val) => {
    if (val) {
        localGroups.value = [...props.groups]
    }
})

const handleSave = () => {
    emit('save', localGroups.value.map(g => g.id))
}
</script>

<template>
    <n-modal
      :show="show"
      @update:show="(val) => emit('update:show', val)"
      preset="card"
      title="调整分组顺序"
      style="width: 500px;"
      :mask-closable="false"
    >
      <p class="text-gray-500 mb-4">拖动下方的分组名称来调整它们的显示顺序。</p>
      <n-list bordered>
        <draggable
          v-model="localGroups"
          item-key="id"
          handle=".drag-handle"
        >
          <template #item="{ element: group }">
            <n-list-item>
              <div class="flex items-center">
                <n-icon class="drag-handle mr-2 cursor-move" :component="DragHandleIcon" size="20" />
                <span>{{ group.name }}</span>
              </div>
            </n-list-item>
          </template>
        </draggable>
      </n-list>
      <template #footer>
        <n-space justify="end">
          <n-button @click="emit('update:show', false)">取消</n-button>
          <n-button type="primary" @click="handleSave" :loading="loading">保存顺序</n-button>
        </n-space>
      </template>
    </n-modal>
</template>
