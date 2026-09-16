<template>
  <div class="flex h-full flex-col">
    <header class="border-b border-gray-200 bg-white px-4 sm:px-6 py-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-4 min-w-0">
          <button
            type="button"
            @click="goBack"
            class="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to SuiteApp Metrics
          </button>
          <div class="min-w-0 hidden sm:block">
            <p class="text-sm font-medium text-gray-500">SuiteApp Metrics</p>
            <h2 class="mt-0.5 truncate text-xl font-semibold text-gray-900">
              {{ accountId }} · {{ productCode }}
            </h2>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto bg-gray-50">
      <div v-if="loading" class="flex h-full items-center justify-center">
        <div class="flex items-center gap-3 text-sm font-medium text-gray-600">
          <svg class="h-5 w-5 animate-spin text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading snapshot
        </div>
      </div>

      <div v-else-if="error" class="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <div class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>
      </div>

      <div v-else-if="record" class="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <p class="mb-4 text-sm text-gray-500">
          Snapshot date {{ record.Date }} <span v-if="record.UpdatedAt">· Last updated {{ formatUpdatedAt(record.UpdatedAt) }}</span>
        </p>

        <section class="border-b border-gray-200 bg-white px-4 sm:px-6 py-5 rounded-lg shadow-sm">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p class="text-xs font-medium uppercase text-gray-500">Total SkyDoc files</p>
              <p class="mt-1 text-sm font-medium text-gray-900">{{ formatCount(record.Metrics?.TotalFiles) }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase text-gray-500">Total SkyDoc files size</p>
              <p class="mt-1 text-sm font-medium text-gray-900">{{ formatGb(record.Metrics?.TotalSize) }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase text-gray-500">NetSuite file cabinet size</p>
              <p class="mt-1 text-sm font-medium text-gray-900">—</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase text-gray-500">Account · product</p>
              <p class="mt-1 text-sm font-medium text-gray-900">{{ accountId }} · {{ productCode }}</p>
            </div>
          </div>
        </section>

        <section class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div v-for="group in featureGroups" :key="group.key" class="border border-gray-200 rounded-lg bg-white px-4 py-4 shadow-sm">
            <h4 class="mb-2.5 flex items-center justify-between gap-2 text-sm font-semibold text-gray-900">
              {{ group.label }}
              <span
                v-if="group.enabled !== undefined"
                :class="[
                  group.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold'
                ]"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                {{ group.enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </h4>
            <div v-if="group.stats.length" class="flex flex-col gap-1.5">
              <div v-for="stat in group.stats" :key="stat.key" class="flex justify-between text-sm text-gray-700">
                <span class="text-gray-500">{{ stat.label }}</span>
                <span>{{ stat.value }}</span>
              </div>
            </div>
            <p v-else class="text-sm italic text-gray-400">No usage counters for this feature.</p>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { suiteAppMetricsService, type SuiteAppMetricsRecord } from '../services/suiteAppMetricsService';
import { labelize, formatSizeGb } from '../utils/suiteAppMetricsExport';

const route = useRoute();
const router = useRouter();

const record = ref<SuiteAppMetricsRecord | null>(null);
const loading = ref(false);
const error = ref('');

const accountIdProductCode = computed(() => String(route.params.accountIdProductCode));
const accountId = computed(() => {
  const idx = accountIdProductCode.value.lastIndexOf('_');
  return idx === -1 ? accountIdProductCode.value : accountIdProductCode.value.slice(0, idx);
});
const productCode = computed(() => {
  const idx = accountIdProductCode.value.lastIndexOf('_');
  return idx === -1 ? '' : accountIdProductCode.value.slice(idx + 1);
});

const loadRecord = async () => {
  const date = String(route.params.date);
  loading.value = true;
  error.value = '';
  record.value = null;
  try {
    record.value = await suiteAppMetricsService.fetchByKey(accountIdProductCode.value, date);
  } catch (err) {
    console.error('Failed to fetch SuiteApp Metrics snapshot', err);
    error.value = 'Failed to load this snapshot.';
  } finally {
    loading.value = false;
  }
};

const featureGroups = computed(() => {
  if (!record.value) return [];
  const groups: Array<{ key: string; label: string; enabled?: boolean; stats: Array<{ key: string; label: string; value: string }> }> = [];
  for (const [groupKey, groupVal] of Object.entries(record.value.Metrics || {})) {
    if (!groupVal || typeof groupVal !== 'object') continue;
    const enabled = 'Enabled' in groupVal ? Boolean((groupVal as any).Enabled) : undefined;
    const stats = Object.entries(groupVal as Record<string, unknown>)
      .filter(([key]) => key !== 'Enabled')
      .map(([key, value]) => ({ key, label: labelize(key), value: formatStatValue(value) }));
    groups.push({ key: groupKey, label: labelize(groupKey), enabled, stats });
  }
  return groups;
});

const formatStatValue = (value: unknown) => {
  if (value === '' || value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};

const formatCount = (value: unknown) => (typeof value === 'number' ? value.toLocaleString() : '—');
const formatGb = formatSizeGb;

const formatUpdatedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min} UTC`;
};

const goBack = () => {
  router.push({ name: 'SuiteAppMetrics' });
};

watch(() => [route.params.accountIdProductCode, route.params.date], loadRecord);

onMounted(loadRecord);
</script>
