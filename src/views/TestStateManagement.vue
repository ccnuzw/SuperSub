<template>
  <div class="test-state-management p-6">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">状态管理重构测试</h1>

      <!-- Groups Store 测试区域 -->
      <div class="mb-8 p-4 border rounded-lg">
        <h2 class="text-xl font-semibold mb-4">Groups Store 测试</h2>

        <div class="flex gap-4 mb-4">
          <n-button @click="testGroupStoreFetch" :loading="groupStore.loading">
            测试获取分组
          </n-button>
          <n-button @click="testAddGroup" type="primary">
            测试添加分组
          </n-button>
          <n-button @click="testGroupStats" type="info">
            查看统计
          </n-button>
          <n-button @click="resetGroupStore" type="warning">
            重置状态
          </n-button>
        </div>

        <!-- 分组列表 -->
        <div class="space-y-2">
          <div v-if="groupStore.loading" class="text-center p-4">
            <n-spin />
          </div>
          <div v-else-if="groupStore.error" class="text-red-500 p-4">
            错误: {{ groupStore.error }}
          </div>
          <div v-else>
            <div class="text-sm text-gray-600 mb-2">
              共 {{ groupStore.groups.length }} 个分组
            </div>
            <div
              v-for="group in groupStore.groups"
              :key="group.id"
              class="p-3 border rounded flex items-center justify-between"
            >
              <div>
                <div class="font-medium">{{ group.name }}</div>
                <div class="text-sm text-gray-500" v-if="group.description">
                  {{ group.description }}
                </div>
                <div class="text-xs text-gray-400">
                  创建于: {{ formatDate(group.created_at) }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <n-tag :type="group.is_enabled ? 'success' : 'default'">
                  {{ group.is_enabled ? '启用' : '禁用' }}
                </n-tag>
                <n-button size="small" @click="toggleGroup(group.id)">
                  切换
                </n-button>
                <n-button size="small" type="error" @click="deleteGroup(group.id)">
                  删除
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SubscriptionGroups Store 测试区域 -->
      <div class="mb-8 p-4 border rounded-lg">
        <h2 class="text-xl font-semibold mb-4">SubscriptionGroups Store 测试</h2>

        <div class="flex gap-4 mb-4">
          <n-button @click="testSubscriptionGroupStoreFetch" :loading="subscriptionGroupStore.loading">
            测试获取订阅分组
          </n-button>
          <n-button @click="testAddSubscriptionGroup" type="primary">
            测试添加订阅分组
          </n-button>
          <n-button @click="testSubscriptionGroupStats" type="info">
            查看统计
          </n-button>
          <n-button @click="testSortGroups" type="success">
            测试排序
          </n-button>
          <n-button @click="testSearch" type="warning">
            测试搜索
          </n-button>
        </div>

        <!-- 订阅分组列表 -->
        <div class="space-y-2">
          <div v-if="subscriptionGroupStore.loading" class="text-center p-4">
            <n-spin />
          </div>
          <div v-else-if="subscriptionGroupStore.error" class="text-red-500 p-4">
            错误: {{ subscriptionGroupStore.error }}
          </div>
          <div v-else>
            <div class="text-sm text-gray-600 mb-2">
              共 {{ subscriptionGroupStore.groups.length }} 个订阅分组
            </div>
            <div
              v-for="group in subscriptionGroupStore.groups"
              :key="group.id"
              class="p-3 border rounded flex items-center justify-between"
            >
              <div>
                <div class="font-medium">{{ group.name }}</div>
                <div class="text-sm text-gray-500" v-if="group.description">
                  {{ group.description }}
                </div>
                <div class="text-xs text-gray-400">
                  创建于: {{ formatDate(group.created_at) }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <n-tag :type="group.is_enabled ? 'success' : 'default'">
                  {{ group.is_enabled ? '启用' : '禁用' }}
                </n-tag>
                <n-button size="small" @click="toggleSubscriptionGroup(group.id)">
                  切换
                </n-button>
                <n-button size="small" type="error" @click="deleteSubscriptionGroup(group.id)">
                  删除
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 测试结果 -->
      <div class="p-4 bg-gray-50 rounded-lg">
        <h2 class="text-xl font-semibold mb-4">测试结果</h2>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" :class="testResults.groups ? 'bg-green-500' : 'bg-red-500'"></div>
            <span>Groups Store: {{ testResults.groups ? '通过' : '失败' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" :class="testResults.subscriptionGroups ? 'bg-green-500' : 'bg-red-500'"></div>
            <span>SubscriptionGroups Store: {{ testResults.subscriptionGroups ? '通过' : '失败' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NButton, NSpin, NTag } from 'naive-ui';
import { useGroupStore } from '@/stores/newGroups';
import { useSubscriptionGroupStore } from '@/stores/newSubscriptionGroups';
import { runAllStateManagementTests } from '@/utils/testStores';

// Stores
const groupStore = useGroupStore();
const subscriptionGroupStore = useSubscriptionGroupStore();

// 测试结果
const testResults = ref({
  groups: false,
  subscriptionGroups: false
});

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

// Groups Store 测试方法
const testGroupStoreFetch = async () => {
  try {
    await groupStore.fetchGroups();
    testResults.value.groups = true;
  } catch (error) {
    console.error('获取分组失败:', error);
    testResults.value.groups = false;
  }
};

const testAddGroup = async () => {
  try {
    const response = await groupStore.addGroup(
      `测试分组 ${Date.now()}`,
      `这是自动生成的测试分组`
    );
    if (response.success) {
      testResults.value.groups = true;
    }
  } catch (error) {
    console.error('添加分组失败:', error);
  }
};

const testGroupStats = () => {
  const stats = groupStore.getGroupStats();
  alert(`分组统计:\n总计: ${stats.total}\n启用: ${stats.enabled}\n禁用: ${stats.disabled}`);
};

const toggleGroup = async (id: string) => {
  await groupStore.toggleGroup(id);
};

const deleteGroup = async (id: string) => {
  if (confirm('确定要删除这个分组吗？')) {
    await groupStore.deleteGroup(id);
  }
};

const resetGroupStore = () => {
  groupStore.reset();
};

// SubscriptionGroups Store 测试方法
const testSubscriptionGroupStoreFetch = async () => {
  try {
    await subscriptionGroupStore.fetchGroups();
    testResults.value.subscriptionGroups = true;
  } catch (error) {
    console.error('获取订阅分组失败:', error);
    testResults.value.subscriptionGroups = false;
  }
};

const testAddSubscriptionGroup = async () => {
  try {
    const response = await subscriptionGroupStore.addGroup(
      `测试订阅分组 ${Date.now()}`,
      `这是自动生成的测试订阅分组`
    );
    if (response.success) {
      testResults.value.subscriptionGroups = true;
    }
  } catch (error) {
    console.error('添加订阅分组失败:', error);
  }
};

const testSubscriptionGroupStats = () => {
  const stats = subscriptionGroupStore.getGroupStats();
  alert(`订阅分组统计:\n总计: ${stats.total}\n启用: ${stats.enabled}\n禁用: ${stats.disabled}\n有描述: ${stats.withDescription}`);
};

const testSortGroups = () => {
  subscriptionGroupStore.sortGroupsByName(true);
  setTimeout(() => {
    subscriptionGroupStore.sortGroupsByCreatedDate(false);
  }, 1000);
};

const testSearch = () => {
  const results = subscriptionGroupStore.searchGroups('测试');
  alert(`搜索结果: ${results.length} 个分组`);
};

const toggleSubscriptionGroup = async (id: string) => {
  await subscriptionGroupStore.toggleGroup(id);
};

const deleteSubscriptionGroup = async (id: string) => {
  if (confirm('确定要删除这个订阅分组吗？')) {
    await subscriptionGroupStore.deleteGroup(id);
  }
};

// 生命周期
onMounted(async () => {
  console.log('🚀 开始状态管理测试...');

  // 运行自动化测试
  const allTestsPassed = await runAllStateManagementTests();

  // 更新测试结果
  testResults.value = {
    groups: allTestsPassed,
    subscriptionGroups: allTestsPassed
  };

  console.log('📊 测试完成:', allTestsPassed ? '全部通过' : '部分失败');
});
</script>

<style scoped>
.test-state-management {
  background-color: #f9fafb;
  min-height: 100vh;
}
</style>