import { defineStore } from 'pinia';
import { ref, computed, nextTick } from 'vue';
import router from '@/router';
import type { User } from '@/types';
import { authApi } from '@/api/auth';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isLoggingOut = ref(false);
  const isRegistrationAllowed = ref(true);

  // Getters
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  // Actions
  async function checkRegistrationStatus() {
    try {
      const response = await authApi.checkRegistrationStatus();
      if (response.data.success && response.data.data) {
        // Handle both boolean true and string 'true' for compatibility
        const val = response.data.data.allow_registration;
        isRegistrationAllowed.value = String(val) === 'true';
      }
    } catch (error) {
      console.error('Failed to check registration status:', error);
      isRegistrationAllowed.value = true;
    }
  }

  async function login(credentials: { username: string; password: any; }) {
    try {
      const response = await authApi.login(credentials);
      if (response.data.success && response.data.data) {
        const { token: newToken, user: newUser } = response.data.data;
        token.value = newToken;
        user.value = newUser;
        isLoggingOut.value = false;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    if (isLoggingOut.value) return;

    isLoggingOut.value = true;
    try {
      user.value = null;
      token.value = null;

      await nextTick();

      if (router.currentRoute.value.name !== 'login') {
        await router.push({ name: 'login' });
      }
    } finally {
      isLoggingOut.value = false;
    }
  }

  function updateTokenAndUser(data: { jwt: string, user: User }) {
    token.value = data.jwt;
    user.value = data.user;
  }

  async function fetchUser() {
    if (token.value && !user.value) {
      try {
        const response = await authApi.verify();
        if (response.data.success && response.data.data) {
          user.value = response.data.data.user;
        } else {
          await logout();
        }
      } catch (error) {
        await logout();
      }
    }
  }

  async function register(credentials: { username: string; password: any; }) {
    await authApi.register(credentials);
  }

  return {
    user,
    token,
    isLoggingOut,
    isRegistrationAllowed,
    isAuthenticated,
    isAdmin,
    checkRegistrationStatus,
    login,
    logout,
    updateTokenAndUser,
    fetchUser,
    register,
  };
}, {
  persist: true,
});