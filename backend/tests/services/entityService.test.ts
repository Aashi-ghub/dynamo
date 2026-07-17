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
    repo.getById.mockResolvedValue({
      'Client NetSuite Account ID': '590499',
      'Product Code': 'IC',
      Customer: 'Old Customer',
      Status: 'Pending'
    });
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

  it('appends a subscription history entry when the new start date is after the old end date (renewal)', async () => {
    const repo = repository();
    repo.getById.mockResolvedValue({
      'Client NetSuite Account ID': '590499',
      'Product Code': 'IC',
      'Subscription Start Date': '2025-01-01',
      'Subscription End Date': '2025-12-31',
      Price: 1000,
      'Next Bill Date': '2025-12-31',
      Transaction: 'TXN-1',
      Remarks: 'Renewed annually'
    });
    const service = new EntityService(repo as any, entityConfigs.subscriptions);

    await service.update('590499', {
      subscriptionStartDate: '2026-01-01',
      subscriptionEndDate: '2026-12-31'
    }, undefined, 'IC');

    expect(repo.update).toHaveBeenCalledWith(
      '590499',
      expect.objectContaining({
        'Subscription History': [
          {
            subscriptionStartDate: '2025-01-01',
            subscriptionEndDate: '2025-12-31',
            price: 1000,
            nextBillDate: '2025-12-31',
            transaction: 'TXN-1',
            remarks: 'Renewed annually'
          }
        ]
      }),
      'IC'
    );
  });

  it('does not append a history entry when the start date is unchanged', async () => {
    const repo = repository();
    repo.getById.mockResolvedValue({
      'Client NetSuite Account ID': '590499',
      'Product Code': 'IC',
      'Subscription Start Date': '2025-01-01',
      'Subscription End Date': '2025-12-31'
    });
    const service = new EntityService(repo as any, entityConfigs.subscriptions);

    await service.update('590499', {
      subscriptionStartDate: '2025-01-01',
      customer: 'Renamed'
    }, undefined, 'IC');

    expect(repo.update).toHaveBeenCalledWith(
      '590499',
      expect.not.objectContaining({ 'Subscription History': expect.anything() }),
      'IC'
    );
  });

  it('does not append a history entry when the new start date is not after the old end date (correction, not a renewal)', async () => {
    const repo = repository();
    repo.getById.mockResolvedValue({
      'Client NetSuite Account ID': '590499',
      'Product Code': 'IC',
      'Subscription Start Date': '2025-01-01',
      'Subscription End Date': '2025-12-31'
    });
    const service = new EntityService(repo as any, entityConfigs.subscriptions);

    await service.update('590499', {
      subscriptionStartDate: '2025-02-01',
      subscriptionEndDate: '2025-12-31'
    }, undefined, 'IC');

    expect(repo.update).toHaveBeenCalledWith(
      '590499',
      expect.not.objectContaining({ 'Subscription History': expect.anything() }),
      'IC'
    );
  });

  it('does not append a duplicate history entry on a later save that only changes the end date', async () => {
    const repo = repository();
    // State right after a renewal save that only updated the start date — the end date
    // (2028-09-09) hasn't caught up yet, so it's still before the already-moved start date.
    repo.getById.mockResolvedValue({
      'Client NetSuite Account ID': '590499',
      'Product Code': 'IC',
      'Subscription Start Date': '2028-09-10',
      'Subscription End Date': '2028-09-09',
      'Subscription History': [
        {
          subscriptionStartDate: '2028-08-08',
          subscriptionEndDate: '2028-09-09',
          price: 1000,
          nextBillDate: '2028-09-09',
          transaction: 'TXN-1',
          remarks: ''
        }
      ]
    });
    const service = new EntityService(repo as any, entityConfigs.subscriptions);

    await service.update('590499', {
      subscriptionStartDate: '2028-09-10',
      subscriptionEndDate: '2028-10-09'
    }, undefined, 'IC');

    expect(repo.update).toHaveBeenCalledWith(
      '590499',
      expect.not.objectContaining({ 'Subscription History': expect.anything() }),
      'IC'
    );
  });
});
