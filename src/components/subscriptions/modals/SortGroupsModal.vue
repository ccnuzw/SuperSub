<script setup lang="ts">
import { ref, watch } from 'vue'
import { NModal, NList, NListItem, NIcon, NSpace, NButton } from 'naive-ui'
import draggable from 'vuedraggable'
import { ReorderFourOutline } from '@vicons/ionicons5'
import type { SubscriptionGroup } from '@/stores/subscriptionGroups'
import { useIsMobile } from '@/composables/useMediaQuery'

const props = defineProps<{
    show: boolean
    loading: boolean
    groups: SubscriptionGroup[]
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'save', groups: SubscriptionGroup[]): void
}>()

const isMobile = useIsMobile()
const localGroups = ref<SubscriptionGroup[]>([])

watch(() => props.show, (val) => {
    if (val) {
        localGroups.value = [...props.groups]
    }
})

const handleSave = () => {
    emit('save', localGroups.value)
}
</script>

<template>
    <n-modal
      :show="show"
      @update:show="(val) => emit('update:show', val)"
      preset="card"
      title="调整分组顺序"
      :style="{ width: isMobile ? '90vw' : '500px' }"
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
                <n-icon class="drag-handle mr-2 cursor-move" :component="ReorderFourOutline" size="20" />
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
