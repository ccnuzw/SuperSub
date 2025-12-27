<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useMessage, NModal, NForm, NFormItem, NInput, NSpace, NButton } from 'naive-ui'
import { subscriptionsApi } from '@/api/subscriptions';
import type { Subscription } from '@/types'

const props = defineProps<{
  show: boolean
  groupId: string | null
  subscriptions: Subscription[]
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'success'): void
}>()

const message = useMessage()

const data = reactive({
  find: '',
  replace: '',
  loading: false,
})

const subsInGroup = computed(() => {
    if (!props.groupId) return []
    return props.subscriptions.filter(s => s.group_id === props.groupId)
})

const count = computed(() => subsInGroup.value.length)

const handleBatchReplace = async () => {
  if (!data.find) {
    message.warning('“查找”内容不能为空。')
    return
  }
  if (!props.groupId) {
    message.error('未指定分组，操作中止。')
    return
  }

  data.loading = true
  
  const updates = subsInGroup.value.map(sub => ({
    id: sub.id,
    url: sub.url.replaceAll(data.find, data.replace)
  })).filter(update => {
    const originalSub = subsInGroup.value.find(s => s.id === update.id)
    return originalSub && originalSub.url !== update.url
  })

  if (updates.length === 0) {
    message.info('没有找到任何需要更新的订阅链接。')
    data.loading = false
    emit('update:show', false)
    return
  }

  try {
    const response = await subscriptionsApi.batchUpdateUrls({ updates })
    if (response.data.success) {
      message.success(`成功更新了 ${updates.length} 个订阅链接。`)
      emit('success')
      emit('update:show', false)
      // reset
      data.find = ''
      data.replace = ''
    } else {
      message.error(response.data.message || '批量替换失败')
    }
  } catch (err) {
    message.error('请求失败，请稍后重试')
  } finally {
    data.loading = false
  }
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
      title="批量替换订阅链接"
      style="width: 600px;"
      :mask-closable="false"
    >
      <p class="mb-4">将对该分组下的 <b>{{ count }}</b> 个订阅链接执行替换操作。</p>
      <n-form>
        <n-form-item label="查找内容">
          <n-input v-model:value="data.find" placeholder="例如，旧的域名或参数" />
        </n-form-item>
        <n-form-item label="替换为">
          <n-input v-model:value="data.replace" placeholder="例如，新的域名或参数（可留空）" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="handleClose">取消</n-button>
          <n-button type="primary" @click="handleBatchReplace" :loading="data.loading">确认替换</n-button>
        </n-space>
      </template>
    </n-modal>
</template>
