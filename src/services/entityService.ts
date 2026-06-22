import api from './api';
import type { EntityConfig, PaginatedResponse, TableState } from '../types';

const recordRequest = (entity: EntityConfig, record: Record<string, unknown>) => {
  const id = String(record[entity.partitionKeyField] ?? '');
  const params: Record<string, string> = {};
  if (entity.sortKeyField && record[entity.sortKeyField] !== undefined && record[entity.sortKeyField] !== null) {
    params.sortKey = String(record[entity.sortKeyField]);
  }
  return { id, params };
};

export const entityService = {
  async fetchRecords(entity: EntityConfig, state: TableState): Promise<PaginatedResponse<any>> {
    const params: Record<string, any> = {
      pageSize: state.limit,
      search: state.search || undefined,
      searchField: state.search ? state.searchField || entity.searchableFields[0]?.key : undefined,
      sortField: state.sortBy || undefined,
      sortDirection: state.sortDesc ? 'DESC' : 'ASC'
    };

    if (entity.filters.date && state.startDate) params[`${entity.filters.date}From`] = state.startDate;
    if (entity.filters.date && state.endDate) params[`${entity.filters.date}To`] = state.endDate;
    if (entity.filters.status && state.status) params[entity.filters.status] = state.status;
    if (entity.filters.company && state.companyName) params[entity.filters.company] = state.companyName;

    const response = await api.get(entity.apiPath, { params });
    return {
      data: response.data?.data ?? [],
      total: response.data?.total ?? response.data?.data?.length ?? 0
    };
  },

  async fetchRecordById(entity: EntityConfig, record: Record<string, unknown>): Promise<any> {
    const { id, params } = recordRequest(entity, record);
    const response = await api.get(`${entity.apiPath}/${id}`, { params });
    return response.data?.data ?? response.data;
  },

  async createRecord(apiPath: string, data: any): Promise<any> {
    const response = await api.post(apiPath, data);
    return response.data?.data ?? response.data;
  },

  async updateRecord(entity: EntityConfig, record: Record<string, unknown>, data: any): Promise<any> {
    const { id, params } = recordRequest(entity, record);
    const response = await api.put(`${entity.apiPath}/${id}`, data, { params });
    return response.data?.data ?? response.data;
  },

  async deleteRecord(entity: EntityConfig, record: Record<string, unknown>): Promise<void> {
    const { id, params } = recordRequest(entity, record);
    await api.delete(`${entity.apiPath}/${id}`, { params });
  }
};
