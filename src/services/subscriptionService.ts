import { api } from '@/utils/api';

export class SubscriptionService {
  async getSubscriptions(): Promise<any[]> {
    const response = await api.get('/subscriptions');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch subscriptions');
  }

  async createSubscription(data: { name: string; url: string }): Promise<{ id: string }> {
    const response = await api.post('/subscriptions', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create subscription');
  }

  async updateSubscription(id: string, data: { name: string; url: string }): Promise<void> {
    const response = await api.put(`/subscriptions/${id}`, data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update subscription');
    }
  }

  async deleteSubscription(id: string): Promise<void> {
    const response = await api.delete(`/subscriptions/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete subscription');
    }
  }

  async previewSubscription(url: string): Promise<any> {
    const response = await api.post('/subscriptions/preview', { url });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to preview subscription');
  }

  // 保持与原始API的兼容性
  async updateSingleSubscription(id: string): Promise<any> {
    const response = await api.post(`/subscriptions/${id}/update`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update subscription');
  }

  async batchDeleteSubscriptions(ids: string[]): Promise<any> {
    const response = await api.post('/subscriptions/batch-delete', { ids });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to batch delete subscriptions');
  }

  async clearAllSubscriptions(): Promise<any> {
    const response = await api.post('/subscriptions/clear-all');
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to clear all subscriptions');
  }

  async clearSubscriptionsByGroup(groupId: string | null): Promise<any> {
    const response = await api.post('/subscriptions/clear-by-group', { groupId });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to clear subscriptions by group');
  }

  async clearFailedSubscriptions(groupId?: string): Promise<any> {
    const response = await api.post('/subscriptions/clear-failed', {
      groupId: groupId === 'all' ? 'all' : (groupId || null)
    });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to clear failed subscriptions');
  }

  async batchMoveToGroup(subscriptionIds: string[], groupId: string): Promise<any> {
    const response = await api.post('/subscriptions/batch-update-group', {
      subscriptionIds,
      groupId
    });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to move subscriptions to group');
  }

  async batchUpdateUrls(updates: { id: string; url: string }[]): Promise<any> {
    const response = await api.post('/subscriptions/batch-update-urls', { updates });
    if (response.data.success) {
      return response.data;
    }
    throw new Error(response.data.message || 'Failed to batch update URLs');
  }
}