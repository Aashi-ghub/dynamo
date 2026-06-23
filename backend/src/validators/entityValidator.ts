import { z } from 'zod';
import { env } from '../config/env.js';
import type { EntityConfig } from '../config/entities.js';
import type { ListQuery } from '../types/api.js';
import { badRequest } from '../utils/errors.js';

const idSchema = z.string().trim().min(1).max(256);
const scalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const bodySchema = z.record(z.union([scalarSchema, z.array(scalarSchema), z.record(scalarSchema)]));

const reservedFields = new Set(['id']);
const systemFields = new Set(['createdBy', 'updatedBy', 'deletedAt', 'deletedBy']);

const issuesFromZod = (error: z.ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join('.') || 'request',
    message: issue.message
  }));

export const validateId = (id: unknown) => {
  const result = idSchema.safeParse(id);
  if (!result.success) {
    throw badRequest('Validation failed', issuesFromZod(result.error));
  }
  return result.data;
};

export const validateSortKey = (sortKey: unknown, config: EntityConfig) => {
  if (!config.sortKeyField) return undefined;
  if (sortKey === undefined || sortKey === null || sortKey === '') {
    throw badRequest('Validation failed', [{ field: 'sortKey', message: 'sortKey is required' }]);
  }
  if (config.sortKeyType === 'boolean') {
    if (sortKey === true || sortKey === 'true' || sortKey === 1 || sortKey === '1') return true;
    if (sortKey === false || sortKey === 'false' || sortKey === 0 || sortKey === '0') return false;
    throw badRequest('Validation failed', [{ field: 'sortKey', message: 'sortKey must be true or false' }]);
  }
  if (config.sortKeyType === 'number') {
    const parsed = Number(sortKey);
    if (!Number.isNaN(parsed)) return parsed;
    throw badRequest('Validation failed', [{ field: 'sortKey', message: 'sortKey must be a number' }]);
  }
  return String(sortKey);
};

export const validateCreateBody = (body: unknown, config: EntityConfig) => {
  const result = bodySchema.safeParse(body);
  if (!result.success) {
    throw badRequest('Validation failed', issuesFromZod(result.error));
  }
  if (Object.keys(result.data).length === 0) {
    throw badRequest('Validation failed', [{ field: 'body', message: 'Request body cannot be empty' }]);
  }
  for (const field of Object.keys(result.data)) {
    if (systemFields.has(field) || config.readonlyFields.includes(field) || !config.editableFields.includes(field)) {
      throw badRequest('Validation failed', [{ field, message: 'Field cannot be provided by clients' }]);
    }
  }
  for (const field of config.requiredFields) {
    const value = result.data[field];
    if (value === undefined || value === null || value === '') {
      throw badRequest('Validation failed', [{ field, message: 'Field is required' }]);
    }
  }
  return result.data;
};

export const validateUpdateBody = (body: unknown, config: EntityConfig) => {
  const record = validateCreateBody(body, { ...config, requiredFields: [] });
  const keyFields = new Set([
    ...Object.entries(config.fieldMap)
      .filter(([, dynamoField]) => dynamoField === config.idField)
      .map(([frontendField]) => frontendField),
    ...(config.sortKeyField ? [config.sortKeyField] : [])
  ]);

  for (const field of Object.keys(record)) {
    if (reservedFields.has(field) || systemFields.has(field) || config.readonlyFields.includes(field) || keyFields.has(field) || !config.editableFields.includes(field)) {
      throw badRequest('Validation failed', [{ field, message: 'Field cannot be updated directly' }]);
    }
  }
  return record;
};

const parseBoolean = (value: string) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export const validateListQuery = (query: Record<string, unknown>, config: EntityConfig): ListQuery => {
  const pageSize = query.pageSize ? Number(query.pageSize) : env.defaultPageSize;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > env.maxPageSize) {
    throw badRequest('Validation failed', [
      { field: 'pageSize', message: `pageSize must be an integer between 1 and ${env.maxPageSize}` }
    ]);
  }

  const sortField = typeof query.sortField === 'string' ? query.sortField : undefined;
  if (sortField && !Object.hasOwn(config.sortableFields, sortField)) {
    throw badRequest('Unsupported sort field', [{ field: 'sortField', message: 'Unsupported sort field' }]);
  }

  const searchField = typeof query.searchField === 'string' ? query.searchField : undefined;
  if (searchField && !Object.hasOwn(config.searchIndexes, searchField)) {
    throw badRequest('Unsupported search field', [{ field: 'searchField', message: 'Unsupported search field' }]);
  }

  const rawDirection = typeof query.sortDirection === 'string' ? query.sortDirection.toUpperCase() : 'ASC';
  if (rawDirection !== 'ASC' && rawDirection !== 'DESC') {
    throw badRequest('Validation failed', [{ field: 'sortDirection', message: 'Use ASC or DESC' }]);
  }

  const filters: ListQuery['filters'] = {};
  const dateRanges: ListQuery['dateRanges'] = {};
  for (const [key, value] of Object.entries(query)) {
    if (['pageSize', 'nextToken', 'search', 'searchField', 'sortField', 'sortDirection'].includes(key)) continue;
    if (key.endsWith('From') || key.endsWith('To')) {
      const field = key.replace(/(From|To)$/, '');
      if (!config.filterableFields.includes(field)) continue;
      dateRanges[field] = dateRanges[field] || {};
      if (typeof value === 'string') {
        if (key.endsWith('From')) dateRanges[field].from = value;
        if (key.endsWith('To')) dateRanges[field].to = value;
      }
      continue;
    }
    if (config.filterableFields.includes(key) && typeof value === 'string') {
      filters[key] = parseBoolean(value);
    }
  }

  return {
    pageSize,
    nextToken: typeof query.nextToken === 'string' ? query.nextToken : undefined,
    searchField,
    search: typeof query.search === 'string' && query.search.trim() ? query.search.trim() : undefined,
    sortField,
    sortDirection: rawDirection,
    filters,
    dateRanges
  };
};
