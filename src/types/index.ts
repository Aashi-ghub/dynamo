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
  titleField: string;
  partitionKeyField: string;
  sortKeyField?: string;
  columns: Array<{
    key: string;
    label: string;
    type?: 'text' | 'date' | 'number' | 'status';
  }>;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';
    required?: boolean;
    options?: Array<{ label: string; value: string | number }>;
  }>;
  detailGroups: Array<{
    label: string;
    fields: string[];
  }>;
  readonlyFields: string[];
  searchableFields: Array<{
    key: string;
    label: string;
  }>;
  filters: {
    status?: string;
    company?: string;
    date?: string;
  };
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
  searchField?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  nextToken?: string;
  hasMore: boolean;
}
