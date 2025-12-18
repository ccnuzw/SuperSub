/**
 * 重构后的配置文件列表视图
 * 简化逻辑，使用新的组件架构和设计系统
 */

<template>
  <div class="profiles-view">
    <!-- 内容包装器 -->
    <div class="content-wrapper">
    <!-- 页面头部 -->
    <div class="mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">配置文件管理</h1>
          <p class="text-gray-600 mt-1">管理和导出您的代理配置文件</p>
        </div>
        <div class="flex space-x-3">
          <SsButton
            variant="outline"
            @click="handleImportConfig"
          >
            导入配置
          </SsButton>
          <SsButton
            variant="primary"
            @click="handleCreateConfig"
          >
            新建配置
          </SsButton>
        </div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="bg-white p-4 rounded-lg border border-gray-200 mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- 搜索和筛选 -->
        <div class="flex flex-col sm:flex-row gap-3 flex-1">
          <div class="relative flex-1 max-w-md">
            <SsInput
              v-model="searchQuery"
              placeholder="搜索配置名称或别名..."
              prefix-icon="Search"
              clearable
              @input="handleSearch"
            />
          </div>

          <div class="flex gap-2">
            <NSelect
              v-model:value="statusFilter"
              placeholder="状态筛选"
              clearable
              :options="statusOptions"
              class="w-[120px]"
            />

            <NSelect
              v-model:value="sortBy"
              placeholder="排序方式"
              :options="sortOptions"
              class="w-[140px]"
            />

            <SsButton
              variant="ghost"
              @click="toggleSortOrder"
              :title="sortOrder === 'asc' ? '升序' : '降序'"
            >
              <svg class="w-4 h-4" :class="{ 'rotate-180': sortOrder === 'desc' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4v12m0 0l4-4m6 0v12m0 0l4-4m-4 4V4" />
              </svg>
            </SsButton>
          </div>
        </div>

        <!-- 批量操作 -->
        <div class="flex items-center gap-2">
          <SsButton
            variant="outline"
            size="sm"
            @click="handleRefresh"
            :loading="refreshing"
          >
            刷新
          </SsButton>

          <NDropdown
            v-if="selectedProfiles.length > 0"
            :options="batchActions"
            placement="bottom-end"
            @select="handleBatchAction"
          >
            <SsButton variant="outline">
              批量操作 ({{ selectedProfiles.length }})
              <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </SsButton>
          </NDropdown>
        </div>
      </div>
    </div>

    <!-- 配置列表 -->
    <div class="bg-white rounded-lg border border-gray-200">
      <!-- 列表头部 -->
      <div class="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate="isIndeterminateSelected"
            @change="handleSelectAll"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span class="ml-3 text-sm font-medium text-gray-700">
            共 {{ totalCount }} 个配置文件
          </span>
        </div>
      </div>

      <!-- 配置项列表 -->
      <div class="divide-y divide-gray-200">
        <!-- 加载状态 -->
        <div v-if="loading" class="p-8">
          <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
            <span class="text-gray-600">加载配置文件...</span>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="filteredProfiles.length === 0" class="p-8">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">暂无配置文件</h3>
            <p class="text-gray-500 mb-4">创建您的第一个代理配置文件</p>
            <SsButton variant="primary" @click="handleCreateConfig">
              创建配置
            </SsButton>
          </div>
        </div>

        <!-- 配置项 -->
        <div v-else>
          <ProfileListItem
            v-for="profile in paginatedProfiles"
            :key="profile.id"
            :profile="profile"
            :selected="selectedProfiles.includes(profile.id)"
            :sub-token="subToken"
            @select="handleProfileSelect"
            @preview="handleProfilePreview"
            @edit="handleProfileEdit"
            @duplicate="handleProfileDuplicate"
            @delete="handleProfileDelete"
            @copy-url="handleCopyUrl"
            @export="handleExportConfig"
          />
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="filteredProfiles.length > pageSize" class="px-6 py-4 border-t border-gray-200">
        <NPagination
          v-model:page="currentPage"
          :item-count="filteredProfiles.length"
          :page-size="pageSize"
          show-size-picker
          :page-sizes="[10, 20, 50, 100]"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </div>

    <!-- 预览模态框 -->
    <ProfilePreviewModal
      v-model:show="showPreviewModal"
      :profile="previewProfile"
    />

    <!-- 导入模态框 -->
    <ImportConfigModal
      v-model:show="showImportModal"
      @success="handleImportSuccess"
    />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage, NDropdown, NPagination, NSelect } from 'naive-ui';
import { SsButton, SsInput } from '@/components/base';
import ProfileListItem from '@/components/profile/ProfileListItem.vue';
import { ProfilePreviewModal, ImportConfigModal } from './modals';
import { useAuthStore } from '@/stores/auth';
import { useErrorHandler } from '@/plugins/errorHandler';
import { useClipboard } from '@/composables/common/useClipboard';
import httpClient from '@/services/http/HttpClient';
import type { Profile } from '@/types';

