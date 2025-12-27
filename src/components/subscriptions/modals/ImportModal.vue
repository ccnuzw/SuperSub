<script setup lang="ts">
import { ref } from 'vue'
import { useMessage, NModal, NInput, NFormItem, NSelect, NSpace, NButton } from 'naive-ui'
import { subscriptionsApi } from '@/api/subscriptions';
import { useSubscriptionGroupStore } from '@/stores/subscriptionGroups'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'success'): void
}>()

const message = useMessage()
const subscriptionGroupStore = useSubscriptionGroupStore()

const importUrls = ref('')
const importGroupId = ref<string | undefined>(undefined)
const importLoading = ref(false)

const handleBulkImport = async () => {
  if (!importUrls.value.trim()) {
    message.warning('请输入订阅链接')
    return
  }
  importLoading.value = true
  const lines = importUrls.value.split('\n').map(line => line.trim()).filter(Boolean)
  const subscriptionsToCreate: { name: string; url: string }[] = []
  for (const line of lines) {
    const parts = line.split(',').map(part => part.trim())
    if (parts.length === 2 && parts[1].startsWith('http')) {
      subscriptionsToCreate.push({ name: parts[0], url: parts[1] })
    } else if (parts.length === 1 && parts[0].startsWith('http')) {
      try {
        const urlObj = new URL(parts[0])
        const name = urlObj.hostname
        subscriptionsToCreate.push({ name: name, url: parts[0] })
      } catch (e) { /* Ignore invalid URL */ }
    }
  }
  if (subscriptionsToCreate.length === 0) {
    message.warning('没有找到有效的订阅链接。格式应为 "名称,链接" 或直接是链接。')
    importLoading.value = false
    return
  }
  try {
    const response = await subscriptionsApi.batchImport(subscriptionsToCreate, importGroupId.value)
    if (response.data.success) {
      message.success(response.data.data?.message || `成功导入 ${response.data.data?.created || 0} 个订阅`)
      emit('update:show', false)
      emit('success')
      // Reset form
      importUrls.value = ''
      importGroupId.value = undefined
    } else {
      message.error(response.data.message || '导入失败')
    }
  } catch (error) {
    message.error('请求失败，请稍后重试')
  } finally {
    importLoading.value = false
  }
}

const handleClose = () => {
    emit('update:show', false)
}
</script>

<template>
    <n-modal :show="show" @update:show="(val) => emit('update:show', val)" preset="card" title="批量导入订阅" style="width: 600px;">
         <n-input
            v-model:value="importUrls"
            type="textarea"
            placeholder="请输入订阅链接，每行一个。格式：名称,链接 或 直接链接 (自动获取域名作为名称)"
            :autosize="{ minRows: 5, maxRows: 10 }"
        />
         <n-form-item label="导入到分组" class="mt-4">
          <n-select
            v-model:value="importGroupId"
            :options="subscriptionGroupStore.groups.map(g => ({ label: g.name, value: g.id }))"
            placeholder="选择分组 (可选)"
            clearable
          />
        </n-form-item>
        <template #footer>
            <n-space justify="end">
                <n-button @click="handleClose">取消</n-button>
                <n-button type="primary" @click="handleBulkImport" :loading="importLoading">导入</n-button>
            </n-space>
        </template>
    </n-modal>
</template>
