<template>
  <div v-if="entity">
    <RecordDetailView
      :entity="entity"
      :record="record"
      :loading="loading"
      :error="error"
      @close="goBack"
      @edit="openEditModal"
      @delete="openDeleteModal"
    />

    <EntityModal
      v-if="modalState.isOpen"
      :mode="modalState.mode"
      :entity="entity"
      :record="modalState.record"
      @close="closeModal"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>
  <div v-else class="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
    <p class="text-sm text-gray-600">Unknown record type.</p>
    <button
      type="button"
      @click="goBack"
      class="inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
    >
      Back to Dashboard
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { ENTITIES } from '../config/entities';
import { entityService } from '../services/entityService';
import EntityModal from '../components/EntityModal.vue';
import RecordDetailView from '../components/RecordDetailView.vue';

const route = useRoute();
const router = useRouter();

const entity = computed(() => ENTITIES[route.params.entityId as string]);

const record = ref<any>(null);
const loading = ref(false);
const error = ref('');

const modalState = ref({
  isOpen: false,
  mode: 'edit' as 'edit' | 'delete',
  record: null as any
});

const keyRecord = computed(() => {
  const currentEntity = entity.value;
  if (!currentEntity) return null;
  const base: Record<string, unknown> = { [currentEntity.partitionKeyField]: route.params.recordId as string };
  if (currentEntity.sortKeyField) {
    base[currentEntity.sortKeyField] = (route.query.sortKey as string) ?? '';
  }
  return base;
});

const loadRecord = async () => {
  const currentEntity = entity.value;
  if (!currentEntity || !keyRecord.value) return;

  loading.value = true;
  error.value = '';
  record.value = null;
  try {
    record.value = await entityService.fetchRecordById(currentEntity, keyRecord.value);
  } catch (err) {
    console.error('Failed to fetch record details', err);
    error.value = `Failed to load ${currentEntity.name.toLowerCase()} details.`;
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push({ name: 'Dashboard' });
};

const openEditModal = (rec: Record<string, any>) => {
  modalState.value = { isOpen: true, mode: 'edit', record: { ...rec } };
};

const openDeleteModal = (rec: Record<string, any>) => {
  modalState.value = { isOpen: true, mode: 'delete', record: { ...rec } };
};

const closeModal = () => {
  modalState.value.isOpen = false;
};

const handleSave = async (data: any) => {
  const currentEntity = entity.value;
  if (!currentEntity) return;
  loading.value = true;
  try {
    record.value = await entityService.updateRecord(currentEntity, modalState.value.record, data);
    closeModal();
  } catch (err) {
    console.error('Failed to save', err);
    const message = axios.isAxiosError(err)
      ? err.response?.data?.message || err.response?.data?.error || err.message
      : err instanceof Error
        ? err.message
        : 'Failed to save record';
    window.alert(message);
  } finally {
    loading.value = false;
  }
};

const handleDelete = async () => {
  const currentEntity = entity.value;
  if (!currentEntity) return;
  loading.value = true;
  try {
    await entityService.deleteRecord(currentEntity, modalState.value.record);
    closeModal();
    goBack();
  } catch (err) {
    console.error('Failed to delete', err);
  } finally {
    loading.value = false;
  }
};

watch(() => [route.params.entityId, route.params.recordId, route.query.sortKey], loadRecord);

onMounted(loadRecord);
</script>
