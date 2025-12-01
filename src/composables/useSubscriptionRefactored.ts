import { ref } from 'vue';
import { SubscriptionService } from '@/services/subscriptionService';

export function useSubscription() {
  const subscriptions = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const subscriptionService = new SubscriptionService();

  const fetchSubscriptions = async () => {
    loading.value = true;
    error.value = null;

    try {
      const data = await subscriptionService.getSubscriptions();
      subscriptions.value = data;
    } catch (err: any) {
      error.value = err.message;
      console.error('Error fetching subscriptions:', err);
    } finally {
      loading.value = false;
    }
  };

  const createSubscription = async (data: { name: string; url: string }) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await subscriptionService.createSubscription(data);
      await fetchSubscriptions(); // Refresh list
      return result;
    } catch (err: any) {
      error.value = err.message;
      console.error('Error creating subscription:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateSubscription = async (id: string, data: { name: string; url: string }) => {
    loading.value = true;
    error.value = null;

    try {
      await subscriptionService.updateSubscription(id, data);
      await fetchSubscriptions(); // Refresh list
    } catch (err: any) {
      error.value = err.message;
      console.error('Error updating subscription:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteSubscription = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      await subscriptionService.deleteSubscription(id);
      await fetchSubscriptions(); // Refresh list
    } catch (err: any) {
      error.value = err.message;
      console.error('Error deleting subscription:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const previewSubscription = async (url: string) => {
    try {
      return await subscriptionService.previewSubscription(url);
    } catch (err: any) {
      error.value = err.message;
      console.error('Error previewing subscription:', err);
      throw err;
    }
  };

  return {
    subscriptions,
    loading,
    error,
    fetchSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    previewSubscription,
  };
}