<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">重构后的订阅管理</h2>

    <!-- Loading状态 -->
    <div v-if="loading" class="text-center py-4">
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-red-500 py-4">
      错误: {{ error }}
    </div>

    <!-- 订阅列表 -->
    <div v-else>
      <!-- 添加订阅表单 -->
      <div class="mb-6 p-4 border rounded">
        <h3 class="font-semibold mb-2">添加新订阅</h3>
        <div class="flex gap-2 mb-2">
          <input
            v-model="newSubscription.name"
            placeholder="订阅名称"
            class="flex-1 px-3 py-2 border rounded"
          />
          <input
            v-model="newSubscription.url"
            placeholder="订阅链接"
            class="flex-1 px-3 py-2 border rounded"
          />
        </div>
        <button
          @click="handleAddSubscription"
          :disabled="!newSubscription.name || !newSubscription.url"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          添加订阅
        </button>
      </div>

      <!-- 订阅列表 -->
      <div class="space-y-2">
        <div
          v-for="subscription in subscriptions"
          :key="subscription.id"
          class="flex items-center justify-between p-3 border rounded"
        >
          <div>
            <h4 class="font-medium">{{ subscription.name }}</h4>
            <p class="text-sm text-gray-600 truncate">{{ subscription.url }}</p>
            <p class="text-xs text-gray-500">
              ���点数: {{ subscription.node_count || 0 }} |
              状态: {{ subscription.error ? '失败' : (subscription.last_updated ? '成功' : '待更新') }}
            </p>
          </div>
          <div class="flex gap-2">
            <button
              @click="handlePreviewSubscription(subscription)"
              class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              预览
            </button>
            <button
              @click="handleDeleteSubscription(subscription)"
              class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              删除
            </button>
          </div>
        </div>

        <div v-if="subscriptions.length === 0" class="text-center text-gray-500 py-8">
          暂无订阅
        </div>
      </div>
    </div>

    <!-- 预览模态框 -->
    <div v-if="previewData" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-2xl max-h-96 overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">订阅预览</h3>
        <div class="space-y-2">
          <p><strong>节点数:</strong> {{ previewData.nodes }}</p>
          <p><strong>协议:</strong> {{ previewData.protocols?.join(', ') || 'N/A' }}</p>
        </div>
        <button
          @click="previewData = null"
          class="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSubscription } from '@/composables/useSubscriptionRefactored';

const {
  subscriptions,
  loading,
  error,
  fetchSubscriptions,
  createSubscription,
  deleteSubscription,
  previewSubscription,
} = useSubscription();

const newSubscription = ref({ name: '', url: '' });
const previewData = ref<any>(null);

const handleAddSubscription = async () => {
  try {
    await createSubscription(newSubscription.value);
    newSubscription.value = { name: '', url: '' };
  } catch (err) {
    // Error is handled in the composable
  }
};

const handleDeleteSubscription = async (subscription: any) => {
  if (confirm(`确定要删除订阅 "${subscription.name}" 吗？`)) {
    try {
      await deleteSubscription(subscription.id);
    } catch (err) {
      // Error is handled in the composable
    }
  }
};

const handlePreviewSubscription = async (subscription: any) => {
  try {
    const data = await previewSubscription(subscription.url);
    previewData.value = data;
  } catch (err) {
    // Error is handled in the composable
  }
};

onMounted(() => {
  fetchSubscriptions();
});
</script>