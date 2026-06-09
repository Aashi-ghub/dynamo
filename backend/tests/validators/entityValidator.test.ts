import { describe, expect, it } from 'vitest';
import { entityConfigs } from '../../src/config/entities.js';
import { validateCreateBody, validateListQuery, validateUpdateBody } from '../../src/validators/entityValidator.js';

describe('entityValidator', () => {
  it('validates cursor pagination and reusable filters', () => {
    const query = validateListQuery(
      {
        pageSize: '10',
        status: 'Active',
        active: 'true',
        createdAtFrom: '2026-01-01',
        searchField: 'name',
        search: 'Acme',
        sortField: 'createdAt',
        sortDirection: 'DESC'
      },
      entityConfigs.accounts
    );

    expect(query.pageSize).toBe(10);
    expect(query.filters).toEqual({ status: 'Active', active: true });
    expect(query.dateRanges.createdAt.from).toBe('2026-01-01');
    expect(query.searchField).toBe('name');
    expect(query.search).toBe('Acme');
    expect(query.sortDirection).toBe('DESC');
  });

  it('rejects unsupported sort fields', () => {
    expect(() => validateListQuery({ sortField: 'status' }, entityConfigs.accounts)).toThrow('Unsupported sort field');
  });

  it('rejects unsupported search fields', () => {
    expect(() => validateListQuery({ searchField: 'lastName', search: 'Smith' }, entityConfigs.accounts)).toThrow(
      'Unsupported search field'
    );
  });

  it('allows only fields backed by configured search indexes', () => {
    const query = validateListQuery({ searchField: 'uploadedBy', search: 'Aashi' }, entityConfigs.cloudFiles);

    expect(query.searchField).toBe('uploadedBy');
    expect(query.search).toBe('Aashi');
  });

  it('rejects direct system field updates', () => {
    expect(() => validateUpdateBody({ id: 'abc' })).toThrow('Validation failed');
    expect(() => validateCreateBody({ createdBy: 'client' })).toThrow('Validation failed');
  });
});
