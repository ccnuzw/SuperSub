<template>
  <div>
    <n-space justify="space-between" align="center" class="mb-4">
      <h3 class="text-lg font-semibold">{{ title }}</h3>
      <n-button type="primary" @click="openModal(null)">添加新{{ assetName }}</n-button>
    </n-space>

    <n-data-table
      v-if="!isMobile"
      :key="refreshKey"
      :columns="columns"
      :data="assets"
      :loading="loading"
      :row-key="row => row.id"
    />

    <n-list v-else bordered :show-divider="false">
      <n-list-item v-for="asset in assets" :key="asset.id">
        <template #prefix>
          <n-button quaternary circle @click="() => handleSetDefault(asset.id)" :disabled="isDefault(asset)">
            <template #icon>
              <n-icon :component="isDefault(asset) ? StarIcon : StarOutlineIcon" :color="isDefault(asset) ? '#fdd835' : undefined" />
            </template>
          </n-button>
        </template>
        <n-thing :title="asset.name" :description="asset.url" />
        <template #suffix>
          <n-space>
            <n-button size="small" @click="() => openModal(asset)">编辑</n-button>
            <n-popconfirm @positive-click="() => handleDelete(asset.id)">
              <template #trigger>
                <n-button size="small" type="error" ghost>删除</n-button>
              </template>
              确定要删除这个资源吗？
            </n-popconfirm>
          </n-space>
        </template>
      </n-list-item>
    </n-list>

    <n-modal v-model:show="showModal" preset="card" :class="isMobile ? 'w-[90vw]' : 'w-[600px]'" :title="modalTitle">
      <n-form ref="formRef" :model="currentAsset" :rules="rules" label-placement="top">
        <n-form-item label="名称" path="name">
          <n-input v-model:value="currentAsset.name" placeholder="为此资源指定一个易于识别的名称" />
        </n-form-item>
        <n-form-item label="URL" path="url">
          <n-input v-model:value="currentAsset.url" placeholder="输入完整的 URL 地址" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="handleSave" :loading="saveLoading">保存</n-button>
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted } from 'vue';
import {
  NButton, NDataTable, NSpace, NModal, NForm, NFormItem, NInput, useMessage, NPopconfirm, NIcon, NTooltip, NList, NListItem, NThing
} from 'naive-ui';
import { Star as StarIcon, StarOutline as StarOutlineIcon } from '@vicons/ionicons5';
import { useIsMobile } from '@/composables/useMediaQuery';
import { useAssetManager } from '@/composables/useAssetManager';
import type { DataTableColumns } from 'naive-ui';

const props = defineProps<{
  assetType: 'backend' | 'config';
  title: string;
  assetName: string;
}>();

const emit = defineEmits(['assets-updated']);

const isMobile = useIsMobile();

const {
  assets,
  loading,
  showModal,
  saveLoading,
  formRef,
  currentAsset,
  modalTitle,
  rules,
  columns,
  isAdmin,
  refreshKey,
  openModal,
  closeModal,
  handleSave,
  handleDelete,
  handleSetDefault,
  isDefault,
  initializeAssets,
} = useAssetManager(props.assetType);

// Initialize data on mount
onMounted(async () => {
  await initializeAssets();
  emit('assets-updated', assets.value);
});
</script>