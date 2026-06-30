import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import type { TableState } from '../types';
import { ENTITIES } from '../config/entities';

export const useEntityStore = defineStore('entity', () => {
  const activeEntityId = ref<string>('subscriptions');

  const activeEntity = computed(() => ENTITIES[activeEntityId.value]);

  const tableState = reactive<TableState>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: null,
    sortDesc: false,
    startDate: undefined,
    endDate: undefined,
    status: undefined,
    companyName: undefined,
    searchField: ENTITIES.subscriptions.searchableFields[0]?.key
  });

  function setActiveEntity(id: string) {
    if (ENTITIES[id]) {
      activeEntityId.value = id;
      // Reset table state on entity switch
      tableState.page = 1;
      tableState.search = '';
      tableState.sortBy = null;
      tableState.sortDesc = false;
      tableState.startDate = undefined;
      tableState.endDate = undefined;
      tableState.status = undefined;
      tableState.companyName = undefined;
      tableState.searchField = ENTITIES[id].searchableFields[0]?.key;
    }
  }

  return {
    activeEntityId,
    activeEntity,
    tableState,
    setActiveEntity
  };
});
