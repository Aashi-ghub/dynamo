<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900 tracking-tight">Business Data Portal</h1>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-700 font-medium">{{ authStore.user?.name }}</span>
            <button @click="logout"
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
      
      <!-- Left Side: Entity Selector -->
      <aside class="w-64 flex-shrink-0">
        <nav class="space-y-1">
          <button
            v-for="entity in Object.values(ENTITIES)"
            :key="entity.id"
            @click="entityStore.setActiveEntity(entity.id)"
            :class="[
              entityStore.activeEntityId === entity.id 
                ? 'bg-primary-50 text-primary-700 border-primary-500' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent',
              'group flex items-center px-3 py-2 text-sm font-medium border-l-4 w-full text-left transition-colors'
            ]"
          >
            {{ entity.plural }}
          </button>
        </nav>
      </aside>

      <!-- Main Area -->
      <div class="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <router-view />
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/authStore';
import { useEntityStore } from '../stores/entityStore';
import { ENTITIES } from '../config/entities';

const authStore = useAuthStore();
const entityStore = useEntityStore();

const logout = () => {
  authStore.logout();
};
</script>
