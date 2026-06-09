import type { Request } from 'express';

export type EntityName = 'accounts' | 'contacts' | 'subscriptions' | 'cloudFiles';
export type SortDirection = 'ASC' | 'DESC';

export interface AuthUser {
  sub: string;
  email?: string;
  username?: string;
  groups: string[];
}

export interface RequestContext {
  requestId: string;
  user?: AuthUser;
}

export interface ApiRequest extends Request {
  context: RequestContext;
}

export interface ListQuery {
  pageSize: number;
  nextToken?: string;
  searchField?: string;
  search?: string;
  sortField?: string;
  sortDirection: SortDirection;
  filters: Record<string, string | boolean | number>;
  dateRanges: Record<string, { from?: string; to?: string }>;
}

export interface PageResult<T> {
  items: T[];
  nextToken?: string;
}
