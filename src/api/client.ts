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

        // Auth routes should never be cancelled during logout
        const isAuthRoute = config.url?.startsWith('/auth/');

        // If the app is in the process of logging out, cancel all outgoing requests EXCEPT auth routes.
        if (authStore.isLoggingOut && !isAuthRoute) {
            return {
                ...config,
                cancelToken: new axios.CancelToken((cancel) => cancel('Logout in progress')),
            };
        }

        // Add token to headers (skip for login/register)
        const token = authStore.token;
        if (token && !isAuthRoute) {
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
        // Don't trigger logout for auth routes (login/register failures)
        const isAuthRoute = error.config?.url?.startsWith('/auth/');

        if (error.response && error.response.status === 401 && !isAuthRoute) {
            const authStore = useAuthStore();
            // Only logout if not already logging out
            if (!authStore.isLoggingOut) {
                authStore.logout();
            }
        }
        return Promise.reject(error);
    }
);

export default client;
