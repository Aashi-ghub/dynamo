export interface User {
  id: string;
  name: string;
  email: string;
}

export interface EntityConfig {
  id: string;
  name: string;
  plural: string;
  apiPath: string;
  columns: Array<{
    key: string;
    label: string;
    type?: 'text' | 'date' | 'number' | 'status';
  }>;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'date' | 'select';
    required?: boolean;
    options?: Array<{ label: string; value: string | number }>;
  }>;
}

export interface TableState {
  page: number;
  limit: number;
  search: string;
  sortBy: string | null;
  sortDesc: boolean;
  startDate?: string;
  endDate?: string;
  status?: string;
  companyName?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
