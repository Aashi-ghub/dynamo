import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import type { TableState } from '../types';
import { ENTITIES } from '../config/entities';

export const useEntityStore = defineStore('entity', () => {
  const activeEntityId = ref<string>('accounts');
  
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
    companyName: undefined
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
    }
  }

  return {
    activeEntityId,
    activeEntity,
    tableState,
    setActiveEntity
  };
});

import { computed } from 'vue';
