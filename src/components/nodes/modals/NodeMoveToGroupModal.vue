<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NModal, NSpace, NSelect, NButton } from 'naive-ui'
import type { NodeGroup } from '@/stores/groups'

const props = defineProps<{
    show: boolean
    loading: boolean
    groups: NodeGroup[]
    nodeCount: number
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'submit', groupId: string | null): void
}>()

const selectedGroupId = ref<string | null>(null)

// Reset selection when modal opens
watch(() => props.show, (val) => {
    if (val) selectedGroupId.value = null
})

const handleSubmit = () => {
    emit('submit', selectedGroupId.value)
}

const options = computed(() => {
    return [
        { label: '未分组', value: null },
        ...props.groups.map(g => ({ label: g.name, value: g.id }))
    ]
})
</script>

<template>
    <n-modal
      :show="show"
      @update:show="(val) => emit('update:show', val)"
      preset="card"
      title="移动到分组"
      style="width: 400px;"
    >
        <n-space vertical>
            <p>将选中的 {{ nodeCount }} 个节点移动到：</p>
            <n-select
                v-model:value="selectedGroupId"
                :options="options as any"
                placeholder="选择目标分组"
            />
        </n-space>
        <template #footer>
            <n-space justify="end">
                <n-button @click="emit('update:show', false)">取消</n-button>
                <n-button type="primary" @click="handleSubmit" :loading="loading">确认移动</n-button>
            </n-space>
        </template>
    </n-modal>
</template>
