import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types';
import { authService } from '../services/authService';
import { getCognitoLogoutUrl } from '../config/cognitoAuth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  function setAuth(newToken: string, newUser: User) {
    token.value = newToken;
    user.value = newUser;
  }

  async function hydrate() {
    const session = await authService.getSession();
    if (session) {
      setAuth(session.token, session.user);
    }
  }

  async function logout() {
    token.value = null;
    user.value = null;

    try {
      await authService.logout();
    } catch (e) {
      console.error(e);
    }

    if (!getCognitoLogoutUrl()) {
      window.location.href = '/login';
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    setAuth,
    hydrate,
    logout
  };
});
