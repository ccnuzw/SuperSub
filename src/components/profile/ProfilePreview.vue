/**
 * 重构后的配置文件预览组件
 * 使用小组件组合，提高可维护性
 */

<template>
  <div class="profile-preview">
    <SsCard class="mb-6">
      <template #header>
        <PreviewHeader
          :refreshing="refreshing"
          @refresh="refreshPreview"
          @copy-url="handleCopyUrl"
        />
      </template>

      <!-- 统计信息 -->
      <PreviewStats :preview-data="previewData" />

      <!-- 生成状态 -->
      <GenerationStatus
        v-if="generating"
        message="正在生成配置..."
        sub-message="这可能需要几秒钟时间"
      />

      <!-- 预览内容 -->
      <div v-else-if="previewData" class="space-y-4">
        <!-- 协议分布 -->
        <ProtocolDistribution
          :protocols="previewData.analysis.protocols"
        />

        <!-- 地区分布 -->
        <RegionDistribution
          :regions="previewData.analysis.regions"
        />

        <!-- 配置内容预览 -->
        <ContentPreview :content="previewData.content" />

        <!-- 生成日志 -->
        <GenerationLogs :logs="previewData.logs" />
      </div>

      <!-- 空状态 -->
      <PreviewEmpty
        v-else-if="!generating"
        title="暂无预览数据"
        subtitle="请先生成配置文件预览"
        button-text="生成预览"
        :loading="generating"
        @generate="generatePreview"
      />
    </SsCard>

    <!-- 链接复制弹窗 -->
    <NModal v-model:show="showUrlModal" preset="card" style="width: 500px;" title="订阅链接">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">订阅链接</label>
          <div class="flex space-x-2">
            <SsInput
              v-model="generatedUrl"
              readonly
              class="flex-1"
            />
            <SsButton
              variant="outline"
              @click="copyUrl"
            >
              复制
            </SsButton>
          </div>
        </div>

        <div class="text-sm text-gray-500">
          此链接可用于在客户端软件中导入配置文件。请妥善保管，不要泄露给他人。
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <SsButton @click="(event: MouseEvent) => { showUrlModal = false }">
            关闭
          </SsButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMessage } from 'naive-ui';
import { NModal } from 'naive-ui';
import { SsCard, SsButton, SsInput } from '@/components/base';
import {
  PreviewHeader,
  PreviewStats,
  ProtocolDistribution,
  RegionDistribution,
  ContentPreview,
  GenerationLogs,
  GenerationStatus,
  PreviewEmpty
} from './preview';
import { usePreview } from '@/composables/usePreview';

interface Props {
  // 配置ID
  profileId?: string | null;
  // 配置别名
  profileAlias?: string;
  // 是否自动生成预览
  autoGenerate?: boolean;
  // 生成间隔（毫秒）
  generateInterval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  autoGenerate: false,
  generateInterval: 30000 // 30秒
});

const emit = defineEmits<{
  generate: [profileId: string];
  refresh: [];
}>();

const message = useMessage();

// 使用预览组合式函数
const {
  generating,
  refreshing,
  previewData,
  generatedUrl,
  generatePreview,
  refreshPreview,
  copyUrl
} = usePreview({
  profileId: props.profileId,
  profileAlias: props.profileAlias,
  autoGenerate: props.autoGenerate,
  generateInterval: props.generateInterval
});

// 链接复制弹窗
const showUrlModal = ref(false);

// 方法
const handleCopyUrl = async () => {
  try {
    const url = await copyUrl();
    if (url) {
      showUrlModal.value = true;
    }
  } catch (error) {
    // 错误已在组合式函数中处理
  }
};

// 监听生成完成事件
generatePreview().then((data) => {
  if (data && props.profileId) {
    emit('generate', props.profileId);
  }
});
</script>

<style scoped>
.profile-preview {
  @apply space-y-6;
}

/* 动画效果 */
.preview-section,
.stat-card {
  @apply transition-all duration-200;
}

.preview-section:hover {
  @apply shadow-sm;
}

/* 响应式优化 */
@media (max-width: 640px) {
  .grid-cols-1 {
    @apply grid-cols-2;
  }

  .grid-cols-4 {
    @apply grid-cols-2 gap-2;
  }

  .grid-cols-2.md\:grid-cols-4 {
    @apply grid-cols-1;
  }
}
</style>