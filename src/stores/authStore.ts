import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types';
import { authService } from '../services/authService';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));

  const isAuthenticated = computed(() => !!token.value);

  function setAuth(newToken: string, newUser: User) {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('token', newToken);
  }

  async function logout() {
    try {
      await authService.logout();
    } catch (e) {
      console.error(e);
    }
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  return {
    user,
    token,
    isAuthenticated,
    setAuth,
    logout
  };
});
