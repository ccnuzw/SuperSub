// 简化版API客户端 - 避免复杂类型问题
class SimpleApiClient {
  private baseURL = '/api';

  async request(endpoint: string, options: any = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...(options.body && { body: JSON.stringify(options.body) })
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
        return { success: false, error: '认证过期' };
      }

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  get(endpoint: string, params?: any) {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request(url);
  }

  post(endpoint: string, data?: any) {
    return this.request(endpoint, { method: 'POST', body: data });
  }

  put(endpoint: string, data?: any) {
    return this.request(endpoint, { method: 'PUT', body: data });
  }

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  private getToken(): string | null {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  }

  private clearToken(): void {
    try {
      localStorage.removeItem('token');
    } catch {
      // 静默处理
    }
  }
}

export const simpleApiClient = new SimpleApiClient();
export const api = simpleApiClient;