<template>
  <div class="flex flex-col h-full min-h-[60vh]">
    <!-- Toolbar -->
    <div class="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
      <div class="flex flex-col space-y-4 w-full">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">SuiteApp Metrics</h2>
            <p class="text-sm text-gray-500">Daily usage snapshots per account and product, synced from NetSuite.</p>
          </div>
          <div class="flex items-center space-x-3">
            <button @click="() => fetchData(true)" class="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="Refresh">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
            <button @click="exportToExcel" :disabled="exporting || records.length === 0"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-semibold rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {{ exporting ? 'Exporting...' : 'Download Excel' }}
            </button>
          </div>
        </div>
        <div class="flex flex-wrap gap-4 items-end">
          <!-- Account ID search -->
          <div class="w-full sm:w-auto sm:flex-1 sm:min-w-[220px]">
            <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Search Account ID</label>
            <input
              type="text"
              v-model="accountIdInput"
              @input="onAccountIdSearch"
              placeholder="Search account..."
              class="block w-full min-w-0 pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
            />
          </div>
          <!-- Product Code -->
          <div class="w-full sm:w-auto sm:min-w-[180px]">
            <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Product Code</label>
            <select v-model="productCode" @change="onFilterChange" class="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md bg-white">
              <option value="">All products</option>
              <option v-for="opt in PRODUCT_CODE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <!-- Snapshot Date Range -->
          <div class="w-full sm:w-auto sm:flex-1 sm:min-w-[280px]">
            <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Snapshot Date Range</label>
            <div class="flex flex-col sm:flex-row gap-2">
              <VueDatePicker
                :model-value="dateFrom ?? null"
                @update:model-value="(v: string | null) => onDateRangeChange(v, 'dateFrom')"
                model-type="yyyy-MM-dd"
                format="yyyy-MM-dd"
                :enable-time-picker="false"
                :text-input="true"
                :clearable="true"
                auto-apply
                placeholder="yyyy-mm-dd"
                class="w-full min-w-0 sm:min-w-[130px]"
              />
              <VueDatePicker
                :model-value="dateTo ?? null"
                @update:model-value="(v: string | null) => onDateRangeChange(v, 'dateTo')"
                model-type="yyyy-MM-dd"
                format="yyyy-MM-dd"
                :enable-time-picker="false"
                :text-input="true"
                :clearable="true"
                auto-apply
                placeholder="yyyy-mm-dd"
                class="w-full min-w-0 sm:min-w-[130px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Area -->
    <div class="flex-1 overflow-auto relative w-full">
      <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div class="w-full overflow-x-auto">
        <table class="w-full min-w-[900px] divide-y divide-gray-200">
          <thead class="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Account ID</th>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Snapshot Date</th>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total SkyDoc Files</th>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total SkyDoc Files Size</th>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">NetSuite File Cabinet Size</th>
              <th class="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">Metrics</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="!loading && records.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-gray-500">No snapshots found.</td>
            </tr>
            <tr v-for="record in records" :key="`${record.AccountID_ProductCode}-${record.Date}`" class="hover:bg-primary-50/30 transition-colors">
              <td class="px-4 sm:px-6 py-4 text-sm text-gray-900 font-mono">{{ splitAccountProduct(record).accountId }}</td>
              <td class="px-4 sm:px-6 py-4 text-sm text-gray-900">{{ splitAccountProduct(record).productCode }}</td>
              <td class="px-4 sm:px-6 py-4 text-sm text-gray-900 font-mono whitespace-nowrap">{{ record.Date }}</td>
              <td class="px-4 sm:px-6 py-4 text-sm text-gray-900 font-mono">{{ formatCount(record.Metrics?.TotalFiles) }}</td>
              <td class="px-4 sm:px-6 py-4 text-sm text-gray-900 font-mono">{{ formatGb(record.Metrics?.TotalSize) }}</td>
              <td class="px-4 sm:px-6 py-4 text-sm text-gray-500 font-mono">—</td>
              <td class="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white">
                <a
                  :href="viewHref(record)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center px-3 py-1 rounded-full text-primary-600 hover:bg-primary-50 hover:text-primary-800 font-semibold transition-colors"
                >View</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div class="px-4 sm:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
      <div class="text-sm text-gray-700 text-center sm:text-left">
        Showing <span class="font-semibold">{{ resultStart }}</span> to <span class="font-semibold">{{ resultEnd }}</span> of <span class="font-semibold">{{ totalCount }}</span>
      </div>
      <div class="flex items-center space-x-2">
        <button @click="prevPage" :disabled="currentPageIndex === 0 || loading" class="px-4 py-1.5 border border-gray-300 rounded-full text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors">
          Previous
        </button>
        <span class="text-sm text-gray-500 font-medium px-2">Page {{ currentPageIndex + 1 }}</span>
        <button @click="nextPage" :disabled="!hasNextPage || loading" class="px-4 py-1.5 border border-gray-300 rounded-full text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors">
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { suiteAppMetricsService, type SuiteAppMetricsRecord } from '../services/suiteAppMetricsService';
import { splitAccountProduct, exportSuiteAppMetricsToExcel, formatSizeGb, type VisibleColumn } from '../utils/suiteAppMetricsExport';
import { PRODUCT_CODE_OPTIONS } from '../config/subscriptionConstants';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { debounce } from '../utils/debounce';

