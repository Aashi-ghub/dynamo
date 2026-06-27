<template>
  <div class="fixed inset-0 z-40 bg-white">
    <div class="flex h-full flex-col">
      <header class="border-b border-gray-200 bg-white px-4 sm:px-6 py-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-4 min-w-0">
            <button
              type="button"
              @click="$emit('close')"
              class="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to {{ entity.plural }}
            </button>
            <div class="min-w-0 hidden sm:block">
              <p class="text-sm font-medium text-gray-500">{{ entity.name }}</p>
              <h2 class="mt-0.5 truncate text-xl font-semibold text-gray-900">
                {{ recordTitle }}
              </h2>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="loading || !record"
              @click="emitEdit"
              class="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              :disabled="loading || !record"
              @click="emitDelete"
              class="inline-flex items-center rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
        <div class="mt-3 sm:hidden">
          <p class="text-sm font-medium text-gray-500">{{ entity.name }}</p>
          <h2 class="mt-0.5 text-lg font-semibold text-gray-900 break-words">
            {{ recordTitle }}
          </h2>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto bg-gray-50">
        <div v-if="loading" class="flex h-full items-center justify-center">
          <div class="flex items-center gap-3 text-sm font-medium text-gray-600">
            <svg class="h-5 w-5 animate-spin text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading record
          </div>
        </div>

        <div v-else-if="error" class="mx-auto max-w-3xl px-4 sm:px-6 py-12">
          <div class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {{ error }}
          </div>
        </div>

        <div v-else-if="record" class="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <section class="border-b border-gray-200 bg-white px-4 sm:px-6 py-5 rounded-lg shadow-sm">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div v-for="item in summaryFields" :key="item.key">
                <p class="text-xs font-medium uppercase text-gray-500">{{ item.label }}</p>
                <p class="mt-1 break-words text-sm font-medium text-gray-900">{{ formatValue(item.value, item.key) }}</p>
              </div>
            </div>
          </section>

          <section v-for="group in groupedDetailFields" :key="group.label" class="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="border-b border-gray-200 px-4 sm:px-6 py-4 bg-gray-50">
              <h3 class="text-base font-semibold text-gray-900">{{ group.label }}</h3>
            </div>
            <dl class="grid grid-cols-1 divide-y divide-gray-200 md:grid-cols-2 md:divide-x md:divide-y-0">
              <div v-for="field in group.fields" :key="field.key" class="px-4 sm:px-6 py-4">
                <dt class="text-xs font-medium uppercase text-gray-500">{{ field.label }}</dt>
                <dd class="mt-2 break-words text-sm text-gray-900">
                  <pre v-if="isStructured(field.value)" class="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs text-gray-800 overflow-x-auto">{{ formatValue(field.value) }}</pre>
                  <span v-else>{{ formatValue(field.value, field.key) }}</span>
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EntityConfig } from '../types';
import { formatDateDisplay } from '../utils/dateFormat';

const props = defineProps<{
  entity: EntityConfig;
  record: Record<string, any> | null;
  loading: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  close: [];
  edit: [record: Record<string, any>];
  delete: [record: Record<string, any>];
}>();

const dateFieldKeys = computed(() => {
  const keys = new Set(props.entity.fields.filter((field) => field.type === 'date').map((field) => field.key));
  for (const column of props.entity.columns) {
    if (column.type === 'date') keys.add(column.key);
  }
  return keys;
});

const knownLabels = computed(() => {
  const labels = new Map<string, string>();
  for (const column of props.entity.columns) labels.set(column.key, column.label);
  for (const field of props.entity.fields) labels.set(field.key, field.label);
  for (const group of props.entity.detailGroups) {
    for (const field of group.fields) labels.set(field, labels.get(field) || humanize(field));
  }
  labels.set('id', 'ID');
  return labels;
});

const detailFields = computed(() => {
  if (!props.record) return [];
  const configuredFields = props.entity.detailGroups.flatMap((group) => group.fields);
  return configuredFields.filter((key) => Object.hasOwn(props.record || {}, key)).map((key) => ({
    key,
    label: knownLabels.value.get(key) || humanize(key),
    value: props.record?.[key]
  }));
});

const groupedDetailFields = computed(() => props.entity.detailGroups.map((group) => ({
  label: group.label,
  fields: group.fields
    .filter((key) => props.record && Object.hasOwn(props.record, key))
    .map((key) => ({
      key,
      label: knownLabels.value.get(key) || humanize(key),
      value: props.record?.[key]
    }))
})).filter((group) => group.fields.length > 0));

const summaryFields = computed(() => detailFields.value.slice(0, 4));

const recordTitle = computed(() => {
  if (!props.record) return `${props.entity.name} Details`;
  const titleField = [props.entity.titleField, 'name', 'companyName', 'fileName', 'email', 'subscriptionId', 'id'].find((key) => props.record?.[key]);
  return titleField ? String(props.record[titleField]) : `${props.entity.name} Details`;
});

const humanize = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();

const isStructured = (value: unknown) => value !== null && typeof value === 'object';

const emitEdit = () => {
  if (props.record) emit('edit', props.record);
};

const emitDelete = () => {
  if (props.record) emit('delete', props.record);
};

const formatValue = (value: unknown, key?: string) => {
  if (value === null || value === undefined || value === '') return '-';
  if (key === 'deactivateSubscription' && typeof value === 'boolean') return value ? 'Deactivated' : 'Active';
  if (key && dateFieldKeys.value.has(key)) return formatDateDisplay(value);
  if (value instanceof Date) return formatDateDisplay(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (isStructured(value)) return JSON.stringify(value, null, 2);
  if (typeof value === 'number' && value > 100000000000) return formatDateDisplay(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return formatDateDisplay(value);
  return String(value);
};
</script>
