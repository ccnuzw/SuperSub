<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ title }}</h3>
      <Button variant="primary" size="sm" @click="openModal(null)">
        添加{{ assetName }}
      </Button>
    </div>

    <div v-if="!isMobile" class="bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden">
      <n-data-table
        :columns="columns"
        :data="paginatedAssets"
        :loading="loading"
        :row-key="row => row.id"
        :bordered="false"
      />
      <div v-if="pagination.pageCount > 1" class="flex justify-end p-4 border-t border-gray-100 dark:border-dark-border">
         <n-pagination
          v-model:page="pagination.page"
          :page-count="pagination.pageCount"
        />
      </div>
    </div>

    <div v-else class="space-y-4">
      <Card v-for="asset in paginatedAssets" :key="asset.id" padding="sm" class="flex flex-col gap-3">
        <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0 mr-2">
                <div class="font-medium text-slate-900 dark:text-white truncate">{{ asset.name }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ asset.url }}</div>
            </div>
            <Button 
                variant="ghost" 
                size="sm" 
                icon 
                @click="handleSetDefault(asset.id)" 
                :disabled="isDefault(asset)"
                :class="isDefault(asset) ? 'text-yellow-400' : 'text-slate-300'"
            >
                <n-icon :component="isDefault(asset) ? StarIcon : StarOutlineIcon" size="20" />
            </Button>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-dark-border px-1">
             <Button variant="secondary" size="sm" @click="openModal(asset)">编辑</Button>
             <n-popconfirm @positive-click="handleDelete(asset.id)">
              <template #trigger>
                <Button variant="danger" size="sm">删除</Button>
              </template>
              您确定要删除此{{ assetName }}吗？
            </n-popconfirm>
        </div>
      </Card>
      
      <n-pagination
        v-if="pagination.pageCount > 1"
        v-model:page="pagination.page"
        :page-count="pagination.pageCount"
        class="flex justify-center mt-4"
      />
    </div>

    <n-modal v-model:show="showModal" preset="card" :style="{ width: isMobile ? '90vw' : '600px' }" :title="modalTitle">
      <n-form ref="formRef" :model="currentAsset" :rules="rules" label-placement="top">
        <n-form-item label="名称" path="name">
          <n-input v-model:value="currentAsset.name" placeholder="请输入名称" />
        </n-form-item>
        <n-form-item label="URL" path="url">
          <n-input v-model:value="currentAsset.url" placeholder="请输入完整 URL" />
        </n-form-item>
        <div class="flex justify-end pt-4">
             <Button variant="primary" @click="handleSave" :loading="saveLoading">保存</Button>
        </div>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h, reactive } from 'vue';
import {
  NDataTable, NModal, NForm, NFormItem, NInput, useMessage, NPopconfirm, NIcon, NTooltip, NPagination
} from 'naive-ui';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import { Star as StarIcon, StarOutline as StarOutlineIcon } from '@vicons/ionicons5';
import { useIsMobile } from '@/composables/useMediaQuery';
import type { DataTableColumns } from 'naive-ui';
import { assetsApi } from '@/api/assets';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/stores/auth';
import type { SubconverterAsset } from '@/types';


type UserDefaults = {
  default_backend_id?: number; 
  default_config_id?: number;
};

const props = defineProps<{
  assetType: 'backend' | 'config';
  title: string;
  assetName: string;
}>();

const emit = defineEmits(['assets-updated']);

const authStore = useAuthStore();
const message = useMessage();
const isMobile = useIsMobile();
const assets = ref<SubconverterAsset[]>([]);
const userDefaults = ref<UserDefaults>({});
const loading = ref(true);
const showModal = ref(false);
const saveLoading = ref(false);
const formRef = ref<any>(null);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageCount: computed(() => Math.ceil(pagination.itemCount / pagination.pageSize)),
});

const paginatedAssets = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return assets.value.slice(start, end);
});

const isAdmin = computed(() => authStore.user?.role === 'admin');

const defaultAsset: Omit<SubconverterAsset, 'id'> = {
  name: '',
  url: '',
  type: props.assetType,
};

const currentAsset = ref<Partial<SubconverterAsset>>({ ...defaultAsset });

const modalTitle = computed(() => (currentAsset.value.id ? `编辑${props.assetName}` : `添加${props.assetName}`));

const rules = {
  name: { required: true, message: '请输入名称', trigger: 'blur' },
  url: { required: true, message: '请输入 URL', trigger: 'blur' },
};

