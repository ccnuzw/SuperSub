/**
 * 批量导入订阅模态框组件
 * 视图层组件：负责UI展示和用户交互，业务逻辑委托给Composable
 */

<template>
  <n-modal
    :show="show"
    @update:show="$emit('update:show', $event)"
    preset="card"
    title="批量导入订阅"
    style="width: 800px; max-height: 80vh;"
    :mask-closable="!importing"
    :closable="!importing"
  >
    <div class="batch-import-modal">
      <!-- 导入步骤指示器 -->
      <n-steps :current="currentStep" :status="importing ? 'process' : 'wait'" class="mb-6">
        <n-step title="输入订阅" description="粘贴或输入订阅链接" />
        <n-step title="预览确认" description="检查并编辑订阅信息" />
        <n-step title="导入完成" description="查看导入结果" />
      </n-steps>

      <!-- 步骤1: 输入订阅 -->
      <div v-if="currentStep === 1" class="import-input-step">
        <n-form label-placement="top" :show-label="true">
          <n-form-item label="分组选择" path="groupId">
            <n-select
              v-model:value="selectedGroupId"
              :options="groupOptions as any"
              placeholder="选择目标分组（可选）"
              clearable
              :disabled="importing"
            />
          </n-form-item>

          <n-form-item label="订阅数据" path="subscriptionText">
            <n-input
              v-model:value="subscriptionText"
              type="textarea"
              placeholder="请输入订阅数据，支持以下格式：&#10;1. 每行一个订阅链接&#10;2. 订阅名称|订阅链接&#10;3. 订阅名称 订阅链接（空格分隔）&#10;&#10;示例：&#10;香港线路1|https://example.com/sub1&#10;香港线路2|https://example.com/sub2&#10;https://example.com/sub3"
              :autosize="{ minRows: 8, maxRows: 15 }"
              :disabled="importing"
              show-count
              maxlength="10000"
            />
          </n-form-item>

          <n-form-item label="导入选项">
            <n-space vertical>
              <n-checkbox v-model:checked="options.validateUrls" :disabled="importing">
                验证订阅链接有效性
              </n-checkbox>
              <n-checkbox v-model:checked="options.skipDuplicates" :disabled="importing">
                跳过重复的订阅
              </n-checkbox>
            </n-space>
          </n-form-item>
        </n-form>

        <div class="flex justify-between mt-6">
          <n-button @click="handleCancel" :disabled="importing">
            取消
          </n-button>
          <n-space>
            <n-button @click="handlePreviewText" :disabled="!subscriptionText.trim() || importing">
              预览解析
            </n-button>
            <n-button
              type="primary"
              @click="handleParseAndNext"
              :loading="loading"
              :disabled="!subscriptionText.trim() || importing"
            >
              解析并继续
            </n-button>
          </n-space>
        </div>
      </div>

      <!-- 步骤2: 预览确认 -->
      <div v-if="currentStep === 2" class="preview-step">
        <div class="mb-4 flex justify-between items-center">
          <n-text type="info">
            已解析 {{ subscriptions.length }} 个订阅
            <span v-if="invalidCount > 0" class="text-red-500">
              （{{ invalidCount }} 个无效）
            </span>
          </n-text>
          <n-button size="small" @click="handleBackToAdd">
            返回添加
          </n-button>
        </div>

        <!-- 订阅列表 -->
        <div class="subscription-list mb-4" style="max-height: 400px; overflow-y: auto;">
          <div
            v-for="(subscription, index) in subscriptions"
            :key="index"
            class="subscription-item"
            :class="{ 'invalid': !isSubscriptionValid(subscription) }"
          >
            <div class="flex items-center gap-4">
              <div class="flex-1">
                <n-input
                  v-model:value="subscription.name"
                  placeholder="订阅名称"
                  :status="!subscription.name.trim() ? 'error' : undefined"
                  :disabled="importing"
                  size="small"
                />
              </div>
              <div class="flex-1">
                <n-input
                  v-model:value="subscription.url"
                  placeholder="订阅链接"
                  :status="!isValidUrl(subscription.url) ? 'error' : undefined"
                  :disabled="importing"
                  size="small"
                />
              </div>
              <n-select
                v-model:value="subscription.group_id"
                :options="groupOptions as any"
                placeholder="分组"
                clearable
                :disabled="importing"
                size="small"
                style="width: 120px;"
              />
              <n-button
                type="error"
                size="small"
                quaternary
                @click="handleRemoveSubscription(index)"
                :disabled="importing"
              >
                删除
              </n-button>
            </div>
            <div v-if="!isSubscriptionValid(subscription)" class="error-message">
              {{ getSubscriptionError(subscription) }}
            </div>
          </div>
        </div>

        <!-- 添加更多订阅 -->
        <n-collapse>
          <n-collapse-item title="添加更多订阅" name="add-more">
            <div class="add-more-section">
              <n-input
                v-model:value="additionalSubscriptionText"
                type="textarea"
                placeholder="输入更多订阅数据..."
                :autosize="{ minRows: 3, maxRows: 6 }"
                :disabled="importing"
              />
              <div class="mt-2">
                <n-button @click="handleAddMore" :disabled="!additionalSubscriptionText.trim() || importing">
                  添加订阅
                </n-button>
              </div>
            </div>
          </n-collapse-item>
        </n-collapse>

        <div class="flex justify-between mt-6">
          <n-button @click="handleBack" :disabled="importing">
            上一步
          </n-button>
          <n-space>
            <n-button @click="handleCancel" :disabled="importing">
              取消
            </n-button>
            <n-button
              type="primary"
              @click="handleStartImport"
              :loading="importing"
              :disabled="!hasValidSubscriptions || importing"
            >
              开始导入 ({{ validSubscriptions.length }})
            </n-button>
          </n-space>
        </div>
      </div>

      <!-- 步骤3: 导入进行中/完成 -->
      <div v-if="currentStep === 3" class="import-result-step">
        <!-- 进度条 -->
        <div v-if="importing" class="progress-section mb-6">
          <n-progress
            type="line"
            :percentage="progressPercentage"
            :status="importing ? 'default' : 'success'"
            :show-indicator="true"
          />
          <n-text type="info" class="mt-2">
            正在导入订阅... ({{ progress }} / {{ subscriptions.length }})
          </n-text>
        </div>

        <!-- 导入结果 -->
        <div v-if="importResult && !importing" class="result-section">
          <n-alert
            :type="importResult.failed === 0 ? 'success' : 'warning'"
            :title="importResult.failed === 0 ? '导入成功' : '导入部分完成'"
            class="mb-4"
          >
            <div class="result-summary">
              <p>总计: {{ importResult.total }} 个订阅</p>
              <p>成功: {{ importResult.success }} 个订阅</p>
              <p v-if="importResult.failed > 0">失败: {{ importResult.failed }} 个订阅</p>
            </div>
          </n-alert>

          <!-- 错误详情 -->
          <div v-if="importResult.errors.length > 0" class="error-details">
            <n-text type="error" strong>导入失败的订阅：</n-text>
            <div class="mt-2">
              <div
                v-for="(error, index) in importResult.errors"
                :key="index"
                class="error-item"
              >
                <n-text>{{ error.subscription.name }}: {{ error.error }}</n-text>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <n-space>
            <n-button @click="handleImportMore" :disabled="importing">
              继续导入
            </n-button>
            <n-button
              type="primary"
              @click="handleFinish"
              :disabled="importing"
            >
              完成
            </n-button>
          </n-space>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NModal,
  NSteps,
  NStep,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NCheckbox,
  NButton,
  NSpace,
  NCollapse,
  NCollapseItem,
  NProgress,
  NText,
  NAlert,
  useMessage,
  type FormRules
} from 'naive-ui'
import type { ISubscriptionGroup } from '@/types'
import type { IModalComponentProps, IModalComponentEmits } from '@/utils/componentApiStandards'
import { useSubscriptionBatchImport, type IBatchImportSubscription, type IBatchImportResult } from './composables/useSubscriptionBatchImport'

