/**
 * 分组表单组件
 * 用于创建和编辑节点分组
 */

<template>
  <div class="group-form">
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="top"
      class="space-y-4"
    >
      <n-form-item label="分组名称" path="name">
        <n-input
          v-model:value="formData.name"
          placeholder="请输入分组名称"
          maxlength="50"
          show-count
          @keydown.enter="handleSubmit"
        />
      </n-form-item>

      <n-form-item label="分组描述" path="description">
        <n-input
          v-model:value="formData.description"
          type="textarea"
          placeholder="请输入分组描述（可选）"
          :rows="3"
          maxlength="200"
          show-count
        />
      </n-form-item>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <n-form-item label="分组颜色" path="color">
          <div class="flex items-center space-x-2">
            <n-color-picker
              v-model:value="formData.color"
              :show-alpha="false"
              :actions="['confirm']"
              class="flex-1"
            />
            <div
              v-if="formData.color"
              class="w-8 h-8 rounded border-2 border-gray-300"
              :style="{ backgroundColor: formData.color }"
            />
          </div>
        </n-form-item>

        <n-form-item label="分组图标" path="icon">
          <n-select
            v-model:value="formData.icon"
            :options="iconOptions"
            placeholder="选择图标（可选）"
            clearable
            :render-label="renderIconLabel"
          />
        </n-form-item>
      </div>

      <!-- 编辑模式时显示额外选项 -->
      <div v-if="isEditMode" class="space-y-4 border-t border-gray-200 pt-4">
        <n-form-item>
          <n-checkbox v-model:checked="formData.is_enabled">
            启用分组
          </n-checkbox>
        </n-form-item>
      </div>

      <!-- 表单操作 -->
      <div class="flex justify-end space-x-3 pt-4">
        <n-button @click="handleCancel">
          取消
        </n-button>
        <n-button
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ isEditMode ? '更新' : '创建' }}
        </n-button>
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, h } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NButton,
  NColorPicker,
  NSelect,
  NCheckbox,
  useMessage,
  type FormInst,
  type FormRules,
  type FormValidationError
} from 'naive-ui'
import {
  FolderOutline,
  StarOutline,
  HeartOutline,
  FlagOutline,
  BookmarkOutline,
  CompassOutline,
  GlobeOutline,
  ShieldOutline,
  FlashOutline,
  LeafOutline,
  FlowerOutline,
  SunnyOutline,
  MoonOutline,
  CloudOutline,
  RocketOutline,
  AirplaneOutline,
  CarOutline,
  BicycleOutline,
  WalkOutline
} from '@vicons/ionicons5'
import type { INodeGroup, ICreateGroupDto, IUpdateGroupDto } from '@/types'

interface IProps {
  group?: INodeGroup | null
}

const props = withDefaults(defineProps<IProps>(), {
  group: null
})

const emit = defineEmits<{
  'submit': [data: ICreateGroupDto | IUpdateGroupDto]
  'cancel': []
}>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)

// 图标选项
const iconOptions = [
  { label: '文件夹', value: 'folder', icon: FolderOutline },
  { label: '星星', value: 'star', icon: StarOutline },
  { label: '心形', value: 'heart', icon: HeartOutline },
  { label: '旗帜', value: 'flag', icon: FlagOutline },
  { label: '书签', value: 'bookmark', icon: BookmarkOutline },
  { label: '指南针', value: 'compass', icon: CompassOutline },
  { label: '地球', value: 'globe', icon: GlobeOutline },
  { label: '盾牌', value: 'shield', icon: ShieldOutline },
  { label: '闪电', value: 'flash', icon: FlashOutline },
  { label: '叶子', value: 'leaf', icon: LeafOutline },
  { label: '花朵', value: 'flower', icon: FlowerOutline },
  { label: '闪光', value: 'flash', icon: FlashOutline },
  { label: '太阳', value: 'sunny', icon: SunnyOutline },
  { label: '月亮', value: 'moon', icon: MoonOutline },
  { label: '云朵', value: 'cloud', icon: CloudOutline },
  { label: '火箭', value: 'rocket', icon: RocketOutline },
  { label: '飞机', value: 'airplane', icon: AirplaneOutline },
  { label: '汽车', value: 'car', icon: CarOutline },
  { label: '自行车', value: 'bicycle', icon: BicycleOutline },
  { label: '步行', value: 'walk', icon: WalkOutline }
]

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  color: '',
  icon: '',
  is_enabled: true
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    {
      required: true,
      message: '请输入分组名称',
      trigger: ['input', 'blur']
    },
    {
      min: 1,
      max: 50,
      message: '分组名称长度为1-50个字符',
      trigger: ['input', 'blur']
    }
  ],
  description: [
    {
      max: 200,
      message: '分组描述不能超过200个字符',
      trigger: ['input', 'blur']
    }
  ]
}

// 计算属性
const isEditMode = computed(() => !!props.group)

// 渲染图标标签
const renderIconLabel = (option: any) => {
  const IconComponent = option.icon
  return h('div', { class: 'flex items-center space-x-2' }, [
    h(IconComponent, { class: 'text-base' }),
    h('span', option.label)
  ])
}

// 监听props变化
watch(() => props.group, (group) => {
  if (group) {
    // 编辑模式：填充表单数据
    Object.assign(formData, {
      name: group.name || '',
      description: group.description || '',
      color: group.color || '',
      icon: group.icon || '',
      is_enabled: group.is_enabled !== false // 默认为true
    })
  } else {
    // 创建模式：重置表单
    resetForm()
  }
}, { immediate: true })

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    name: '',
    description: '',
    color: '',
    icon: '',
    is_enabled: true
  })
}

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    loading.value = true
    await formRef.value.validate()

    const submitData = { ...formData }

    // 清理空字符串
    Object.keys(submitData).forEach(key => {
      if (submitData[key as keyof typeof submitData] === '') {
        (submitData as any)[key] = undefined
      }
    })

    emit('submit', submitData)
  } catch (error) {
    if (error && Array.isArray(error)) {
      // 表单验证错误
      console.error('Form validation errors:', error)
    } else {
      // 其他错误
      console.error('Submit error:', error)
      message.error('提交失败，请检查表单数据')
    }
  } finally {
    loading.value = false
  }
}

// 处理取消
const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.group-form {
  @apply space-y-4;
}

/* 自定义颜色选择器样式 */
:deep(.n-color-picker-trigger) {
  @apply w-full h-10;
}

/* 图标选择器样式 */
:deep(.n-base-selection .n-base-selection-label) {
  @apply flex items-center;
}

/* 表单项间距 */
:deep(.n-form-item) {
  @apply mb-4;
}

:deep(.n-form-item:last-child) {
  @apply mb-0;
}
</style>