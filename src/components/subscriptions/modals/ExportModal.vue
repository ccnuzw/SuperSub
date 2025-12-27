<script setup lang="ts">
import { useMessage, NModal, NInput, NSpace, NButton } from 'naive-ui'

const props = defineProps<{
  show: boolean
  groupName: string
  urls: string
  count: number
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const message = useMessage()

const handleCopyExportUrls = () => {
  if (!props.urls) {
    message.warning('没有内容可复制。')
    return
  }
  navigator.clipboard.writeText(props.urls).then(() => {
    message.success('已成功复制到剪贴板！')
  }).catch(err => {
    message.error('复制失败，您的浏览器可能不支持或未授权。')
    console.error('Clipboard write failed:', err)
  })
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
      :title="`导出分组 '${groupName}' 的订阅`"
      style="width: 600px;"
      :mask-closable="false"
    >
      <p class="mb-2">共 {{ count }} 个订阅链接：</p>
      <n-input
        :value="urls"
        type="textarea"
        readonly
        :autosize="{ minRows: 10, maxRows: 20 }"
        placeholder="没有订阅链接"
      />
      <template #footer>
        <n-space justify="end">
          <n-button @click="handleClose">关闭</n-button>
          <n-button type="primary" @click="handleCopyExportUrls">复制</n-button>
        </n-space>
      </template>
    </n-modal>
</template>
