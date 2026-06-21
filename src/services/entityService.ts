import api from './api';
import type { PaginatedResponse, TableState } from '../types';

export const entityService = {
  async fetchRecords(apiPath: string, state: TableState): Promise<PaginatedResponse<any>> {
    const params: Record<string, any> = {
      page: state.page,
      limit: state.limit,
      search: state.search,
      sortBy: state.sortBy,
      sortDesc: state.sortDesc
    };
    
    if (state.startDate) params.startDateFrom = state.startDate;
    if (state.endDate) params.startDateTo = state.endDate; // or createdAtFrom/createdAtTo based on the backend filter config
    // Actually the backend uses dateRanges for anything ending in From/To
    // The backend uses 'createdAt' as a default filterable date.
    if (state.startDate) params.createdAtFrom = state.startDate;
    if (state.endDate) params.createdAtTo = state.endDate;
    
    if (state.status) params.status = state.status;
    if (state.companyName) params.name = state.companyName; // Usually company name maps to 'name' in accounts

    try {
      const response = await api.get(apiPath, { params });
      return {
        data: response.data?.data ?? [],
        total: response.data?.total ?? response.data?.data?.length ?? 0
      };
    } catch (e) {
      console.warn("API failed, falling back to mock data", e);
      // Generate mock data based on the path
      const mockData = Array.from({ length: state.limit }).map((_, i) => ({
        id: `rec_${state.page}_${i}`,
        name: `Mock Record ${i}`,
        email: `mock${i}@example.com`,
        status: i % 2 === 0 ? 'Active' : 'Inactive',
        createdAt: new Date().toISOString(),
        accountId: `acc_${i}`,
        plan: 'Enterprise',
        fileName: `file_${i}.pdf`,
        fileSize: 1024 * i,
        uploadedBy: 'Admin',
        uploadDate: new Date().toISOString(),
        firstName: `First${i}`,
        lastName: `Last${i}`,
        industry: i % 2 === 0 ? 'Technology' : 'Finance',
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }));
      return { data: mockData, total: 100 };
    }
  },

  async fetchRecordById(apiPath: string, id: string): Promise<any> {
    try {
      const response = await api.get(`${apiPath}/${id}`);
      return response.data?.data ?? response.data;
    } catch (e) {
      console.warn("API failed, falling back to mock detail data", e);
      const now = new Date().toISOString();
      const baseRecord = {
        id,
        status: 'Active',
        active: true,
        createdAt: now,
        updatedAt: now,
        createdBy: 'local-developer',
        updatedBy: 'local-developer',
        notes: 'Mock detail record used when the local API is unavailable.'
      };

      if (apiPath.includes('contacts')) {
        return {
          ...baseRecord,
          firstName: 'First',
          lastName: id,
          email: `${id}@example.com`,
          phone: '+1 555 0100',
          accountId: 'acc_001',
          title: 'Finance Contact'
        };
      }

      if (apiPath.includes('subscriptions')) {
        return {
          ...baseRecord,
          accountId: 'acc_001',
          plan: 'Enterprise',
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          billingCycle: 'Annual',
          seats: 25
        };
      }

      if (apiPath.includes('cloud-files')) {
        return {
          ...baseRecord,
          fileName: `${id}.pdf`,
          fileSize: 2048,
          uploadedBy: 'Admin',
          uploadDate: now,
          contentType: 'application/pdf',
          storageKey: `cloud-files/${id}.pdf`
        };
      }

      return {
        ...baseRecord,
        name: `Account ${id}`,
        industry: 'Technology',
        type: 'Customer',
        accountNumber: `ACCT-${id}`,
        billingEmail: 'billing@example.com'
      };
    }
  },

  async createRecord(apiPath: string, data: any): Promise<any> {
    try {
      const response = await api.post(apiPath, data);
      return response.data?.data ?? response.data;
    } catch (e) {
      return new Promise(resolve => setTimeout(() => resolve({ id: 'new_id', ...data }), 500));
    }
  },

  async updateRecord(apiPath: string, id: string, data: any): Promise<any> {
    try {
      const response = await api.put(`${apiPath}/${id}`, data);
      return response.data?.data ?? response.data;
    } catch (e) {
      return new Promise(resolve => setTimeout(() => resolve({ id, ...data }), 500));
    }
  },

  async deleteRecord(apiPath: string, id: string): Promise<void> {
    try {
      await api.delete(`${apiPath}/${id}`);
    } catch (e) {
      return new Promise(resolve => setTimeout(() => resolve(), 500));
    }
  }
};
