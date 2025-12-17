/**
 * 订阅表单模态框组件
 * 用于添加和编辑订阅
 */

<template>
  <n-modal
    :show="show"
    @update:show="$emit('update:show', $event)"
    preset="card"
    :title="title || (isEditing ? '编辑订阅' : '添加订阅')"
    style="width: 600px;"
    :mask-closable="false"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="120px"
    >
      <n-form-item label="订阅名称" path="name">
        <n-input
          v-model:value="formData.name"
          placeholder="请输入订阅名称"
          clearable
        />
      </n-form-item>

      <n-form-item label="订阅链接" path="url">
        <n-input
          v-model:value="formData.url"
          type="textarea"
          placeholder="请输入订阅链接"
          :autosize="{ minRows: 3, maxRows: 6 }"
          clearable
        />
      </n-form-item>

      <n-form-item label="分组" path="group_id">
        <n-select
          v-model:value="formData.group_id"
          :options="groupOptions"
          placeholder="请选择分组"
          clearable
        />
      </n-form-item>

      <n-grid :cols="2" :x-gap="16">
        <n-gi>
          <n-form-item label="自动更新" path="is_auto_update">
            <n-switch v-model:value="formData.is_auto_update" />
          </n-form-item>
        </n-gi>

        <n-gi>
          <n-form-item label="更新间隔" path="update_interval">
            <n-input-number
              v-model:value="formData.update_interval"
              :min="1"
              :max="24"
              placeholder="小时"
              :disabled="!formData.is_auto_update"
            />
          </n-form-item>
        </n-gi>
      </n-grid>

      <n-form-item label="备注" path="remark">
        <n-input
          v-model:value="formData.remark"
          type="textarea"
          placeholder="可选备注信息"
          :autosize="{ minRows: 2, maxRows: 4 }"
          clearable
        />
      </n-form-item>

      <!-- 高级选项 -->
      <n-collapse>
        <n-collapse-item title="高级选项" name="advanced">
          <n-grid :cols="2" :x-gap="16">
            <n-gi>
              <n-form-item label="用户代理" path="user_agent">
                <n-select
                  v-model:value="formData.user_agent"
                  :options="userAgentOptions"
                  placeholder="选择User-Agent"
                  clearable
                />
              </n-form-item>
            </n-gi>

            <n-gi>
              <n-form-item label="超时时间" path="timeout">
                <n-input-number
                  v-model:value="formData.timeout"
                  :min="5"
                  :max="300"
                  placeholder="秒"
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-form-item label="自定义节点类型" path="node_types">
            <n-dynamic-tags
              v-model:value="formData.node_types"
              :max="10"
              placeholder="添加节点类型"
            />
          </n-form-item>

          <n-form-item label="排除节点" path="exclude_nodes">
            <n-dynamic-tags
              v-model:value="formData.exclude_nodes"
              :max="20"
              placeholder="添加要排除的节点关键词"
            />
          </n-form-item>
        </n-collapse-item>
      </n-collapse>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">取消</n-button>
        <n-button
          type="primary"
          @click="handleSave"
          :loading="loading"
        >
          {{ isEditing ? '更新' : '添加' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSwitch,
  NInputNumber,
  NGrid,
  NGi,
  NCollapse,
  NCollapseItem,
  NDynamicTags,
  NButton,
  NSpace,
  type FormInst,
  type FormRules
} from 'naive-ui'
import type { Subscription } from '@/types'
import type { IModalComponentProps, IModalComponentEmits } from '@/utils/componentApiStandards'

interface IProps extends IModalComponentProps {
  show: boolean
  title?: string
  subscription?: Subscription | null
  groups?: Array<{ label: string; value: string }>
}

const props = withDefaults(defineProps<IProps>(), {
  groups: () => [],
  loading: false
})

interface IEmits extends IModalComponentEmits {
  save: [data: Partial<Subscription>]
}

const emit = defineEmits<IEmits>()

// 表单引用
const formRef = ref<FormInst | null>(null)

// 是否为编辑模式
const isEditing = computed(() => !!props.subscription)

// 表单数据
const formData = reactive<Partial<Subscription>>({
  name: '',
  url: '',
  group_id: null,
  is_auto_update: true,
  update_interval: 6,
  remark: '',
  user_agent: '',
  timeout: 30,
  node_types: [],
  exclude_nodes: []
})

// 分组选项
const groupOptions = computed(() => [
  { label: '默认分组', value: '' },
  ...props.groups
])

// User-Agent选项
const userAgentOptions = [
  { label: '默认', value: '' },
  { label: 'Chrome', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  { label: 'Firefox', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101' },
  { label: 'Safari', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15' },
  { label: '移动端', value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' }
]

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入订阅名称', trigger: 'blur' },
    { min: 2, max: 100, message: '名称长度应在2-100个字符之间', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入订阅链接', trigger: 'blur' },
    {
      pattern: /^https?:\/\/.+/,
      message: '请输入有效的HTTP/HTTPS链接',
      trigger: 'blur'
    }
  ],
  update_interval: [
    {
      type: 'number',
      min: 1,
      max: 24,
      message: '更新间隔应在1-24小时之间',
      trigger: 'blur'
    }
  ],
  timeout: [
    {
      type: 'number',
      min: 5,
      max: 300,
      message: '超时时间应在5-300秒之间',
      trigger: 'blur'
    }
  ]
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    name: '',
    url: '',
    group_id: null,
    is_auto_update: true,
    update_interval: 6,
    remark: '',
    user_agent: '',
    timeout: 30,
    node_types: [],
    exclude_nodes: []
  })
  formRef.value?.restoreValidation()
}

// 监听订阅变化，填充表单
watch(() => props.subscription, (subscription) => {
  if (subscription) {
    Object.assign(formData, subscription)
  } else {
    resetForm()
  }
}, { immediate: true })

// 监听显示状态变化
watch(() => props.show, (show) => {
  if (!show) {
    resetForm()
  }
})

// 取消操作
const handleCancel = () => {
  emit('update:show', false)
}

// 保存操作
const handleSave = async () => {
  try {
    await formRef.value?.validate()
    emit('save', { ...formData })
  } catch (error) {
    console.log('表单验证失败:', error)
  }
}
</script>

<style scoped>
/* 表单样式增强 */
.n-form-item {
  margin-bottom: 16px;
}

.n-collapse-item {
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .n-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>