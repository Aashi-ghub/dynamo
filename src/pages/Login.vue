<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <div class="flex flex-col items-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white mb-4">
          T
        </div>
        <h2 class="text-center text-3xl font-extrabold text-brand-black">
          Tvarana
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Sign in to access your data portal
        </p>
      </div>

      <div v-if="error" class="text-red-600 text-sm text-center">
        {{ error }}
      </div>

      <div class="mt-8">
        <button
          type="button"
          :disabled="loading"
          @click="handleSignIn"
          class="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-full text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
        >
          <span class="absolute left-0 inset-y-0 flex items-center pl-3" v-if="loading">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          {{ loading ? 'Redirecting...' : 'Sign in with Cognito' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';

const error = ref('');
const loading = ref(false);

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  await authStore.hydrate();
  if (authStore.isAuthenticated) {
    router.push('/');
  }
});

const handleSignIn = async () => {
  error.value = '';
  loading.value = true;
  try {
    await authService.signIn();
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Sign in failed';
    loading.value = false;
  }
};
</script>
