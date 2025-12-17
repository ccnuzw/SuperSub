import { ref, computed, h, nextTick } from 'vue';
import { useMessage, NButton, NIcon } from 'naive-ui';
import { Star as StarIcon, StarOutline as StarOutlineIcon } from '@vicons/ionicons5';
import httpClient from '@/services/http/HttpClient';
import { useAuthStore } from '@/stores/auth';
import { useErrorHandler } from '@/plugins/errorHandler';
import type { DataTableColumns } from 'naive-ui';

interface SubconverterAsset {
  id: number;
  name: string;
  url: string;
  type: 'backend' | 'config';
}

interface UserDefaults {
  default_backend_id?: number;
  default_config_id?: number;
}

export function useAssetManager(assetType: 'backend' | 'config') {
  const message = useMessage();
  const authStore = useAuthStore();
  const { handleError } = useErrorHandler();

  const assets = ref<SubconverterAsset[]>([]);
  const userDefaults = ref<UserDefaults>({});
  const loading = ref(true);
  const showModal = ref(false);
  const saveLoading = ref(false);
  const formRef = ref<any>(null);

  const isAdmin = computed(() => authStore.user?.role === 'admin');

  const defaultAsset: Omit<SubconverterAsset, 'id'> = {
    name: '',
    url: '',
    type: assetType,
  };

  const currentAsset = ref<Partial<SubconverterAsset>>({ ...defaultAsset });

  const modalTitle = computed(() => (currentAsset.value.id ? `编辑${assetType === 'backend' ? '后端' : '配置'}` : `添加${assetType === 'backend' ? '后端' : '配置'}`));

  const rules = {
    name: { required: true, message: '请输入名称', trigger: 'blur' },
    url: { required: true, message: '请输入 URL', trigger: 'blur' },
  };

  // Data fetching methods
  const fetchUserDefaults = async () => {
    if (!authStore.isAuthenticated) return;
    try {
      const response = await httpClient.get<{ default_backend_id?: number; default_config_id?: number }>('/user/defaults');

      if (response.success && response.data) {
        userDefaults.value = response.data;
      }
    } catch (error) {
      handleError(error, {
        context: 'fetchUserDefaults',
        fallback: null,
        silent: true
      });
    }
  };

  const fetchAssets = async () => {
    if (!authStore.isAuthenticated) return;
    loading.value = true;
    try {
      const response = await httpClient.get<SubconverterAsset[]>(`/assets?type=${assetType}`);
      if (response.success && response.data) {
        assets.value = response.data;
      }
    } catch (error) {
      handleError(error, {
        context: 'fetchAssets',
        fallback: '加载资源列表失败'
      });
    } finally {
      loading.value = false;
    }
  };

  const initializeAssets = async () => {
    await fetchUserDefaults();
    await fetchAssets();
  };

  // Modal operations
  const openModal = (asset: SubconverterAsset | null) => {
    if (asset) {
      currentAsset.value = { ...asset };
    } else {
      currentAsset.value = { ...defaultAsset, type: assetType };
    }
    showModal.value = true;
  };

  const closeModal = () => {
    showModal.value = false;
    currentAsset.value = { ...defaultAsset };
  };

  // CRUD operations
  const handleSave = async () => {
    if (!formRef.value) return;

    try {
      await formRef.value.validate();
    } catch (error) {
      return; // 表单验证失败
    }

    saveLoading.value = true;
    try {
      if (currentAsset.value.id) {
        const { id, ...updateData } = currentAsset.value;
        await httpClient.put(`/assets/${id}`, updateData);
        message.success('更新成功');
      } else {
        await httpClient.post('/assets', currentAsset.value);
        message.success('添加成功');
      }
      closeModal();
      await fetchAssets();
    } catch (error) {
      handleError(error, {
        context: 'handleSave',
        fallback: '保存失败'
      });
    } finally {
      saveLoading.value = false;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await httpClient.delete(`/assets/${id}`);
      message.success('删除成功');
      await fetchAssets();
    } catch (error) {
      handleError(error, {
        context: 'handleDelete',
        fallback: '删除失败'
      });
    }
  };

  const refreshKey = ref(0);

  const forceRefresh = () => {
    refreshKey.value++;
  };

  const handleSetDefault = async (id: number) => {
    const payload: any = {};
    if (assetType === 'backend') {
      payload.default_backend_id = id;
    } else {
      payload.default_config_id = id;
    }

    try {
      const response = await httpClient.put('/user/defaults', payload);

      if (response.success) {
        message.success('默认设置成功');

        // 立即更新本地状态以提供即时反馈
        const newDefaults = { ...userDefaults.value };
        if (assetType === 'backend') {
          newDefaults.default_backend_id = id;
        } else {
          newDefaults.default_config_id = id;
        }

        userDefaults.value = newDefaults;

        // 强制触发响应式更新
        forceRefresh();

        // 等待下一个 tick 确保 DOM 更新
        await nextTick();

        // 再次强制刷新确保表格重新渲染
        forceRefresh();

        // 再等待一个 tick 确保表格重新渲染
        await nextTick();
      } else {
        throw new Error(response.message || '设置默认失败');
      }
    } catch (error) {
      handleError(error, {
        context: 'handleSetDefault',
        fallback: '设置默认失败'
      });
    }
  };

  const columns = computed<DataTableColumns<SubconverterAsset>>(() => {
    return [
    {
      title: '默认',
      key: 'is_default',
      width: 60,
      align: 'center',
      render: (row) => {
        // 直接在这里计算默认状态，确保响应式更新
        const isRowDefault = assetType === 'backend'
          ? userDefaults.value.default_backend_id === row.id
          : userDefaults.value.default_config_id === row.id;

        return h(
          'div',
          {
            class: 'cursor-pointer flex justify-center',
            onClick: () => !isRowDefault && handleSetDefault(row.id),
            style: {
              cursor: isRowDefault ? 'default' : 'pointer'
            }
          },
          h(
            NIcon,
            {
              size: '18',
              color: isRowDefault ? '#fdd835' : undefined
            },
            {
              default: () => isRowDefault ? h(StarIcon) : h(StarOutlineIcon)
            }
          )
        );
      }
    },
    {
      title: '名称',
      key: 'name',
    },
    {
      title: 'URL',
      key: 'url',
      ellipsis: {
        tooltip: true,
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (row) => {
        if (!isAdmin.value) return null;

        return h('div', { class: 'space-x-2' }, [
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              text: true,
              onClick: () => openModal(row)
            },
            { default: () => '编辑' }
          ),
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              text: true,
              onClick: () => handleDelete(row.id)
            },
            { default: () => '删除' }
          ),
        ]);
      },
    },
    ];
  });


const isDefault = (row: SubconverterAsset) => {
    if (assetType === 'backend') {
        return userDefaults.value.default_backend_id === row.id;
    }
    return userDefaults.value.default_config_id === row.id;
};

  return {
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
  };
}