interface IProps extends IModalComponentProps {
  show: boolean
  groups?: ISubscriptionGroup[]
}

const props = withDefaults(defineProps<IProps>(), {
  groups: () => []
})

interface IEmits extends IModalComponentEmits {
  success: [result: IBatchImportResult]
}

const emit = defineEmits<IEmits>()

// 使用业务逻辑层 Composable
const message = useMessage()

const {
  loading,
  importing,
  progress,
  progressPercentage,
  hasSubscriptions,
  isValid,
  subscriptions,
  selectedGroupId,
  options,
  parseSubscriptionsFromText,
  addSubscription,
  removeSubscription,
  updateSubscription,
  clearSubscriptions,
  importFromText,
  executeBatchImport,
  reset,
  isValidUrl
} = useSubscriptionBatchImport()

// 视图层状态
const currentStep = ref(1)
const subscriptionText = ref('')
const additionalSubscriptionText = ref('')
const importResult = ref<IBatchImportResult | null>(null)

// 计算属性
const groupOptions = computed(() => [
  { label: '未分组', value: null },
  ...props.groups.map(group => ({
    label: group.name,
    value: group.id
  }))
])

const invalidCount = computed(() =>
  subscriptions.value.filter(sub => !isSubscriptionValid(sub)).length
)

const hasValidSubscriptions = computed(() =>
  subscriptions.value.some(sub => isSubscriptionValid(sub))
)

