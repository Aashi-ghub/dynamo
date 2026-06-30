<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-6">
      <div class="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" @click="$emit('close')"></div>

      <div
        class="relative z-10 flex w-full max-w-[calc(100vw-2rem)] max-h-[min(92vh,920px)] flex-col overflow-hidden rounded-xl bg-white text-left shadow-xl sm:max-w-2xl lg:max-w-4xl"
      >
        <!-- Header -->
        <div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
          <h3 class="pr-4 text-lg font-semibold text-gray-900" id="modal-title">
            {{ modeTitle }}
          </h3>
          <button
            type="button"
            @click="$emit('close')"
            class="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Delete Confirmation -->
        <div v-if="props.mode === 'delete'" class="flex flex-1 flex-col px-4 py-5 sm:px-6">
          <p class="text-sm leading-relaxed text-gray-600">
            Are you sure you want to delete this {{ props.entity.name.toLowerCase() }}? This action cannot be undone.
          </p>
          <div class="mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              @click="$emit('close')"
              class="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="$emit('delete')"
              class="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 sm:w-auto"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Create / Edit / View Form -->
        <form v-else class="flex min-h-0 flex-1 flex-col" novalidate @submit.prevent="submitForm">
          <div class="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <p v-if="saveError" class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {{ saveError }}
            </p>
            <div class="space-y-8">
              <section v-for="section in formSections" :key="section.label || 'default'">
                <h4
                  v-if="section.label"
                  class="mb-4 border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500"
                >
                  {{ section.label }}
                </h4>

                <div class="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                  <div
                    v-for="field in section.fields"
                    :key="field.key"
                    :class="fieldSpanClass(field)"
                  >
                    <label
                      v-if="field.type !== 'boolean'"
                      :for="field.key"
                      class="mb-1.5 block text-sm font-medium leading-snug text-gray-700"
                    >
                      {{ field.label }}
                      <span v-if="field.required" class="text-red-500">*</span>
                    </label>

                    <!-- View / read-only Mode -->
                    <div
                      v-if="isFieldReadOnly(field)"
                      class="min-h-[2.5rem] rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-relaxed text-gray-900 break-words"
                    >
                      {{ formatDisplayValue(field, formData[field.key]) }}
                    </div>

                    <!-- Edit / Create Mode -->
                    <template v-else>
                      <select
                        v-if="field.type === 'select'"
                        :id="field.key"
                        v-model="formData[field.key]"
                        :required="field.required"
                        class="field-input"
                      >
                        <option v-if="props.mode === 'create' || !formData[field.key]" value="" disabled>
                          Select {{ field.label }}
                        </option>
                        <option
                          v-if="hasCustomSelectValue(field)"
                          :value="formData[field.key]"
                        >
                          {{ formData[field.key] }}
                        </option>
                        <option v-for="opt in field.options" :key="String(opt.value)" :value="opt.value">
                          {{ opt.label }}
                        </option>
                      </select>

                      <label
                        v-else-if="field.type === 'boolean'"
                        :for="field.key"
                        class="flex min-h-[2.75rem] cursor-pointer items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5"
                      >
                        <input
                          :id="field.key"
                          v-model="formData[field.key]"
                          type="checkbox"
                          class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span class="text-sm text-gray-700">{{ field.label }}</span>
                      </label>

                      <textarea
                        v-else-if="field.type === 'textarea'"
                        :id="field.key"
                        v-model="formData[field.key]"
                        :required="field.required"
                        rows="4"
                        class="field-input resize-y"
                      ></textarea>

                      <input
                        v-else
                        :type="field.type === 'date' ? 'date' : fieldInputType(field)"
                        :id="field.key"
                        v-model="formData[field.key]"
                        :required="field.required"
                        :step="field.type === 'number' ? 'any' : undefined"
                        class="field-input"
                      />
                    </template>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div class="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
            <div v-if="props.mode !== 'view'" class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                @click="$emit('close')"
                class="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 sm:w-auto"
              >
                Save
              </button>
            </div>
            <div v-else class="flex justify-end">
              <button
                type="button"
                @click="$emit('close')"
                class="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { EntityConfig } from '../types';
import { formatDateDisplay, toDateInputValue } from '../utils/dateFormat';

type EntityField = EntityConfig['fields'][number];

const props = defineProps<{
  mode: 'create' | 'view' | 'edit' | 'delete';
  entity: EntityConfig;
  record: any;
}>();

const emit = defineEmits(['close', 'save', 'delete']);

const editableKeys = computed(() => props.entity.fields.map((field) => field.key));

