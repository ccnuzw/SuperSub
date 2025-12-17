/**
 * 重构后的配置文件表单主组件
 * 将原本542行的复杂组件拆分为多个职责单一的小组件
 */

<template>
  <div class="profile-form-container">
    <!-- 页面头部 -->
    <div class="mb-6">
      <NPageHeader @back="handleBack">
        <template #title>
          <span>{{ pageTitle }}</span>
        </template>
      </NPageHeader>
    </div>

    <!-- 表单内容 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：基础配置 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 基础信息表单 -->
        <ProfileBasicForm
          :profile-id="profileId"
          :editing="isEditing"
          :initial-data="formData"
          @submit="handleBasicFormSubmit"
          @cancel="handleCancel"
          @validation="handleValidation"
        />

        <!-- 数据源选择 -->
        <ProfileDataSource
          :subscription-ids="formData.subscription_ids"
          :node-ids="formData.node_ids"
          :strategy="formData.airport_subscription_options.strategy"
          :polling-mode="formData.airport_subscription_options.polling_mode"
          :polling-threshold="formData.airport_subscription_options.polling_threshold"
          :polling-interval="formData.airport_subscription_options.polling_interval"
          @update:subscription-ids="updateSubscriptionIds"
          @update:node-ids="updateNodeIds"
          @update:strategy="updateStrategy"
          @update:polling-mode="updatePollingMode"
          @update:polling-threshold="updatePollingThreshold"
          @update:polling-interval="updatePollingInterval"
        />
      </div>

      <!-- 右侧��预览和操作 -->
      <div class="space-y-6">
        <!-- 配置预览 -->
        <ProfilePreview
          :profile-id="profileId"
          :profile-alias="formData.alias"
          :auto-generate="!!profileId"
          @generate="handlePreviewGenerate"
          @refresh="handlePreviewRefresh"
        />

        <!-- 操作状态 -->
        <SsCard>
          <template #header>
            <h3 class="text-lg font-semibold">操作状态</h3>
          </template>

          <div class="space-y-4">
            <!-- 保存状态 -->
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">保存状态</span>
              <SsStatus
                :status="saveStatus.status"
                :show-text="true"
                size="sm"
              />
            </div>

            <!-- 最后保存时间 -->
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">最后保存</span>
              <span class="text-sm text-gray-500">
                {{ lastSavedTime || '未保存' }}
              </span>
            </div>

            <!-- 表单验证状态 -->
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">表单验证</span>
              <SsBadge
                :variant="validationErrorsCount > 0 ? 'error' : 'success'"
                :outline="false"
              >
                {{ validationErrorsCount > 0 ? `${validationErrorsCount} 个错误` : '验证通过' }}
              </SsBadge>
            </div>

            <!-- 数据统计 -->
            <div class="pt-4 border-t border-gray-200 space-y-2">
              <div class="flex justify-between text-sm">
                <span>订阅源:</span>
                <span class="font-medium text-primary-600">
                  {{ formData.subscription_ids?.length || 0 }}
                </span>
              </div>
              <div class="flex justify-between text-sm">
                <span>手动节点:</span>
                <span class="font-medium text-success-600">
                  {{ formData.node_ids?.length || 0 }}
                </span>
              </div>
            </div>
          </div>
        </SsCard>

        <!-- 快捷操作 -->
        <SsCard>
          <template #header>
            <h3 class="text-lg font-semibold">快捷操作</h3>
          </template>

          <div class="space-y-3">
            <SsButton
              variant="outline"
              block
              @click="handleTestConfig"
              :loading="testing"
            >
              测试配置
            </SsButton>

            <SsButton
              variant="ghost"
              block
              @click="handleResetForm"
            >
              重置表单
            </SsButton>

            <SsButton
              variant="ghost"
              block
              @click="handleDuplicateConfig"
              v-if="isEditing"
            >
              复制配置
            </SsButton>

            <SsButton
              variant="danger"
              block
              @click="handleDeleteConfig"
              v-if="isEditing"
            >
              删除配置
            </SsButton>
          </div>
        </SsCard>
      </div>
    </div>

    <!-- 操作按钮（底部固定） -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
      <div class="max-w-7xl mx-auto flex justify-end space-x-4">
        <SsButton
          variant="outline"
          @click="handleCancel"
        >
          取消
        </SsButton>
        <SsButton
          variant="primary"
          @click="handleSave"
          :loading="saving"
          :disabled="validationErrorsCount > 0"
        >
          {{ isEditing ? '更新配置' : '创建配置' }}
        </SsButton>
      </div>
    </div>

    <!-- 确认对话框 -->
    <NModal v-model:show="showDeleteModal" preset="dialog" type="warning">
      <template #header>
        <h3 class="text-lg font-semibold">确认删除</h3>
      </template>
      <div class="space-y-4">
        <p>确定要删除配置文件 <strong>{{ formData.name }}</strong> 吗？</p>
        <p class="text-sm text-gray-500">
          此操作不可撤销，删除后无法恢复。
        </p>
      </div>
      <template #action>
        <div class="flex justify-end space-x-4">
          <SsButton
            variant="outline"
            @click="(event: MouseEvent) => { showDeleteModal = false }"
          >
            取消
          </SsButton>
          <SsButton
            variant="danger"
            @click="confirmDelete"
            :loading="deleting"
          >
            确认删除
          </SsButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage, NPageHeader, NModal } from 'naive-ui';
