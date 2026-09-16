<template>
  <div class="min-h-screen bg-white flex flex-col">
    <!-- Header -->
    <header class="bg-brand-black shadow-md">
      <div class="w-full px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
              T
            </div>
            <h1 class="text-xl font-bold text-white tracking-tight">Tvarana</h1>
            <span class="hidden sm:inline text-sm text-gray-400 font-medium">Data Portal</span>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-300 font-medium hidden sm:inline">{{ authStore.user?.name }}</span>
            <button @click="logout"
              class="inline-flex items-center px-4 py-1.5 border border-gray-600 text-sm font-semibold rounded-full text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-black focus:ring-primary-500 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex flex-col lg:flex-row gap-4 lg:gap-6">

      <!-- Mobile entity selector -->
      <div class="lg:hidden flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          v-for="entity in visibleEntities"
          :key="entity.id"
          @click="goToDashboard(entity.id)"
          :class="[
            isDashboardActive(entity.id)
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            'flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-full transition-colors'
          ]"
        >
          {{ entity.plural }}
        </button>
        <router-link
          :to="{ name: 'SuiteAppMetrics' }"
          :class="[
            isMetricsActive
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            'flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-full transition-colors'
          ]"
        >
          SuiteApp Metrics
        </router-link>
      </div>

      <!-- Desktop sidebar -->
      <aside class="hidden lg:block w-56 xl:w-64 flex-shrink-0">
        <nav class="space-y-1">
          <button
            v-for="entity in visibleEntities"
            :key="entity.id"
            @click="goToDashboard(entity.id)"
            :class="[
              isDashboardActive(entity.id)
                ? 'bg-primary-50 text-primary-700 border-primary-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent',
              'group flex items-center px-3 py-2.5 text-sm font-semibold border-l-4 w-full text-left transition-colors rounded-r-md'
            ]"
          >
            {{ entity.plural }}
          </button>
          <router-link
            :to="{ name: 'SuiteAppMetrics' }"
            :class="[
              isMetricsActive
                ? 'bg-primary-50 text-primary-700 border-primary-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent',
              'group flex items-center px-3 py-2.5 text-sm font-semibold border-l-4 w-full text-left transition-colors rounded-r-md'
            ]"
          >
            SuiteApp Metrics
            <span class="ml-auto text-[10px] font-bold tracking-wide bg-primary-600 text-white px-1.5 py-0.5 rounded-full">New</span>
          </router-link>
        </nav>
      </aside>

      <!-- Main Area -->
      <div class="flex-1 min-w-0 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <router-view />
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useEntityStore } from '../stores/entityStore';
import { ENTITIES } from '../config/entities';

const authStore = useAuthStore();
const entityStore = useEntityStore();
const route = useRoute();
const router = useRouter();

const visibleEntities = Object.values(ENTITIES).filter((e) => e.id === 'subscriptions');

const isMetricsActive = computed(() => route.name === 'SuiteAppMetrics' || route.name === 'SuiteAppMetricsDetail');

const isDashboardActive = (entityId: string) => !isMetricsActive.value && entityStore.activeEntityId === entityId;

const goToDashboard = (entityId: string) => {
  entityStore.setActiveEntity(entityId);
  if (route.name !== 'Dashboard') router.push({ name: 'Dashboard' });
};

const logout = () => {
  authStore.logout();
};
</script>