const isReadonlyField = (fieldKey: string) => {
  if (props.entity.readonlyFields?.includes(fieldKey)) return true;
  if (props.mode === 'edit') {
    if (fieldKey === props.entity.partitionKeyField) return true;
    if (props.entity.sortKeyField && fieldKey === props.entity.sortKeyField) return true;
  }
  return false;
};

const isFieldReadOnly = (field: EntityField) => props.mode === 'view' || isReadonlyField(field.key);

const shouldShowField = (field: EntityField) => {
  if (props.mode === 'view') return true;
  if (props.mode === 'edit' && (field.key === props.entity.partitionKeyField || field.key === props.entity.sortKeyField)) {
    return true;
  }
  return !isReadonlyField(field.key);
};

const formSections = computed(() => {
  const fieldByKey = new Map(props.entity.fields.map((field) => [field.key, field]));
  const groups = props.entity.detailGroups?.length
    ? props.entity.detailGroups
    : [{ label: '', fields: props.entity.fields.map((field) => field.key) }];

  return groups
    .map((group) => ({
      label: group.label,
      fields: group.fields
        .map((key) => fieldByKey.get(key))
        .filter((field): field is EntityField => !!field && shouldShowField(field))
    }))
    .filter((group) => group.fields.length > 0);
});

const fieldSpanClass = (field: EntityField) => {
  if (field.type === 'textarea') return 'md:col-span-2';
  if (field.type === 'boolean') return 'md:col-span-2';
  return '';
};

const toFormValue = (fieldKey: string, value: unknown) => {
  const field = props.entity.fields.find((item) => item.key === fieldKey);
  if (field?.type === 'boolean') {
    return Boolean(value);
  }
  if (field?.type === 'date' && value) {
    return toDateInputValue(value);
  }
  return value ?? '';
};

const buildFormData = (record: Record<string, any> | null | undefined) => {
  const next: Record<string, any> = {};
  for (const key of editableKeys.value) {
    next[key] = toFormValue(key, record?.[key]);
  }
  return next;
};

const formData = ref<any>(buildFormData(props.record));
const saveError = ref('');

const visibleFieldKeys = computed(() =>
  formSections.value.flatMap((section) => section.fields.map((field) => field.key))
);

const fieldInputType = (field: EntityField) => {
  if (field.type === 'number') return 'number';
  if (field.type === 'email') return 'email';
  return field.type;
};

const hasCustomSelectValue = (field: EntityField) => {
  const value = formData.value[field.key];
  if (value === '' || value === null || value === undefined) return false;
  return !field.options?.some((option) => option.value === value);
};

const modeTitle = computed(() => {
  if (props.mode === 'create') return `Create ${props.entity.name}`;
  if (props.mode === 'edit') return `Edit ${props.entity.name}`;
  if (props.mode === 'view') return `${props.entity.name} Details`;
  if (props.mode === 'delete') return `Delete ${props.entity.name}`;
  return '';
});

const formatDisplayValue = (field: EntityField, value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  if (field.type === 'date') return formatDateDisplay(value);
  if (field.type === 'boolean') {
    if (field.key === 'deactivateSubscription') return value ? 'Deactivated' : 'Active';
    return value ? 'Yes' : 'No';
  }
  return String(value);
};

watch(() => props.record, (newRecord) => {
  formData.value = buildFormData(newRecord);
  saveError.value = '';
}, { deep: true, immediate: true });

const submitForm = () => {
  saveError.value = '';

  if (props.mode === 'create' || props.mode === 'edit') {
    const missingFields = formSections.value
      .flatMap((section) => section.fields)
      .filter((field) => field.required)
      .filter((field) => {
        const value = formData.value[field.key];
        return value === '' || value === null || value === undefined;
      });

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map((f) => f.label).join('\n• ');
      window.alert(`Please fill in the following required fields:\n• ${fieldNames}`);
      return;
    }
  }

  const payload: Record<string, any> = {};
  for (const key of visibleFieldKeys.value) {
    if (isReadonlyField(key)) continue;
    const value = formData.value[key];
    const field = props.entity.fields.find((item) => item.key === key);
    if (field?.type === 'boolean') {
      payload[key] = Boolean(value);
      continue;
    }
    if (field?.type === 'number') {
      if (value === '' || value === null || value === undefined) continue;
      const num = Number(value);
      payload[key] = isNaN(num) ? value : num;
      continue;
    }
    if (value === '') continue;
    payload[key] = value;
  }
  emit('save', payload);
};
</script>

<style scoped>
.field-input {
  display: block;
  width: 100%;
  min-width: 0;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  background-color: #fff;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #111827;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 1px var(--color-primary-500);
}
</style>