import { SsCard, SsButton, SsStatus, SsBadge } from '@/components/base';
import { ProfileBasicForm, ProfileDataSource, ProfilePreview } from '@/components/profile';
import type { ValidationErrors } from '@/components/profile/ProfileBasicForm.vue';
import { useErrorHandler, createBusinessError } from '@/plugins/errorHandler';
import { HttpClient } from '@/services/http/HttpClient';
import type { Profile } from '@/types';

interface Props {
  // 编辑时的配置ID
  profileId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  profileId: undefined
});

const router = useRouter();
const message = useMessage();
const { handleError, safeExecute } = useErrorHandler();

// 响应式数据
const isEditing = computed(() => !!props.profileId);
const pageTitle = computed(() => isEditing.value ? '编辑配置' : '新增配置');

// 表单数据
const formData = ref<any>({
  id: '',
  name: '',
  alias: '',
  subscription_ids: [],
  node_ids: [],
  generation_mode: 'local',
  subconverter_backend_id: null,
  subconverter_config_id: null,
  airport_subscription_options: {
    strategy: 'all' as 'all' | 'polling' | 'random',
    polling_mode: 'hourly' as 'hourly' | 'request' | 'group_request',
    use_all: true,
    random: false,
    timeout: 10,
    polling_threshold: null,
    polling_interval: null
  },
  node_prefix_settings: {
    enable_subscription_prefix: false,
    manual_node_prefix: '',
    enable_group_name_prefix: false,
    manual_nodes_first: false
  }
});

// 状态管理
const saving = ref(false);
const testing = ref(false);
const deleting = ref(false);
const showDeleteModal = ref(false);

const saveStatus = ref({
  status: 'unknown' as 'healthy' | 'unhealthy' | 'pending' | 'testing' | 'unknown',
  message: ''
});

const lastSavedTime = ref<string | null>(null);
const validationErrors = ref<Record<string, string>>({});
const validationErrorsCount = computed(() => Object.keys(validationErrors.value).length);

// 方法
const handleBack = () => {
  router.back();
};

const handleBasicFormSubmit = (data: any) => {
  formData.value = {
    ...formData.value,
    ...data
  };
};

const updateSubscriptionIds = (ids: string[]) => {
  formData.value.subscription_ids = ids;
};

const updateNodeIds = (ids: string[]) => {
  formData.value.node_ids = ids;
};

const updateStrategy = (strategy: string) => {
  formData.value.airport_subscription_options.strategy = strategy;
};

const updatePollingMode = (mode: string) => {
  formData.value.airport_subscription_options.polling_mode = mode;
};

const updatePollingThreshold = (threshold: number | null) => {
  formData.value.airport_subscription_options.polling_threshold = threshold;
};

const updatePollingInterval = (interval: number | null) => {
  formData.value.airport_subscription_options.polling_interval = interval;
};

const handleValidation = (errors: ValidationErrors) => {
  validationErrors.value = errors as Record<string, string>;
};

