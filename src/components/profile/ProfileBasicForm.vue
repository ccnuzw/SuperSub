/**
 * 配置文件基础表单组件
 * 负责管理基本信息和配置
 */

<template>
  <div class="profile-form">
    <SsCard>
      <template #header>
        <h3 class="text-lg font-semibold">基本信息</h3>
      </template>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- 基本信息 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SsInput
              v-model="formData.name"
              label="配置名称"
              placeholder="请输入配置名称"
              required
              :error="errors.name"
              @blur="validateField('name')"
            />
          </div>

          <div>
            <SsInput
              v-model="formData.alias"
              label="访问别名"
              placeholder="用于生成订阅链接的别名"
              help-text="留空则使用配置名称"
              :error="errors.alias"
              @blur="validateField('alias')"
            />
          </div>
        </div>

        <!-- 生成模式 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            生成模式
          </label>
          <NRadioGroup v-model:value="formData.generation_mode" name="generation_mode">
            <NSpace>
              <NRadio value="local" label="本地生成" />
              <NRadio value="remote" label="远程生成" />
            </NSpace>
          </NRadioGroup>
          <p class="mt-2 text-sm text-gray-500">
            本地生成：在服务器本地处理；远程生成：使用外部subconverter服务
          </p>
        </div>

        <!-- 远程生成设置 -->
        <div v-if="formData.generation_mode === 'remote'" class="space-y-4">
          <h4 class="text-md font-medium text-gray-800">远程生成设置</h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Subconverter后端
              </label>
              <NSelect
                v-model:value="formData.subconverter_backend_id"
                placeholder="选择后端服务"
                :options="backendOptions"
                clearable
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                配置文件模板
              </label>
              <NSelect
                v-model:value="formData.subconverter_config_id"
                placeholder="选择配置模板"
                :options="configOptions"
                clearable
              />
            </div>
          </div>
        </div>

        <!-- 节点前缀设置 -->
        <div>
          <h4 class="text-md font-medium text-gray-800 mb-4">节点前缀设置</h4>

          <div class="space-y-3">
            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                v-model="formData.node_prefix_settings.enable_subscription_prefix"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="text-sm font-medium">启用订阅源前缀</span>
            </label>

            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                v-model="formData.node_prefix_settings.enable_group_name_prefix"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="text-sm font-medium">启用分组名前缀</span>
            </label>

            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                v-model="formData.node_prefix_settings.manual_nodes_first"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="text-sm font-medium">手动节点优先显示</span>
            </label>

            <div>
              <SsInput
                v-model="formData.node_prefix_settings.manual_node_prefix"
                label="自定义前缀"
                placeholder="为所有手动节点添加的前缀"
                help-text="留空则不添加自定义前缀"
              />
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <SsButton
            variant="outline"
            @click="handleCancel"
          >
            取消
          </SsButton>
          <SsButton
            type="submit"
            :loading="loading"
            @click="handleSubmit"
          >
            {{ isEditing ? '更新' : '创建' }}
          </SsButton>
        </div>
      </form>
    </SsCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { NRadioGroup, NRadio, NSpace, NSelect } from 'naive-ui';
import { SsCard, SsInput, SsButton } from '@/components/base';
import type { SelectOption } from 'naive-ui';

interface ProfileForm {
  name: string;
  alias: string;
  generation_mode: 'local' | 'remote';
  subconverter_backend_id: number | null;
  subconverter_config_id: number | null;
  node_prefix_settings: {
    enable_subscription_prefix: boolean;
    manual_node_prefix: string;
    enable_group_name_prefix: boolean;
    manual_nodes_first: boolean;
  };
}

export interface ValidationErrors {
  name?: string;
  alias?: string;
  [key: string]: string | undefined;
}

interface Props {
  // 编辑时的配置ID
  profileId?: string | null;
  // 是否为编辑模式
  editing?: boolean;
  // 初始表单数据
  initialData?: Partial<ProfileForm>;
}

const props = withDefaults(defineProps<Props>(), {
  profileId: null,
  editing: false,
  initialData: () => ({})
});

const emit = defineEmits<{
  submit: [data: ProfileForm];
  cancel: [];
  validation: [errors: ValidationErrors];
}>();

const message = useMessage();

// 响应式数据
const loading = ref(false);
const backendOptions = ref<SelectOption[]>([]);
const configOptions = ref<SelectOption[]>([]);