const validSubscriptions = computed(() =>
  subscriptions.value.filter(sub => isSubscriptionValid(sub))
)

// 验证单个订阅
const isSubscriptionValid = (subscription: IBatchImportSubscription): boolean => {
  return !!(subscription.name.trim() && isValidUrl(subscription.url.trim()))
}

const getSubscriptionError = (subscription: IBatchImportSubscription): string => {
  if (!subscription.name.trim()) return '订阅名称不能为空'
  if (!subscription.url.trim()) return '订阅链接不能为空'
  if (!isValidUrl(subscription.url.trim())) return '订阅链接格式无效'
  return ''
}

// 事件处理方法
const handleCancel = () => {
  if (!importing.value) {
    emit('update:show', false)
    reset()
    currentStep.value = 1
    subscriptionText.value = ''
    additionalSubscriptionText.value = ''
    importResult.value = null
  }
}

const handlePreviewText = () => {
  const parsed = parseSubscriptionsFromText(subscriptionText.value)
  if (parsed.length > 0) {
    message.success(`预览：成功解析 ${parsed.length} 个订阅`)
  } else {
    message.warning('未能解析到有效的订阅数据')
  }
}

const handleParseAndNext = async () => {
  if (!subscriptionText.value.trim()) return

  try {
    loading.value = true
    clearSubscriptions()
    importFromText(subscriptionText.value)
    currentStep.value = 2
  } catch (error) {
    message.error('解析订阅数据失败')
  } finally {
    loading.value = false
  }
}

const handleBackToAdd = () => {
  // 保留已解析的订阅，但允许添加更多
  subscriptionText.value = ''
}

const handleBack = () => {
  currentStep.value = 1
}

const handleAddMore = () => {
  if (additionalSubscriptionText.value.trim()) {
    importFromText(additionalSubscriptionText.value)
    additionalSubscriptionText.value = ''
  }
}

const handleStartImport = async () => {
  try {
    const result = await executeBatchImport()
    importResult.value = result
    emit('success', result)
  } catch (error: any) {
    message.error('批量导入失败')
  }
}

const handleImportMore = () => {
  // 重置状态但保留分组选择
  const currentGroup = selectedGroupId.value
  reset()
  selectedGroupId.value = currentGroup
  currentStep.value = 1
  subscriptionText.value = ''
  additionalSubscriptionText.value = ''
  importResult.value = null
}

const handleFinish = () => {
  emit('update:show', false)
  reset()
  currentStep.value = 1
  subscriptionText.value = ''
  additionalSubscriptionText.value = ''
  importResult.value = null
}

// 类型安全的参数处理
const handleAddMoreSubscription = (subscription: IBatchImportSubscription) => {
  addSubscription(subscription)
}

const handleRemoveSubscription = (index: number) => {
  removeSubscription(index)
}

const handleUpdateSubscription = (index: number, subscription: Partial<IBatchImportSubscription>) => {
  if (index >= 0 && index < subscriptions.value.length) {
    subscriptions.value[index] = { ...subscriptions.value[index], ...subscription }
  }
}

// 监听显示状态变化
watch(() => props.show, (show) => {
  if (!show) {
    reset()
    currentStep.value = 1
    subscriptionText.value = ''
    additionalSubscriptionText.value = ''
    importResult.value = null
  }
})

// 监听分组选择变化
watch(selectedGroupId, (newGroupId) => {
  // 更新所有订阅的分组ID
  subscriptions.value.forEach((sub, index) => {
    handleUpdateSubscription(index, { group_id: newGroupId })
  })
})
</script>

<style scoped>
.batch-import-modal {
  min-height: 400px;
}

.import-input-step,
.preview-step,
.import-result-step {
  min-height: 300px;
}

.subscription-item {
  padding: 12px;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  margin-bottom: 8px;
  background: var(--n-card-color);
  transition: all 0.2s;
}

.subscription-item:hover {
  border-color: var(--n-primary-color);
}

.subscription-item.invalid {
  border-color: var(--n-error-color);
  background: rgba(208, 48, 80, 0.05);
}

.error-message {
  margin-top: 8px;
  color: var(--n-error-color);
  font-size: 12px;
}

.add-more-section {
  padding: 12px;
  background: var(--n-modal-color);
  border-radius: 6px;
}

.progress-section {
  text-align: center;
  padding: 20px;
}

.result-summary p {
  margin: 4px 0;
}

.error-details {
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  background: rgba(208, 48, 80, 0.05);
  border-radius: 6px;
}

.error-item {
  padding: 4px 0;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .batch-import-modal {
    width: 95vw !important;
    max-width: none;
  }

  .subscription-item .flex {
    flex-direction: column;
    gap: 8px;
  }

  .subscription-item .flex > div {
    width: 100% !important;
  }
}
</style>