const router = useRouter();
const message = useMessage();
const authStore = useAuthStore();
const { handleError, safeExecute } = useErrorHandler();
const { copyText } = useClipboard();

// 响应式数据
const loading = ref(false);
const refreshing = ref(false);
const profiles = ref<Profile[]>([]);

// 搜索和筛选
const searchQuery = ref('');
const statusFilter = ref<string | null>(null);
const sortBy = ref('updated_at');
const sortOrder = ref<'asc' | 'desc'>('desc');
const currentPage = ref(1);
const pageSize = ref(20);

// 选择状态
const selectedProfiles = ref<string[]>([]);

// 模态框状态
const showPreviewModal = ref(false);
const showImportModal = ref(false);
const previewProfile = ref<Profile | null>(null);

// 计算属性
const subToken = computed(() => authStore.user?.sub_token || '');
const totalCount = computed(() => profiles.value.length);

const filteredProfiles = computed(() => {
  let filtered = profiles.value;

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(profile =>
      profile.name.toLowerCase().includes(query) ||
      (profile.alias && profile.alias.toLowerCase().includes(query))
    );
  }

  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(profile => {
      // 这里需要根据实际的状态字段进行过滤
      return true; // 暂时显示所有
    });
  }

  // 排序
  filtered.sort((a, b) => {
    let comparison = 0;

    switch (sortBy.value) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'updated_at':
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
      default:
        comparison = 0;
    }

    return sortOrder.value === 'desc' ? -comparison : comparison;
  });

  return filtered;
});

const paginatedProfiles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredProfiles.value.slice(start, end);
});

const isAllSelected = computed(() => {
  return paginatedProfiles.value.length > 0 &&
         paginatedProfiles.value.every(profile => selectedProfiles.value.includes(profile.id));
});

const isIndeterminateSelected = computed(() => {
  const selectedCount = paginatedProfiles.value.filter(profile =>
    selectedProfiles.value.includes(profile.id)
  ).length;
  return selectedCount > 0 && selectedCount < paginatedProfiles.value.length;
});

// 配置选项
const statusOptions = [
  { label: '全部状态', value: '', type: 'ignored' as const },
  { label: '正常', value: 'normal' },
  { label: '异常', value: 'error' },
  { label: '未生成', value: 'pending' }
];

const sortOptions = [
  { label: '更新时间', value: 'updated_at' },
  { label: '创建时间', value: 'created_at' },
  { label: '名称', value: 'name' }
];

const batchActions = [
  { label: '批量导出', key: 'export' },
  { label: '批量删除', key: 'delete' }
];

// 方法
const fetchProfiles = async () => {
  loading.value = true;

  try {
    const response = await httpClient.get<Profile[]>('/profiles');

    if (response.success && response.data) {
      profiles.value = response.data;
    } else {
      throw new Error(response.message || '获取配置文件失败');
    }
  } catch (error) {
    handleError(error, {
      context: 'fetchProfiles',
      fallback: '获取配置文件失败'
    });
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleRefresh = async () => {
  refreshing.value = true;
  await fetchProfiles();
  refreshing.value = false;
  message.success('刷新成功');
};

const handleSelectAll = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.checked) {
    const newIds = paginatedProfiles.value.map(profile => profile.id);
    selectedProfiles.value = [...new Set([...selectedProfiles.value, ...newIds])];
  } else {
    paginatedProfiles.value.forEach(profile => {
      const index = selectedProfiles.value.indexOf(profile.id);
      if (index > -1) {
        selectedProfiles.value.splice(index, 1);
      }
    });
  }
};

const handleProfileSelect = (profileId: string, selected: boolean) => {
  if (selected) {
    if (!selectedProfiles.value.includes(profileId)) {
      selectedProfiles.value.push(profileId);
    }
  } else {
    const index = selectedProfiles.value.indexOf(profileId);
    if (index > -1) {
      selectedProfiles.value.splice(index, 1);
    }
  }
};

const handleProfilePreview = (profile: Profile) => {
  previewProfile.value = profile;
  showPreviewModal.value = true;
};

const handleProfileEdit = (profile: Profile) => {
  router.push({
    name: 'edit-profile',
    params: { id: profile.id }
  });
};

const handleProfileDuplicate = async (profile: Profile) => {
  try {
    // 先获取配置详情
    const getResponse = await httpClient.get<Profile>(`/profiles/${profile.id}`);

    if (getResponse.success && getResponse.data) {
      // 创建副本
      const { id, ...profileData } = getResponse.data; // 移除ID
      profileData.name = `${profileData.name} (副本)`;

      const createResponse = await httpClient.post<{ id: string }>('/profiles', profileData);

      if (createResponse.success) {
        message.success('配置复制成功');
        await fetchProfiles();
      } else {
        throw new Error(createResponse.message || '配置复制失败');
      }
    } else {
      throw new Error(getResponse.message || '获取配置详情失败');
    }
  } catch (error) {
    handleError(error, {
      context: 'handleProfileDuplicate',
      fallback: '配置复制失败'
    });
  }
};