const fetchUserDefaults = async () => {
  if (!authStore.isAuthenticated) return;
  try {
    const response = await usersApi.fetchDefaults();
    if (response.data.success && response.data.data) {
      userDefaults.value = {
          default_backend_id: response.data.data.default_backend_id ? Number(response.data.data.default_backend_id) : undefined,
          default_config_id: response.data.data.default_config_id ? Number(response.data.data.default_config_id) : undefined
      };
    }
  } catch (error) {
    console.warn('Could not fetch user defaults.', error);
  }
};

const fetchAssets = async () => {
  if (!authStore.isAuthenticated) return;
  loading.value = true;
  try {
    const response = await assetsApi.fetchAssets(props.assetType);
    if (response.data.success) {
      assets.value = (response.data.data as SubconverterAsset[]) || [];
      pagination.itemCount = assets.value.length;
      pagination.page = 1;
      emit('assets-updated', assets.value);
    }
  } catch (error) {
    message.error('加载列表失败');
  } finally {
    loading.value = false;
  }
};

const openModal = (asset: SubconverterAsset | null) => {
  if (asset) {
    currentAsset.value = { ...asset };
  } else {
    currentAsset.value = { ...defaultAsset, type: props.assetType };
  }
  showModal.value = true;
};

const handleSave = async () => {
  await formRef.value?.validate();
  saveLoading.value = true;
  try {
    if (currentAsset.value.id) {
      await assetsApi.updateAsset(currentAsset.value.id, currentAsset.value as any);
      message.success('更新成功');
    } else {
      await assetsApi.createAsset(currentAsset.value as any);
      message.success('创建成功');
    }
    showModal.value = false;
    await fetchAssets();
  } catch (error: any) {
    message.error(error.response?.data?.message || '保存失败');
  } finally {
    saveLoading.value = false;
  }
};

const handleDelete = async (id: number) => {
  try {
    await assetsApi.deleteAsset(id);
    message.success('删除成功');
    await fetchAssets();
  } catch (error: any) {
    message.error(error.response?.data?.message || '删除失败');
  }
};

const handleSetDefault = async (id: number) => {
  const payload: any = {};
  if (props.assetType === 'backend') {
    payload.default_backend_id = id;
  } else {
    payload.default_config_id = id;
  }

  try {
    await usersApi.updateDefaults(payload);
    message.success('默认设置成功');
    await fetchUserDefaults(); // Refresh defaults state
  } catch (error) {
    message.error('设置默认失败');
  }
};

const isDefault = (row: SubconverterAsset) => {
  if (props.assetType === 'backend') {
    return userDefaults.value.default_backend_id === row.id;
  }
  return userDefaults.value.default_config_id === row.id;
};

const createColumns = (): DataTableColumns<SubconverterAsset> => [
  {
    title: '默认',
    key: 'is_default',
    width: 80,
    align: 'center',
    render(row) {
      const isRowDefault = isDefault(row);
      // Using custom Button component in render function
      return h(Button, {
        variant: 'ghost',
        size: 'sm',
        icon: true,
        onClick: () => handleSetDefault(row.id),
        disabled: isRowDefault,
        class: isRowDefault ? 'text-yellow-400' : 'text-slate-300'
      }, {
        default: () => h(NIcon, {
            component: isRowDefault ? StarIcon : StarOutlineIcon,
            size: 20
        })
      });
    }
  },
  {
    title: '名称',
    key: 'name',
    className: 'font-medium'
  },
  {
    title: 'URL',
    key: 'url',
    ellipsis: {
      tooltip: true,
    },
    className: 'text-slate-500'
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render(row) {
      if (!isAdmin.value) return null;

      return h('div', { class: 'flex gap-2' }, [
          h(Button, { 
              size: 'sm', 
              variant: 'secondary', 
              onClick: () => openModal(row) 
          }, { default: () => '编辑' }),
          h(NPopconfirm,
            { onPositiveClick: () => handleDelete(row.id) },
            {
              trigger: () => h(Button, { 
                  size: 'sm', 
                  variant: 'danger', 
              }, { default: () => '删除' }),
              default: () => `您确定要删除此${props.assetName}吗？`
            }
          ),
      ]);
    },
  },
];

const columns = createColumns();

onMounted(async () => {
  await fetchUserDefaults();
  await fetchAssets();
});
</script>