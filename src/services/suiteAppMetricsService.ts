import api from './api';

export interface SuiteAppMetricsRecord {
  AccountID_ProductCode: string;
  Date: string;
  Metrics: Record<string, any>;
  UpdatedAt?: string;
}

export interface SuiteAppMetricsFilters {
  accountId?: string;
  productCode?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SuiteAppMetricsPage {
  data: SuiteAppMetricsRecord[];
  total: number;
  nextToken?: string;
  hasMore: boolean;
}

export const suiteAppMetricsService = {
  async fetchList(
    filters: SuiteAppMetricsFilters,
    pageSize: number,
    nextToken?: string,
    signal?: AbortSignal
  ): Promise<SuiteAppMetricsPage> {
    const params: Record<string, any> = {
      pageSize,
      accountId: filters.accountId || undefined,
      productCode: filters.productCode || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined
    };
    if (nextToken) params.nextToken = nextToken;

    const response = await api.get('/suiteapp-metrics', { params, signal });
    const token = response.data?.nextToken;
    return {
      data: response.data?.data ?? [],
      total: response.data?.total ?? response.data?.data?.length ?? 0,
      nextToken: token || undefined,
      hasMore: Boolean(token)
    };
  },

  async fetchByKey(accountIdProductCode: string, date: string): Promise<SuiteAppMetricsRecord> {
    const response = await api.get(`/suiteapp-metrics/${encodeURIComponent(accountIdProductCode)}`, {
      params: { date }
    });
    return response.data?.data ?? response.data;
  }
};
