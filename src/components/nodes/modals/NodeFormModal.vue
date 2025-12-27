<script setup lang="ts">
import { ref, watch, computed, reactive } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSpace, NButton } from 'naive-ui'
import { Node } from '@/types'

const props = defineProps<{
  show: boolean
  loading: boolean
  node: Node | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'submit', payload: { name: string; link: string }): void
}>()

const formState = reactive({
  name: '',
  link: '',
})

watch(
  () => props.node,
  (newNode) => {
    if (newNode) {
      formState.name = newNode.name
      // @ts-ignore
      formState.link = newNode.link || ''
    } else {
      formState.name = ''
      formState.link = ''
    }
  },
  { immediate: true }
)

const title = computed(() => (props.node ? '编辑节点' : '新增节点'))

const handleSubmit = () => {
  emit('submit', { ...formState })
}

const handleClose = () => {
    emit('update:show', false)
}
</script>

<template>
  <n-modal
    :show="show"
    @update:show="(val) => emit('update:show', val)"
    preset="card"
    :title="title"
    style="width: 600px; max-width: 90%;"
  >
    <n-form :model="formState" label-placement="left" label-width="80">
      <n-form-item label="名称" path="name">
        <n-input v-model:value="formState.name" placeholder="请输入节点名称" />
      </n-form-item>
      <n-form-item label="链接" path="link">
        <n-input
          type="textarea"
          v-model:value="formState.link"
          placeholder="vmess://... or vless://..."
          :autosize="{ minRows: 3, maxRows: 6 }"
        />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="loading">保存</n-button>
      </n-space>
    </template>
  </n-modal>
</template>
