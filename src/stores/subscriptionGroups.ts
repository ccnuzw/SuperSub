import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';
import { subscriptionGroupsApi, type SubscriptionGroup } from '@/api/subscriptionGroups';

export type { SubscriptionGroup };

export const useSubscriptionGroupStore = defineStore('subscriptionGroups', () => {
  const groups = ref<SubscriptionGroup[]>([]);
  const loading = ref(false);
  const authStore = useAuthStore();

  async function fetchGroups() {
    if (!authStore.token) return;
    loading.value = true;
    try {
      const response = await subscriptionGroupsApi.fetchGroups();
      if (response.data.success && Array.isArray(response.data.data)) {
        groups.value = response.data.data;
      }
    } catch (error) {
      console.error('Failed to fetch subscription groups:', error);
    } finally {
      loading.value = false;
    }
  }

  async function addGroup(name: string, description?: string) {
    if (groups.value.length >= 10) {
      return { success: false, message: '最多只能创建10个分组。' };
    }
    const response = await subscriptionGroupsApi.createGroup(name, description);
    if (response.data.success) {
      await fetchGroups(); // Refresh the list
    }
    return response.data;
  }

  async function updateGroup(id: string, name: string, description?: string) {
    const response = await subscriptionGroupsApi.updateGroup(id, name, description);
    if (response.data.success) {
      await fetchGroups();
    }
    return response.data;
  }

  async function deleteGroup(id: string) {
    const response = await subscriptionGroupsApi.deleteGroup(id);
    if (response.data.success) {
      await fetchGroups();
    }
    return response.data;
  }

  async function toggleGroup(id: string) {
    const response = await subscriptionGroupsApi.toggleGroup(id);
    if (response.data.success) {
      await fetchGroups();
    }
    return response.data;
  }

  async function updateGroupOrder(groupIds: string[]) {
    try {
      const response = await subscriptionGroupsApi.updateGroupOrder(groupIds);
      if (response.data.success) {
        await fetchGroups();
      } else {
        throw new Error(response.data.message || 'Failed to update group order on the server.');
      }
      return response.data;
    } catch (error) {
      console.error('Error in updateGroupOrder:', error);
      throw error;
    }
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