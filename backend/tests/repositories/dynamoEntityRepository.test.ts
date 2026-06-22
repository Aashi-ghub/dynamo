import { describe, expect, it, vi } from 'vitest';
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { entityConfigs } from '../../src/config/entities.js';
import { DynamoEntityRepository } from '../../src/repositories/dynamoEntityRepository.js';

describe('DynamoEntityRepository', () => {
  it('uses DynamoDB Scan with pagination and projection for list requests', async () => {
    const send = vi.fn(async (command) => {
      expect(command).toBeInstanceOf(ScanCommand);
      return {
        Items: [{ id: 'a1', name: 'Acme' }],
        LastEvaluatedKey: { id: 'a1' }
      };
    });
    const repo = new DynamoEntityRepository({ send } as any, entityConfigs.accounts);

    const result = await repo.list({
      pageSize: 5,
      sortDirection: 'ASC',
      filters: {},
      dateRanges: {}
    });

    expect(result.items).toEqual([{ id: 'a1', name: 'Acme' }]);
    expect(result.nextToken).toBeTruthy();
    expect(send).toHaveBeenCalledOnce();
  });

  it('uses the configured GSI for the requested search field', async () => {
    const send = vi.fn(async (command: QueryCommand) => {
      expect(command.input.IndexName).toBe('name-index');
      expect(command.input.KeyConditionExpression).toBe('#searchPk = :search');
      expect(command.input.ExpressionAttributeNames?.['#searchPk']).toBe('name');
      expect(command.input.ExpressionAttributeValues?.[':search']).toBe('United Oil & Gas, Singapore');
      return { Items: [] };
    });
    const repo = new DynamoEntityRepository({ send } as any, entityConfigs.accounts);

    await repo.list({
      pageSize: 25,
      searchField: 'companyName',
      search: 'United Oil & Gas, Singapore',
      sortDirection: 'ASC',
      filters: {},
      dateRanges: {}
    });

    expect(send).toHaveBeenCalledOnce();
  });

  it('uses raw DynamoDB field names for filters', async () => {
    const send = vi.fn(async (command: ScanCommand) => {
      expect(command.input.FilterExpression).toBe('#filter_status = :filter_status');
      expect(command.input.ExpressionAttributeNames?.['#filter_status']).toBe('Status');
      expect(command.input.ExpressionAttributeValues?.[':filter_status']).toBe('Billing');
      return { Items: [] };
    });
    const repo = new DynamoEntityRepository({ send } as any, entityConfigs.subscriptions);

    await repo.list({
      pageSize: 25,
      sortDirection: 'DESC',
      filters: { status: 'Billing' },
      dateRanges: {}
    });

    expect(send).toHaveBeenCalledOnce();
  });
});
