/**
 * 用户表单模态框组件
 * 用于添加新用户
 */

<template>
  <n-modal
    :visible="props.visible"
    @update:visible="handleUpdateVisible"
    :mask-closable="false"
    preset="card"
    title="添加用户"
    class="user-form-modal"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="80px"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="用户名" path="username">
        <n-input
          v-model:value="formData.username"
          placeholder="请输入用户名"
          :disabled="loading"
        />
      </n-form-item>

      <n-form-item label="密码" path="password">
        <n-input
          v-model:value="formData.password"
          type="password"
          placeholder="请输入密码"
          show-password-on="mousedown"
          :disabled="loading"
        />
      </n-form-item>

      <n-form-item label="角色" path="role">
        <n-select
          v-model:value="formData.role"
          :options="roleOptions"
          placeholder="请选择角色"
          :disabled="loading"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <div class="flex justify-end space-x-2">
        <n-button
          @click="handleCancel"
          :disabled="loading"
        >
          取消
        </n-button>
        <n-button
          type="primary"
          @click="handleSubmit"
          :loading="loading"
        >
          添加用户
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSelect, NButton, useMessage } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import httpClient from '@/services/http/HttpClient'
import type {
  IUserFormModalProps,
  IUserFormModalEmits,
  IUserFormData,
  UserRole,
  IUserFormRules
} from '@/types/user-management'

// Props 定义
const props = withDefaults(defineProps<IUserFormModalProps>(), {})

// Emits 定义
const emit = defineEmits<IUserFormModalEmits>()

// 响应式数据
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)

// 表单数据
const formData = reactive<IUserFormData>({
  username: '',
  password: '',
  role: 'user' as UserRole
})

// 角色选项
const roleOptions = computed(() => [
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' }
])

// 表单验证规则
const formRules: IUserFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在 3-20 个字符之间', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度应在 6-50 个字符之间', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 事件处理函数
const handleUpdateVisible = (visible: boolean): void => {
  emit('update:visible', visible)
  if (!visible) {
    resetForm()
  }
}

const handleCancel = (): void => {
  emit('update:visible', false)
  resetForm()
}

const resetForm = (): void => {
  formData.username = ''
  formData.password = ''
  formData.role = 'user'
  formRef.value?.restoreValidation()
}

const handleSubmit = async (): Promise<void> => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const response = await httpClient.post('/auth/register', {
      username: formData.username,
      password: formData.password,
      role: formData.role
    })

    if (response.success) {
      message.success('用户添加成功')
      emit('update:visible', false)
      emit('success')
      resetForm()
    } else {
      message.error(response.message || '添加用户失败')
    }
  } catch (error: any) {
    console.error('Add user failed:', error)
    message.error(error.message || '添加用户失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.user-form-modal {
  --n-border-radius: 12px;
  max-width: 90vw;
  width: 500px;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .user-form-modal {
    width: 95vw;
    max-width: none;
    margin: 0 10px;
  }
}

/* 深色模式适配 */
.dark .user-form-modal {
  --n-color: #374151;
  --n-color-modal: #1f2937;
  --n-text-color: #f9fafb;
}

/* 表单项目间距调整 */
.user-form-modal :deep(.n-form-item) {
  margin-bottom: 20px;
}

.user-form-modal :deep(.n-form-item:last-child) {
  margin-bottom: 0;
}

/* 输入框统一样式 */
.user-form-modal :deep(.n-input) {
  border-radius: 8px;
}

.user-form-modal :deep(.n-select) {
  border-radius: 8px;
}

/* 按钮样式 */
.user-form-modal :deep(.n-button) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.user-form-modal :deep(.n-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 动画效果 */
.user-form-modal {
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>