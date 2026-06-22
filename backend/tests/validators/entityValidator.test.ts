import { describe, expect, it } from 'vitest';
import { entityConfigs } from '../../src/config/entities.js';
import { validateCreateBody, validateListQuery, validateUpdateBody } from '../../src/validators/entityValidator.js';

describe('entityValidator', () => {
  it('validates cursor pagination and reusable filters', () => {
    const query = validateListQuery(
      {
        pageSize: '10',
        status: 'Pending',
        companyName: 'United Oil & Gas, Singapore',
        createdDateFrom: '2026-01-01',
        searchField: 'companyName',
        search: 'Acme',
        sortField: 'createdDate',
        sortDirection: 'DESC'
      },
      entityConfigs.accounts
    );

    expect(query.pageSize).toBe(10);
    expect(query.filters).toEqual({ status: 'Pending', companyName: 'United Oil & Gas, Singapore' });
    expect(query.dateRanges.createdDate.from).toBe('2026-01-01');
    expect(query.searchField).toBe('companyName');
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
    const query = validateListQuery({ searchField: 'accountId', search: '0010I00001ecf4L' }, entityConfigs.cloudFiles);

    expect(query.searchField).toBe('accountId');
    expect(query.search).toBe('0010I00001ecf4L');
  });

  it('rejects direct system field updates', () => {
    expect(() => validateUpdateBody({ id: 'abc' }, entityConfigs.accounts)).toThrow('Validation failed');
    expect(() => validateCreateBody({ createdBy: 'client' }, entityConfigs.accounts)).toThrow('Validation failed');
  });
});
