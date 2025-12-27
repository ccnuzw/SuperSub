import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

const client: AxiosInstance = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();

        // If the app is in the process of logging out, cancel all outgoing requests.
        if (authStore.isLoggingOut) {
            return {
                ...config,
                cancelToken: new axios.CancelToken((cancel) => cancel('Logout in progress')),
            };
        }

        // Add token to headers
        const token = authStore.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Cloudflare Pages/Functions doesn't properly handle PUT/DELETE with [[path]].
        // Tunnel these methods through POST using a header.
        const method = config.method?.toUpperCase();
        if (method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
            config.headers['X-HTTP-Method-Override'] = method;
            config.method = 'POST';
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const authStore = useAuthStore();
            // Only logout if not already logging out or on login page to avoid loops
            // But simple calls here are usually safe due to actions guards
            authStore.logout();
        }
        return Promise.reject(error);
    }
);

export default client;
