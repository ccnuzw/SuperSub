/**
 * 订阅分组表单模态框组件
 * 视图层组件：只负责UI渲染和用户交互，业务逻辑委托给Composable
 */

<template>
  <n-modal
    :show="show"
    @update:show="$emit('update:show', $event)"
    preset="card"
    :title="title"
    style="width: 500px;"
    :mask-closable="!loading"
    :closable="!loading"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="100px"
    >
      <n-form-item label="分组名称" path="name">
        <n-input
          v-model:value="formData.name"
          placeholder="请输入分组名称"
          clearable
          maxlength="50"
          show-count
          :disabled="loading"
        />
      </n-form-item>

      <n-form-item label="分组描述" path="description">
        <n-input
          v-model:value="formData.description"
          type="textarea"
          placeholder="可选的分组描述"
          :autosize="{ minRows: 3, maxRows: 5 }"
          maxlength="200"
          show-count
          clearable
          :disabled="loading"
        />
      </n-form-item>

      <n-form-item label="分组颜色" path="color">
        <n-color-picker
          v-model:value="formData.color"
          :actions="['confirm']"
          placement="bottom-start"
          :disabled="loading"
        />
      </n-form-item>

      <n-form-item label="分组图标" path="icon">
        <n-select
          v-model:value="formData.icon"
          :options="iconOptions"
          placeholder="选择分组图标"
          clearable
          :disabled="loading"
          :render-label="renderIconLabel"
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel" :disabled="loading">
          取消
        </n-button>
        <n-button
          type="primary"
          @click="handleSave"
          :loading="loading"
        >
          {{ isEditing ? '更新' : '创建' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NColorPicker,
  NButton,
  NSpace,
  NIcon,
  type FormInst,
  type SelectOption
} from 'naive-ui'
import {
  FolderOutline,
  StarOutline,
  HeartOutline,
  BookmarkOutline,
  FlagOutline,
  PricetagOutline,
  ColorPaletteOutline,
  GridOutline,
  ListOutline,
  ArchiveOutline
} from '@vicons/ionicons5'
import type { ISubscriptionGroup } from '@/types'
import type { IModalComponentProps, IModalComponentEmits } from '@/utils/componentApiStandards'

interface IProps extends IModalComponentProps {
  show: boolean
  group?: ISubscriptionGroup | null
  loading?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  loading: false
})

interface IEmits extends IModalComponentEmits {
  save: [data: Partial<ISubscriptionGroup>]
}

const emit = defineEmits<IEmits>()

// 表单引用
const formRef = ref<FormInst | null>(null)

// 计算属性
const isEditing = computed(() => !!props.group)
const title = computed(() => isEditing.value ? '编辑分组' : '新建分组')

// 表单数据
const formData = ref<Partial<ISubscriptionGroup>>({
  name: '',
  description: '',
  color: '#2080f0',
  icon: null
})

// 图标选项（纯UI配置）
const iconOptions = [
  { label: '文件夹', value: 'FolderOutline', icon: FolderOutline },
  { label: '星标', value: 'StarOutline', icon: StarOutline },
  { label: '爱心', value: 'HeartOutline', icon: HeartOutline },
  { label: '书签', value: 'BookmarkOutline', icon: BookmarkOutline },
  { label: '旗帜', value: 'FlagOutline', icon: FlagOutline },
  { label: '标签', value: 'PricetagOutline', icon: PricetagOutline },
  { label: '调色板', value: 'ColorPaletteOutline', icon: ColorPaletteOutline },
  { label: '网格', value: 'GridOutline', icon: GridOutline },
  { label: '列表', value: 'ListOutline', icon: ListOutline },
  { label: '归档', value: 'ArchiveOutline', icon: ArchiveOutline }
]

// 表单验证规则（基础UI验证，业务验证在Composable中处理）
const formRules = {
  name: [
    { required: true, message: '请输入分组名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度应在1-50个字符之间', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述长度不能超过200个字符', trigger: 'blur' }
  ]
}

// UI辅助方法
const renderIconLabel = (option: SelectOption) => {
  const iconComponent = iconOptions.find(item => item.value === option.value)?.icon
  return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
    iconComponent ? h(NIcon, null, () => h(iconComponent)) : null,
    option.label
  ])
}

// 重置表单（UI状态重置）
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    color: '#2080f0',
    icon: null
  }
  formRef.value?.restoreValidation()
}

// 监听分组变化，填充表单
watch(() => props.group, (group) => {
  if (group) {
    formData.value = { ...group }
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

// 事件处理方法（只负责UI交互）
const handleCancel = () => {
  emit('update:show', false)
}

const handleSave = async () => {
  try {
    await formRef.value?.validate()
    emit('save', { ...formData.value })
  } catch (error) {
    console.log('表单验证失败:', error)
  }
}
</script>

<style scoped>
.n-form-item {
  margin-bottom: 16px;
}

/* 颜色选择器样式优化 */
:deep(.n-color-picker-trigger) {
  width: 100%;
}
</style>