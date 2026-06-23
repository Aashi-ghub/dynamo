import { describe, expect, it, vi } from 'vitest';
import { entityConfigs } from '../../src/config/entities.js';
import { EntityService } from '../../src/services/entityService.js';

const repository = () => ({
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(async (record) => record),
  update: vi.fn(async (_id, patch) => ({ id: _id, ...patch })),
  hardDelete: vi.fn()
});

describe('EntityService', () => {
  it('adds server-owned metadata when creating records', async () => {
    const repo = repository();
    const service = new EntityService(repo as any, entityConfigs.accounts);

    const created = await service.create({ companyName: 'Acme' }, { sub: 'user-1', groups: [] });

    expect(created.id).toBeTruthy();
    expect(created.createdDate).toBeTruthy();
    expect(created.lastModifiedDate).toBeTruthy();
    expect(created.createdById).toBe('user-1');
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it('throws not found for missing detail records', async () => {
    const repo = repository();
    repo.getById.mockResolvedValue(null);
    const service = new EntityService(repo as any, entityConfigs.accounts);

    await expect(service.get('missing')).rejects.toThrow('Record not found');
  });

  it('hard deletes only after confirming the record exists', async () => {
    const repo = repository();
    repo.getById.mockResolvedValue({ id: 'a1' });
    const service = new EntityService(repo as any, entityConfigs.accounts);

    await expect(service.delete('a1')).resolves.toEqual({ id: 'a1', deleted: true });
    expect(repo.hardDelete).toHaveBeenCalledWith('a1', undefined);
  });

  it('strips composite key fields from subscription updates', async () => {
    const repo = repository();
    const service = new EntityService(repo as any, entityConfigs.subscriptions);

    await service.update('590499', {
      clientNetSuiteAccountId: '590499',
      productCode: 'IC',
      customer: 'Updated Customer',
      status: 'Active'
    }, undefined, 'IC');

    expect(repo.update).toHaveBeenCalledWith(
      '590499',
      expect.not.objectContaining({
        'Client NetSuite Account ID': '590499',
        'Product Code': 'IC'
      }),
      'IC'
    );
    expect(repo.update).toHaveBeenCalledWith(
      '590499',
      expect.objectContaining({
        Customer: 'Updated Customer',
        Status: 'Active'
      }),
      'IC'
    );
  });
});
