<script setup lang="ts">
import { computed } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSpace, NButton } from 'naive-ui'

const props = defineProps<{
    show: boolean
    mode: 'add' | 'edit'
    name: string
    description: string
    loading: boolean
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'update:name', value: string): void
    (e: 'update:description', value: string): void
    (e: 'submit'): void
}>()

const title = computed(() => props.mode === 'add' ? '新增分组' : '编辑分组')
const submitText = computed(() => props.mode === 'add' ? '保存' : '更新')

</script>

<template>
    <n-modal
      :show="show"
      @update:show="(val) => emit('update:show', val)"
      preset="card"
      :title="title"
      style="width: 500px;"
    >
        <n-form label-placement="left" label-width="80">
            <n-form-item label="名称">
                <n-input
                  :value="name"
                  @update:value="(val) => emit('update:name', val)"
                  placeholder="分组名称"
                />
            </n-form-item>
            <n-form-item label="描述">
                <n-input
                  :value="description"
                  @update:value="(val) => emit('update:description', val)"
                  type="textarea"
                  placeholder="分组描述 (可选)"
                />
            </n-form-item>
        </n-form>
        <template #footer>
            <n-space justify="end">
                <n-button @click="emit('update:show', false)">取消</n-button>
                <n-button type="primary" @click="emit('submit')" :loading="loading">{{ submitText }}</n-button>
            </n-space>
        </template>
    </n-modal>
</template>
