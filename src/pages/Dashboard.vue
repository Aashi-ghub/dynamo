<template>
  <div class="flex flex-col h-full">
    <!-- Toolbar -->
    <div class="px-6 py-4 border-b border-gray-200 bg-white">
      <div class="flex flex-col space-y-4 w-full">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium text-gray-900">{{ activeEntity.plural }}</h2>
          <div class="flex items-center space-x-3">
            <button @click="fetchData" class="p-2 text-gray-400 hover:text-gray-500 transition-colors" title="Refresh">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
            <button @click="openCreateModal"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
              Create {{ activeEntity.name }}
            </button>
          </div>
        </div>
        <div class="flex flex-wrap gap-4 items-end">
          <!-- Search -->
          <div class="flex-1 min-w-[200px] max-w-sm">
            <label class="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div class="flex gap-2">
              <select
                v-model="entityStore.tableState.searchField"
                @change="onFilterChange"
                class="block w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option v-for="field in activeEntity.searchableFields" :key="field.key" :value="field.key">{{ field.label }}</option>
              </select>
              <input
                type="text"
                v-model="searchInput"
                @input="onSearch"
                :placeholder="`Search ${selectedSearchLabel}`"
                class="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
              />
            </div>
          </div>
          <!-- Status Filter -->
          <div v-if="activeEntity.filters.status" class="w-48">
            <label class="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select v-model="entityStore.tableState.status" @change="onFilterChange" class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white">
              <option :value="undefined">All Statuses</option>
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <!-- Company Name Filter -->
          <div v-if="activeEntity.filters.company" class="w-64">
            <label class="block text-xs font-medium text-gray-500 mb-1">Company</label>
            <input
              type="text"
              v-model="companyInput"
              @input="onCompanySearch"
              placeholder="Company Name..."
              class="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
            />
          </div>
          <!-- Date Range Filter -->
          <div v-if="activeEntity.filters.date" class="flex items-center space-x-2">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input type="date" v-model="entityStore.tableState.startDate" @change="onFilterChange" class="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input type="date" v-model="entityStore.tableState.endDate" @change="onFilterChange" class="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Area -->
    <div class="flex-1 overflow-auto relative">
      <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50 sticky top-0 z-0">
          <tr>
            <th v-for="col in activeEntity.columns" :key="col.key" scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                @click="sortBy(col.key)">
              <div class="flex items-center space-x-1">
                <span>{{ col.label }}</span>
                <span v-if="entityStore.tableState.sortBy === col.key" class="text-primary-600">
                  <svg v-if="entityStore.tableState.sortDesc" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
                </span>
              </div>
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="!loading && records.length === 0">
            <td :colspan="activeEntity.columns.length + 1" class="px-6 py-12 text-center text-gray-500">
              No {{ activeEntity.plural.toLowerCase() }} found.
            </td>
          </tr>
          <tr v-for="record in records" :key="record[activeEntity.partitionKeyField] || record.id || record.subscriptionId" class="hover:bg-gray-50 transition-colors">
            <td v-for="col in activeEntity.columns" :key="col.key" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <span v-if="col.type === 'status'" :class="[
                record[col.key] === 'Active' ? 'bg-green-100 text-green-800' : 
                record[col.key] === 'Inactive' || record[col.key] === 'Canceled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800',
                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
              ]">
                {{ record[col.key] }}
              </span>
              <span v-else-if="col.type === 'date'">
                {{ formatValue(record[col.key], col.type) }}
              </span>
              <span v-else>
                {{ record[col.key] }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button @click="openViewModal(record)" class="text-primary-600 hover:text-primary-900 transition-colors">View</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-white">
      <div class="text-sm text-gray-700">
        Showing <span class="font-medium">{{ (entityStore.tableState.page - 1) * entityStore.tableState.limit + 1 }}</span> to <span class="font-medium">{{ Math.min(entityStore.tableState.page * entityStore.tableState.limit, totalRecords) }}</span> of <span class="font-medium">{{ totalRecords }}</span> results
      </div>
      <div class="flex items-center space-x-2">
        <button @click="prevPage" :disabled="entityStore.tableState.page === 1" class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors">
          Previous
        </button>
        <button @click="nextPage" :disabled="entityStore.tableState.page * entityStore.tableState.limit >= totalRecords" class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors">
          Next
        </button>
      </div>
    </div>

    <!-- Modals -->
    <EntityModal 
      v-if="modalState.isOpen"
      :mode="modalState.mode"
      :entity="activeEntity"
      :record="modalState.record"
      @close="closeModal"
      @save="handleSave"
      @delete="handleDelete"
    />

    <RecordDetailView
      v-if="detailState.isOpen"
      :entity="activeEntity"
      :record="detailState.record"
      :loading="detailState.loading"
      :error="detailState.error"
      @close="closeDetailView"
      @edit="openEditFromDetail"
      @delete="openDeleteFromDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useEntityStore } from '../stores/entityStore';
import { entityService } from '../services/entityService';
import EntityModal from '../components/EntityModal.vue';
import RecordDetailView from '../components/RecordDetailView.vue';
import { debounce } from '../utils/debounce';

const entityStore = useEntityStore();
const activeEntity = computed(() => entityStore.activeEntity);

const records = ref<any[]>([]);
const totalRecords = ref(0);
const loading = ref(false);
const searchInput = ref('');
const companyInput = ref('');

// Modal state
const modalState = ref({
  isOpen: false,
  mode: 'create' as 'create' | 'edit' | 'delete',
  record: null as any
});

const detailState = ref({
  isOpen: false,
  loading: false,
  error: '',
  record: null as any
});

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await entityService.fetchRecords(activeEntity.value, entityStore.tableState);
    records.value = res.data;
    totalRecords.value = res.total;
  } catch (error) {
    console.error("Failed to fetch records", error);
    // In a real app, show a toast notification here
  } finally {
    loading.value = false;
  }
};