const handleProfileDelete = async (profile: Profile) => {
  try {
    const response = await httpClient.delete(`/profiles/${profile.id}`);

    if (response.success) {
      message.success('配置删除成功');
      await fetchProfiles();
    } else {
      throw new Error(response.message || '配置删除失败');
    }
  } catch (error) {
    handleError(error, {
      context: 'handleProfileDelete',
      fallback: '配置删除失败'
    });
  }
};

const handleCopyUrl = async (profile: Profile) => {
  if (!profile.alias || !subToken.value) {
    message.error('无法生成配置链接');
    return;
  }

  const url = `${window.location.origin}/api/public/${subToken.value}/${profile.alias}`;
  await copyText(url);
};

const handleExportConfig = async (profile: Profile) => {
  try {
    // 使用订阅链接导出配置
    if (!profile.alias || !subToken.value) {
      message.error('无法生成配置链接，请确保配置文件有别名且已登录');
      return;
    }

    const exportUrl = `/api/public/${subToken.value}/${profile.alias}/subscribe?format=text`;

    // 创建下载链接
    const link = document.createElement('a');
    link.href = exportUrl;
    link.setAttribute('download', `${profile.name}.txt`);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    link.remove();

    message.success('配置导出成功');
  } catch (error) {
    handleError(error, {
      context: 'handleExportConfig',
      fallback: '配置导出失败'
    });
  }
};

const handleCreateConfig = () => {
  router.push({ name: 'new-profile' });
};

const handleImportConfig = () => {
  showImportModal.value = true;
};

const handleImportSuccess = () => {
  fetchProfiles();
  showImportModal.value = false;
};

const handleBatchAction = async (key: string) => {
  if (selectedProfiles.value.length === 0) {
    message.warning('请先选择要操作的配置');
    return;
  }

  if (key === 'export') {
    // 简化批量导出：打开所有配置的订阅链接
    selectedProfiles.value.forEach((profileId, index) => {
      const profile = profiles.value.find(p => p.id === profileId);
      if (profile && profile.alias && subToken.value) {
        setTimeout(() => {
          const exportUrl = `/api/public/${subToken.value}/${profile.alias}/subscribe?format=text`;
          window.open(exportUrl, `_blank_${index}`);
        }, index * 200); // 稍微延迟打开每个链接
      }
    });
    message.success(`正在导出 ${selectedProfiles.value.length} 个配置文件`);
    selectedProfiles.value = [];
  } else if (key === 'delete') {
    // 批量删除：逐个调用删除接口
    let successCount = 0;
    for (const profileId of selectedProfiles.value) {
      try {
        const response = await httpClient.delete(`/profiles/${profileId}`);
        if (response.success) {
          successCount++;
        }
      } catch (error) {
        console.error('删除配置失败:', profileId, error);
      }
    }

    if (successCount > 0) {
      message.success(`成功删除 ${successCount} 个配置文件`);
      selectedProfiles.value = [];
      await fetchProfiles();
    } else {
      message.error('批量删除失败');
    }
  }
};

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
};

const handlePageSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  currentPage.value = 1;
};

// 监听器
watch(searchQuery, () => {
  currentPage.value = 1;
});

watch(statusFilter, () => {
  currentPage.value = 1;
});

// 生命周期
onMounted(() => {
  fetchProfiles();
});
</script>

<style scoped>
.profiles-view {
  @apply min-h-screen bg-gray-50;
}

/* 内容包装器 */
.content-wrapper {
  @apply max-w-full mx-auto px-1 sm:px-2 md:px-3 lg:px-4 xl:px-6;
  width: 100%;
}

/* 动画效果 */
.profiles-view {
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

/* 响应式布局 */
@media (max-width: 640px) {
  .content-wrapper {
    @apply px-1;
  }

  .flex-col.lg\:flex-row {
    flex-direction: column;
  }

  .flex-1.max-w-md {
    max-width: none;
  }

  .flex.space-x-3 {
    flex-direction: column;
    margin-left: 0;
    margin-top: 0.5rem;
  }

  .flex.items-center.justify-between {
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 1rem;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .content-wrapper {
    @apply px-2;
  }
}

@media (min-width: 1280px) {
  .content-wrapper {
    @apply px-4;
  }
}

/* 加载状态样式 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 按钮组优化 */
.flex.space-x-3 {
  display: flex;
  gap: 0.75rem;
}

/* 输入框优化 */
.relative {
  position: relative;
}

/* 表格样式优化 */
.divide-y > :not([hidden]) ~ :not([hidden]) {
  border-top: 1px solid #e5e7eb;
}

/* 状态指示器 */
.text-primary-600 {
  color: #2563eb;
}

/* 分页样式 */
.px-6.py-4 {
  padding: 1rem 1.5rem;
}
</style>