const router = useRouter();

const records = ref<SuiteAppMetricsRecord[]>([]);
const totalCount = ref(0);
const loading = ref(false);
const exporting = ref(false);

const accountIdInput = ref('');
const accountId = ref('');
const productCode = ref('');
const dateFrom = ref<string | undefined>(undefined);
const dateTo = ref<string | undefined>(undefined);

const pageSize = 10;
const pageTokens = ref<(string | undefined)[]>([undefined]);
const currentPageIndex = ref(0);
const hasNextPage = ref(false);
let fetchController: AbortController | null = null;
let fetchSeq = 0;

const resetPagination = () => {
  pageTokens.value = [undefined];
  currentPageIndex.value = 0;
  hasNextPage.value = false;
};

const fetchData = async (force = false) => {
  const pageToken = pageTokens.value[currentPageIndex.value];

  fetchController?.abort();
  fetchController = new AbortController();
  const { signal } = fetchController;
  const seq = ++fetchSeq;

  loading.value = true;
  try {
    const res = await suiteAppMetricsService.fetchList(
      { accountId: accountId.value, productCode: productCode.value, dateFrom: dateFrom.value, dateTo: dateTo.value },
      pageSize,
      pageToken,
      signal
    );
    if (seq !== fetchSeq) return;
    records.value = res.data;
    totalCount.value = res.total;
    hasNextPage.value = res.hasMore;
    if (res.nextToken) {
      pageTokens.value[currentPageIndex.value + 1] = res.nextToken;
    } else {
      pageTokens.value = pageTokens.value.slice(0, currentPageIndex.value + 1);
    }
  } catch (error: any) {
    if (error?.code === 'ERR_CANCELED') return;
    console.error('Failed to fetch SuiteApp Metrics', error);
  } finally {
    if (seq === fetchSeq) loading.value = false;
  }
  void force;
};

const resultStart = computed(() => (records.value.length === 0 ? 0 : currentPageIndex.value * pageSize + 1));
const resultEnd = computed(() => currentPageIndex.value * pageSize + records.value.length);

const applyAccountIdFilter = () => {
  accountId.value = accountIdInput.value.trim();
  resetPagination();
  fetchData();
};
const onAccountIdSearch = debounce(applyAccountIdFilter, 300);

const onFilterChange = () => {
  resetPagination();
  fetchData();
};

const onDateRangeChange = debounce((value: string | null, field: 'dateFrom' | 'dateTo') => {
  if (field === 'dateFrom') dateFrom.value = value || undefined;
  else dateTo.value = value || undefined;
  resetPagination();
  fetchData();
}, 300);

const prevPage = () => {
  if (currentPageIndex.value === 0 || loading.value) return;
  currentPageIndex.value--;
  fetchData();
};

const nextPage = () => {
  if (!hasNextPage.value || loading.value) return;
  currentPageIndex.value++;
  fetchData();
};

const formatCount = (value: unknown) => (typeof value === 'number' ? value.toLocaleString() : '—');
const formatGb = formatSizeGb;

const viewHref = (record: SuiteAppMetricsRecord) =>
  router.resolve({
    name: 'SuiteAppMetricsDetail',
    params: { accountIdProductCode: record.AccountID_ProductCode, date: record.Date }
  }).href;

const visibleColumns: VisibleColumn[] = [
  { key: 'accountId', label: 'Account ID' },
  { key: 'productCode', label: 'Product Code' },
  { key: 'Date', label: 'Snapshot Date' },
  { key: 'Metrics.TotalFiles', label: 'Total SkyDoc Files', type: 'number' },
  { key: 'Metrics.TotalSize', label: 'Total SkyDoc Files Size (GB)', type: 'bytesToGb' }
];

const exportToExcel = async () => {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const allRows: SuiteAppMetricsRecord[] = [];
    let nextToken: string | undefined;
    let pages = 0;
    do {
      const res = await suiteAppMetricsService.fetchList(
        { accountId: accountId.value, productCode: productCode.value, dateFrom: dateFrom.value, dateTo: dateTo.value },
        100,
        nextToken
      );
      allRows.push(...res.data);
      nextToken = res.nextToken;
      pages++;
    } while (nextToken && pages < 200);

    await exportSuiteAppMetricsToExcel(allRows, visibleColumns);
  } catch (error) {
    console.error('Failed to export SuiteApp Metrics', error);
    window.alert('Failed to export SuiteApp Metrics to Excel.');
  } finally {
    exporting.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>
