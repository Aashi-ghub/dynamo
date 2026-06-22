<template>
  <div class="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="$emit('close')"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="relative z-10 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        
        <!-- Header -->
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
            {{ modeTitle }}
          </h3>
          <div class="flex items-center space-x-2">
            <button @click="$emit('close')" class="text-gray-400 hover:text-gray-500 transition-colors">
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Delete Confirmation -->
        <div v-if="props.mode === 'delete'">
          <div class="mt-2">
            <p class="text-sm text-gray-500">
              Are you sure you want to delete this {{ props.entity.name.toLowerCase() }}? This action cannot be undone.
            </p>
          </div>
          <div class="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button type="button" @click="$emit('delete')" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
              Delete
            </button>
            <button type="button" @click="$emit('close')" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>

        <!-- Create / Edit / View Form -->
        <form v-else @submit.prevent="submitForm">
          <div class="space-y-4">
            <div v-for="field in props.entity.fields" :key="field.key">
              <label :for="field.key" class="block text-sm font-medium text-gray-700">{{ field.label }} <span v-if="field.required" class="text-red-500">*</span></label>
              
              <!-- View Mode -->
              <div v-if="props.mode === 'view'" class="mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
                {{ field.type === 'date' && formData[field.key] ? new Date(formData[field.key]).toLocaleDateString() : (formData[field.key] || '-') }}
              </div>
              
              <!-- Edit / Create Mode -->
              <div v-else class="mt-1">
                <template v-if="field.type === 'select'">
                  <select :id="field.key" v-model="formData[field.key]" :required="field.required"
                    class="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors">
                    <option value="" disabled>Select {{ field.label }}</option>
                    <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </template>
                <template v-else-if="field.type === 'boolean'">
                  <input :id="field.key" v-model="formData[field.key]" type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                </template>
                <template v-else-if="field.type === 'textarea'">
                  <textarea :id="field.key" v-model="formData[field.key]" :required="field.required" rows="3"
                    class="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors"></textarea>
                </template>
                <template v-else-if="field.type === 'date'">
                  <input :type="field.type" :id="field.key" v-model="formData[field.key]" :required="field.required"
                    class="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors" />
                </template>
                <template v-else>
                  <input :type="field.type" :id="field.key" v-model="formData[field.key]" :required="field.required"
                    class="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md transition-colors" />
                </template>
              </div>
            </div>
          </div>
          
          <div v-if="props.mode !== 'view'" class="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
              Save
            </button>
            <button type="button" @click="$emit('close')" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors">
              Cancel
            </button>
          </div>
          <div v-else class="mt-5 sm:mt-6">
            <button type="button" @click="$emit('close')" class="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm transition-colors">
              Close
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { EntityConfig } from '../types';

const props = defineProps<{
  mode: 'create' | 'view' | 'edit' | 'delete';
  entity: EntityConfig;
  record: any;
}>();

const emit = defineEmits(['close', 'save', 'delete']);

const editableKeys = computed(() => props.entity.fields.map((field) => field.key));

const toFormValue = (fieldKey: string, value: unknown) => {
  const field = props.entity.fields.find((item) => item.key === fieldKey);
  if (field?.type === 'date' && value) {
    const date = new Date(typeof value === 'number' || /^\d+$/.test(String(value)) ? Number(value) : String(value));
    return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
  }
  return value;
};

const buildFormData = (record: Record<string, any> | null | undefined) => {
  const next: Record<string, any> = {};
  for (const key of editableKeys.value) {
    next[key] = toFormValue(key, record?.[key] ?? '');
  }
  return next;
};

const formData = ref<any>(buildFormData(props.record));

const modeTitle = computed(() => {
  if (props.mode === 'create') return `Create ${props.entity.name}`;
  if (props.mode === 'edit') return `Edit ${props.entity.name}`;
  if (props.mode === 'view') return `${props.entity.name} Details`;
  if (props.mode === 'delete') return `Delete ${props.entity.name}`;
  return '';
});

watch(() => props.record, (newRecord) => {
  formData.value = buildFormData(newRecord);
}, { deep: true, immediate: true });

const submitForm = () => {
  const payload: Record<string, any> = {};
  for (const key of editableKeys.value) {
    payload[key] = formData.value[key];
  }
  emit('save', payload);
};
</script>