const onSearch = debounce(() => {
  entityStore.tableState.search = searchInput.value;
  entityStore.tableState.page = 1;
  fetchData();
}, 300);

const onCompanySearch = debounce(() => {
  entityStore.tableState.companyName = companyInput.value;
  entityStore.tableState.page = 1;
  fetchData();
}, 300);

const onFilterChange = () => {
  entityStore.tableState.page = 1;
  fetchData();
};

const statusOptions = computed(() => {
  const statusKey = activeEntity.value.filters.status;
  const statusField = activeEntity.value.fields.find(f => f.key === statusKey);
  return statusField?.options || [];
});

const selectedSearchLabel = computed(() => {
  const field = activeEntity.value.searchableFields.find((item) => item.key === entityStore.tableState.searchField);
  return field?.label || activeEntity.value.searchableFields[0]?.label || '';
});

const sortBy = (key: string) => {
  if (entityStore.tableState.sortBy === key) {
    entityStore.tableState.sortDesc = !entityStore.tableState.sortDesc;
  } else {
    entityStore.tableState.sortBy = key;
    entityStore.tableState.sortDesc = false;
  }
  fetchData();
};

const prevPage = () => {
  if (entityStore.tableState.page > 1) {
    entityStore.tableState.page--;
    fetchData();
  }
};

const nextPage = () => {
  if (entityStore.tableState.page * entityStore.tableState.limit < totalRecords.value) {
    entityStore.tableState.page++;
    fetchData();
  }
};

// Modal Actions
const openCreateModal = () => {
  modalState.value = { isOpen: true, mode: 'create', record: {} };
};

const openViewModal = async (record: any) => {
  detailState.value = {
    isOpen: true,
    loading: true,
    error: '',
    record: null
  };

  try {
    const detailRecord = await entityService.fetchRecordById(activeEntity.value, record);
    detailState.value.record = detailRecord;
  } catch (error) {
    console.error("Failed to fetch record details", error);
    detailState.value.error = `Failed to load ${activeEntity.value.name.toLowerCase()} details.`;
  } finally {
    detailState.value.loading = false;
  }
};

const openEditModal = (record: any) => {
  modalState.value = { isOpen: true, mode: 'edit', record: { ...record } };
};

const openDeleteModal = (record: any) => {
  modalState.value = { isOpen: true, mode: 'delete', record: { ...record } };
};

const closeModal = () => {
  modalState.value.isOpen = false;
};

const closeDetailView = () => {
  detailState.value = {
    isOpen: false,
    loading: false,
    error: '',
    record: null
  };
};

const openEditFromDetail = (record: any) => {
  openEditModal(record);
};

const openDeleteFromDetail = (record: any) => {
  openDeleteModal(record);
};

const handleSave = async (data: any) => {
  loading.value = true;
  try {
    if (modalState.value.mode === 'create') {
      await entityService.createRecord(activeEntity.value.apiPath, data);
    } else {
      const updatedRecord = await entityService.updateRecord(activeEntity.value, modalState.value.record, data);
      if (detailState.value.isOpen) {
        detailState.value.record = updatedRecord;
      }
    }
    closeModal();
    fetchData();
  } catch (error) {
    console.error("Failed to save", error);
  } finally {
    loading.value = false;
  }
};

const handleDelete = async () => {
  loading.value = true;
  try {
    await entityService.deleteRecord(activeEntity.value, modalState.value.record);
    closeModal();
    closeDetailView();
    fetchData();
  } catch (error) {
    console.error("Failed to delete", error);
  } finally {
    loading.value = false;
  }
};

// Watch for entity change to refetch data
watch(() => activeEntity.value.id, () => {
  searchInput.value = '';
  companyInput.value = '';
  entityStore.tableState.searchField = activeEntity.value.searchableFields[0]?.key;
  closeDetailView();
  closeModal();
  fetchData();
});

onMounted(() => {
  entityStore.tableState.searchField = activeEntity.value.searchableFields[0]?.key;
  fetchData();
});

const formatValue = (value: unknown, type?: string) => {
  if (value === null || value === undefined || value === '') return '-';
  if (type === 'date') {
    const date = new Date(typeof value === 'number' || /^\d+$/.test(String(value)) ? Number(value) : String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};
</script>
