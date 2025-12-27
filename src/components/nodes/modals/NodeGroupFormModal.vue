<script setup lang="ts">
import { ref, watch } from 'vue'
import { NModal, NInput, NSpace, NButton } from 'naive-ui'

const props = defineProps<{
  show: boolean
  loading: boolean
  modelValue: string
  title: string
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
}>()

const localName = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  localName.value = val
})

watch(localName, (val) => {
  emit('update:modelValue', val)
})

const handleSubmit = () => {
    emit('submit')
}
</script>

<template>
  <n-modal
    :show="show"
    @update:show="(val) => emit('update:show', val)"
    preset="card"
    :title="title"
    style="width: 400px;"
  >
    <n-input
      v-model:value="localName"
      placeholder="分组名称"
      @keyup.enter="handleSubmit"
    />
    <template #footer>
      <n-space justify="end">
        <n-button @click="emit('update:show', false)">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="loading">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>
