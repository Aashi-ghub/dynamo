import type { PaginatedResponse, TableState } from '../types';

export const entityService = {
  async fetchRecords(_apiPath: string, state: TableState): Promise<PaginatedResponse<any>> {
    // Mocking for architectural purposes. Replace with `api.get` in production.
    /*
    const response = await api.get(apiPath, {
      params: {
        page: state.page,
        limit: state.limit,
        search: state.search,
        sortBy: state.sortBy,
        sortDesc: state.sortDesc
      }
    });
    return response.data;
    */
    
    return new Promise((resolve) => {
      setTimeout(() => {
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
          lastName: `Last${i}`
        }));
        
        resolve({
          data: mockData,
          total: 100 // mock total
        });
      }, 600);
    });
  },

  async createRecord(_apiPath: string, data: any): Promise<any> {
    // return (await api.post(apiPath, data)).data;
    return new Promise(resolve => setTimeout(() => resolve({ id: 'new_id', ...data }), 500));
  },

  async updateRecord(_apiPath: string, id: string, data: any): Promise<any> {
    // return (await api.put(`${apiPath}/${id}`, data)).data;
    return new Promise(resolve => setTimeout(() => resolve({ id, ...data }), 500));
  },

  async deleteRecord(_apiPath: string, _id: string): Promise<void> {
    // await api.delete(`${apiPath}/${id}`);
    return new Promise(resolve => setTimeout(() => resolve(), 500));
  }
};