const defaultFormData: ProfileForm = {
  name: '',
  alias: '',
  generation_mode: 'local',
  subconverter_backend_id: null,
  subconverter_config_id: null,
  node_prefix_settings: {
    enable_subscription_prefix: false,
    manual_node_prefix: '',
    enable_group_name_prefix: false,
    manual_nodes_first: false
  }
};

const formData = ref<ProfileForm>({
  ...defaultFormData,
  ...props.initialData
});

const errors = ref<ValidationErrors>({});

const isEditing = computed(() => !!props.profileId);

// 方法
const validateField = (field: keyof ProfileForm) => {
  switch (field) {
    case 'name':
      if (!formData.value.name.trim()) {
        errors.value.name = '配置名称不能为空';
      } else if (formData.value.name.length > 100) {
        errors.value.name = '配置名称不能超过100个字符';
      } else {
        delete errors.value.name;
      }
      break;

    case 'alias':
      if (formData.value.alias && formData.value.alias.length > 50) {
        errors.value.alias = '别名不能超过50个字符';
      } else if (formData.value.alias && !/^[a-zA-Z0-9_-]+$/.test(formData.value.alias)) {
        errors.value.alias = '别名只能包含字母、数字、下划线和连字符';
      } else {
        delete errors.value.alias;
      }
      break;
  }

  emit('validation', errors.value);
};

const validateForm = (): boolean => {
  validateField('name');
  validateField('alias');

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = () => {
  if (!validateForm()) {
    message.error('请修正表单中的错误');
    return;
  }

  emit('submit', { ...formData.value });
};

const handleCancel = () => {
  emit('cancel');
};

const fetchBackendOptions = async () => {
  try {
    // 这里应该调用API获取后端选项
    // 暂时使用模拟数据
    backendOptions.value = [
      { label: 'CM负载均衡后端', value: 1 },
      { label: 'CM应急备用后端', value: 2 },
      { label: '肥羊增强型后端', value: 3 }
    ];
  } catch (error) {
    message.error('获取后端选项失败');
  }
};

const fetchConfigOptions = async () => {
  try {
    // 这里应该调用API获取配置选项
    // 暂时使用模拟数据
    configOptions.value = [
      { label: 'CM_Online 默认版', value: 101 },
      { label: 'CM_Online_MultiCountry', value: 102 },
      { label: 'ACL_默认版', value: 301 }
    ];
  } catch (error) {
    message.error('获取配置选项失败');
  }
};

// 监听器
watch(() => props.initialData, (newData) => {
  if (newData) {
    formData.value = {
      ...defaultFormData,
      ...newData
    };
  }
}, { deep: true });

// 当生成模式切换时，清空远程生成相关字段
watch(() => formData.value.generation_mode, (newMode) => {
  if (newMode === 'local') {
    formData.value.subconverter_backend_id = null;
    formData.value.subconverter_config_id = null;
  }
});

// 生命周期
onMounted(() => {
  fetchBackendOptions();
  fetchConfigOptions();
});

// 暴露方法和属性
defineExpose({
  validateForm,
  getFormData: () => ({ ...formData.value }),
  resetForm: () => {
    formData.value = {
      ...defaultFormData,
      ...props.initialData
    };
    errors.value = {};
  },
  setFormData: (data: Partial<ProfileForm>) => {
    formData.value = { ...formData.value, ...data };
  }
});
</script>

<style scoped>
.profile-form {
  @apply max-w-4xl mx-auto;
}

/* 表单样式优化 */
form {
  @apply space-y-6;
}

.grid-cols-1 {
  @apply grid-cols-1;
}

@media (min-width: 768px) {
  .grid-cols-1 {
    @apply grid-cols-2;
  }
}

/* 动画效果 */
.profile-form {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 输入框焦点优化 */
input:focus,
textarea:focus,
select:focus {
  @apply ring-2 ring-primary-500 ring-offset-2;
}

/* 错误状态 */
.input-error {
  @apply border-error-500 ring-error-500;
}

/* 帮助文本样式 */
.help-text {
  @apply text-sm text-gray-500 mt-1;
}

/* 按钮组样式 */
.button-group {
  @apply flex space-x-4;
}

/* 响应式优化 */
@media (max-width: 640px) {
  .profile-form {
    @apply mx-4;
  }

  .button-group {
    @apply flex-col space-x-0 space-y-2;
  }

  .button-group button {
    @apply w-full;
  }
}
</style>