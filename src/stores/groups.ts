import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';
import { groupsApi, type NodeGroup } from '@/api/groups';

export type { NodeGroup };

export const useGroupStore = defineStore('groups', () => {
  const groups = ref<NodeGroup[]>([]);
  const loading = ref(false);
  const authStore = useAuthStore();

  async function fetchGroups() {
    if (!authStore.token) return;
    loading.value = true;
    try {
      const response = await groupsApi.fetchGroups();
      if (response.data.success && Array.isArray(response.data.data)) {
        groups.value = response.data.data;
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      loading.value = false;
    }
  }

  async function addGroup(name: string) {
    if (groups.value.length >= 10) {
      return { success: false, message: '最多只能创建10个分组。' };
    }
    const response = await groupsApi.createGroup(name);
    if (response.data.success) {
      await fetchGroups(); // Refresh the list
    }
    return response.data;
  }

  async function updateGroup(id: string, name: string) {
    const response = await groupsApi.updateGroup(id, name);
    if (response.data.success) {
      await fetchGroups();
    }
    return response.data;
  }

  async function deleteGroup(id: string) {
    const response = await groupsApi.deleteGroup(id);
    if (response.data.success) {
      await fetchGroups();
    }
    return response.data;
  }

  async function toggleGroup(id: string) {
    const response = await groupsApi.toggleGroup(id);
    if (response.data.success) {
      await fetchGroups();
    }
    return response.data;
  }

  async function updateGroupOrder(groupIds: string[]) {
    const response = await groupsApi.updateGroupOrder(groupIds);
    return response.data;
  }

  return {
    groups,
    loading,
    fetchGroups,
    addGroup,
    updateGroup,
    deleteGroup,
    toggleGroup,
    updateGroupOrder,
  };
});