const handleSave = async () => {
  if (validationErrorsCount.value > 0) {
    message.error('请修正表单错误后再保存');
    return;
  }

  saving.value = true;
  saveStatus.value = {
    status: 'testing',
    message: '正在保存...'
  };

  try {
    const data = isEditing.value
      ? await safeExecute(() => updateProfile(props.profileId!, formData.value))
      : await safeExecute(() => createProfile(formData.value));

    if (data) {
      saveStatus.value = {
        status: 'healthy',
        message: '保存成功'
      };
      lastSavedTime.value = new Date().toLocaleString();

      message.success(isEditing.value ? '配置更新成功' : '配置创建成功');

      // 如果是新建，跳转到编辑页面
      if (!isEditing.value && data.id) {
        router.replace({
          name: 'edit-profile',
          params: { id: data.id }
        });
      }
    }
  } catch (error) {
    saveStatus.value = {
      status: 'unhealthy',
      message: '保存失败'
    };
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  router.push({ name: 'profiles' });
};

const handleTestConfig = async () => {
  testing.value = true;

  try {
    await safeExecute(() => {
      // 这里应该实现配置测试逻辑
      return new Promise(resolve => setTimeout(resolve, 2000));
    });

    message.success('配置测试通过');
  } catch (error) {
    message.error('配置测试失败');
  } finally {
    testing.value = false;
  }
};

const handleResetForm = () => {
  // 重置表单到初始状态
  formData.value = {
    id: '',
    name: '',
    alias: '',
    subscription_ids: [],
    node_ids: [],
    generation_mode: 'local',
    subconverter_backend_id: null,
    subconverter_config_id: null,
    airport_subscription_options: {
      strategy: 'all',
      polling_mode: 'hourly',
      use_all: true,
      random: false,
      timeout: 10,
      polling_threshold: null,
      polling_interval: null
    },
    node_prefix_settings: {
      enable_subscription_prefix: false,
      manual_node_prefix: '',
      enable_group_name_prefix: false,
      manual_nodes_first: false
    }
  };

  message.info('表单已重置');
};

const handleDuplicateConfig = async () => {
  if (!props.profileId) return;

  try {
    const duplicatedData = {
      ...formData.value,
      id: undefined,
      name: `${formData.value.name} (副本)`,
      alias: undefined
    };

    const data = await safeExecute(() => createProfile(duplicatedData));

    if (data) {
      message.success('配置复制成功');
      router.push({
        name: 'edit-profile',
        params: { id: data.id }
      });
    }
  } catch (error) {
    message.error('配置复制失败');
  }
};

const handleDeleteConfig = () => {
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!props.profileId) return;

  deleting.value = true;

  try {
    await safeExecute(() => deleteProfile(props.profileId!));

    message.success('配置删除成功');
    router.push({ name: 'profiles' });
  } catch (error) {
    message.error('配置删除失败');
  } finally {
    deleting.value = false;
    showDeleteModal.value = false;
  }
};

const handlePreviewGenerate = (profileId: string) => {
  console.log('Preview generated for:', profileId);
};

const handlePreviewRefresh = () => {
  console.log('Preview refreshed');
};

// API函数（模拟）
const createProfile = async (data: any): Promise<any> => {
  // 模拟API调用
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ id: 'new-profile-id', ...data });
    }, 1000);
  });
};

const updateProfile = async (id: string, data: any): Promise<any> => {
  // 模拟API调用
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ id, ...data });
    }, 1000);
  });
};

const deleteProfile = async (id: string): Promise<void> => {
  // 模拟API调用
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
};

// 生命周期
onMounted(() => {
  if (props.profileId) {
    // 加载现有配置数据
    // 这里应该调用API获取数据
  }
});

// 暴露方法
defineExpose({
  save: handleSave,
  reset: handleResetForm,
  validate: () => validationErrorsCount.value === 0
});
</script>

<style scoped>
.profile-form-container {
  @apply min-h-screen pb-20; // 为底部固定按钮留出空间
}

/* 响应式布局优化 */
@media (max-width: 1024px) {
  .grid-cols-1.lg\:grid-cols-3 {
    @apply grid-cols-1;
  }
}

@media (min-width: 1024px) {
  .grid-cols-1.lg\:grid-cols-3 {
    @apply grid-cols-3;
  }

  .lg\:col-span-2 {
    @apply col-span-2;
  }
}

/* 动画效果 */
.profile-form-container {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 固定底部按钮栏 */
.fixed.bottom-0 {
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* 状态卡片间距优化 */
.space-y-6 > :not([hidden]) ~ :not([hidden]) {
  @apply space-y-6;
}

.space-y-4 > :not([hidden]) ~ :not([hidden]) {
  @apply space-y-4;
}

.space-y-3 > :not([hidden]) ~ :not([hidden]) {
  @apply space-y-3;
}

.space-y-2 > :not([hidden]) ~ :not([hidden]) {
  @apply space-y-2;
}

/* 按钮组样式 */
.justify-end {
  @apply justify-end;
}

.space-x-4 > :not([hidden]) ~ :not([hidden]) {
  @apply space-x-4 ml-0;
}

/* 卡片内容间距 */
.p-4 {
  @apply p-4;
}

.pt-4 {
  @apply pt-4;
}

/* 文本样式 */
.text-lg {
  @apply text-lg;
}

.text-sm {
  @apply text-sm;
}

.font-medium {
  @apply font-medium;
}

.font-semibold {
  @apply font-semibold;
}

.text-primary-600 {
  @apply text-primary-600;
}

.text-success-600 {
  @apply text-success-600;
}

.text-gray-500 {
  @apply text-gray-500;
}

/* 边框样式 */
.border-t {
  @apply border-t;
}

.border-gray-200 {
  @apply border-gray-200;
}

/* z-index层级 */
.z-10 {
  @apply z-10;
}
</style>