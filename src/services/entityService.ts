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

const normalizeListState = (entity: EntityConfig, state: TableState) => {
  const search = state.search?.trim() || '';
  const companyName = state.companyName?.trim() || '';
  const status = state.status?.trim() || '';

  return {
    pageSize: state.limit,
    search: search || undefined,
    searchField: search ? state.searchField || entity.searchableFields[0]?.key : undefined,
    sortField: state.sortBy || undefined,
    sortDirection: state.sortDesc ? 'DESC' : 'ASC',
    status: status || undefined,
    companyName: companyName || undefined,
    startDate: state.startDate || undefined,
    endDate: state.endDate || undefined
  };
};

export const entityService = {
  async fetchRecords(
    entity: EntityConfig,
    state: TableState,
    nextToken?: string,
    signal?: AbortSignal
  ): Promise<PaginatedResponse<any>> {
    const normalized = normalizeListState(entity, state);
    const params: Record<string, any> = {
      pageSize: normalized.pageSize,
      search: normalized.search,
      searchField: normalized.searchField,
      sortField: normalized.sortField,
      sortDirection: normalized.sortDirection
    };

    if (nextToken) params.nextToken = nextToken;
    if (entity.filters.date && normalized.startDate) params[`${entity.filters.date}From`] = normalized.startDate;
    if (entity.filters.date && normalized.endDate) params[`${entity.filters.date}To`] = normalized.endDate;
    if (entity.filters.status && normalized.status) params[entity.filters.status] = normalized.status;
    if (entity.filters.company && normalized.companyName) params[entity.filters.company] = normalized.companyName;

    const response = await api.get(entity.apiPath, { params, signal });
    const token = response.data?.nextToken;
    return {
      data: response.data?.data ?? [],
      total: response.data?.total ?? response.data?.data?.length ?? 0,
      nextToken: token || undefined,
      hasMore: Boolean(token)
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
