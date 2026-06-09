import { describe, expect, it, vi } from 'vitest';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { entityConfigs } from '../../src/config/entities.js';
import { DynamoEntityRepository } from '../../src/repositories/dynamoEntityRepository.js';

describe('DynamoEntityRepository', () => {
  it('uses DynamoDB Query with pagination and projection for list requests', async () => {
    const send = vi.fn(async (command) => {
      expect(command).toBeInstanceOf(QueryCommand);
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
      expect(command.input.IndexName).toBe('industry-index');
      expect(command.input.KeyConditionExpression).toBe('#searchPk = :search');
      expect(command.input.ExpressionAttributeNames?.['#searchPk']).toBe('industry');
      expect(command.input.ExpressionAttributeValues?.[':search']).toBe('Software');
      return { Items: [] };
    });
    const repo = new DynamoEntityRepository({ send } as any, entityConfigs.accounts);

    await repo.list({
      pageSize: 25,
      searchField: 'industry',
      search: 'Software',
      sortDirection: 'ASC',
      filters: {},
      dateRanges: {}
    });

    expect(send).toHaveBeenCalledOnce();
  });

  it('uses the configured default sort index when no sort field is supplied', async () => {
    const send = vi.fn(async (command: QueryCommand) => {
      expect(command.input.IndexName).toBe('entity-renewalDate-index');
      expect(command.input.ExpressionAttributeNames?.['#sortPk']).toBe('entityType');
      expect(command.input.ExpressionAttributeValues?.[':sortPk']).toBe('SUBSCRIPTION');
      return { Items: [] };
    });
    const repo = new DynamoEntityRepository({ send } as any, entityConfigs.subscriptions);

    await repo.list({
      pageSize: 25,
      sortDirection: 'DESC',
      filters: {},
      dateRanges: {}
    });

    expect(send).toHaveBeenCalledOnce();
  });
});
