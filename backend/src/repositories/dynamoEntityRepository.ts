import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  type DynamoDBDocumentClient
} from '@aws-sdk/lib-dynamodb';
import type { EntityConfig } from '../config/entities.js';
import type { BusinessRecord } from '../models/businessRecord.js';
import type { ListQuery, PageResult } from '../types/api.js';
import { conflict } from '../utils/errors.js';
import { decodeNextToken, encodeNextToken } from '../utils/pagination.js';

export class DynamoEntityRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: EntityConfig
  ) {}

  async getById(id: string) {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { [this.config.idField]: id }
      })
    );
    return (result.Item as BusinessRecord | undefined) || null;
  }

  async list(query: ListQuery): Promise<PageResult<BusinessRecord>> {
    // Scans are intentionally prohibited due to DynamoDB cost considerations.
    const commandInput = this.buildQuery(query);
    const result = await this.client.send(new QueryCommand(commandInput));
    return {
      items: (result.Items as BusinessRecord[]) || [],
      nextToken: encodeNextToken(result.LastEvaluatedKey)
    };
  }

  async create(record: BusinessRecord) {
    await this.client.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: record,
        ConditionExpression: 'attribute_not_exists(#id)',
        ExpressionAttributeNames: { '#id': this.config.idField }
      })
    ).catch((error) => {
      if (error.name === 'ConditionalCheckFailedException') {
        throw conflict('Record already exists');
      }
      throw error;
    });
    return record;
  }

  async update(id: string, patch: Record<string, unknown>) {
    const names: Record<string, string> = { '#id': this.config.idField };
    const values: Record<string, unknown> = {};
    const updates: string[] = [];

    for (const [field, value] of Object.entries(patch)) {
      const nameKey = `#${field}`;
      const valueKey = `:${field}`;
      names[nameKey] = field;
      values[valueKey] = value;
      updates.push(`${nameKey} = ${valueKey}`);
    }

    names['#updatedAt'] = 'updatedAt';
    values[':updatedAt'] = new Date().toISOString();
    updates.push('#updatedAt = :updatedAt');

    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: { [this.config.idField]: id },
        UpdateExpression: `SET ${updates.join(', ')}`,
        ConditionExpression: 'attribute_exists(#id)',
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW'
      })
    ).catch((error) => {
      if (error.name === 'ConditionalCheckFailedException') {
        return { Attributes: undefined };
      }
      throw error;
    });

    return (result.Attributes as BusinessRecord | undefined) || null;
  }

  async hardDelete(id: string) {
    await this.client.send(
      new DeleteCommand({
        TableName: this.config.tableName,
        Key: { [this.config.idField]: id },
        ConditionExpression: 'attribute_exists(#id)',
        ExpressionAttributeNames: { '#id': this.config.idField }
      })
    ).catch((error) => {
      if (error.name === 'ConditionalCheckFailedException') return;
      throw error;
    });
  }

  private buildQuery(query: ListQuery) {
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};
    const filterParts: string[] = [];
    let indexName: string | undefined;
    let keyExpression = '#id = :id';
    names['#id'] = this.config.idField;
    values[':id'] = query.filters[this.config.idField] || query.search || '__all__';

    const searchIndex = this.resolveSearchIndex(query.searchField, query.search);
    const sortField = query.sortField || this.config.defaultSortField;
    const sortIndex = this.config.sortIndexes[sortField];

    if (searchIndex && query.search) {
      indexName = searchIndex.indexName;
      names['#searchPk'] = searchIndex.partitionKey;
      values[':search'] = query.search;
      keyExpression = '#searchPk = :search';
    } else if (query.filters[this.config.idField]) {
      keyExpression = '#id = :id';
    } else if (sortIndex) {
      indexName = sortIndex.indexName;
      names['#sortPk'] = sortIndex.partitionKey;
      values[':sortPk'] = sortIndex.partitionValue;
      keyExpression = '#sortPk = :sortPk';
      for (const [field, range] of Object.entries(query.dateRanges)) {
        if (field !== sortIndex.sortKey) continue;
        names['#sortKey'] = sortIndex.sortKey;
        if (range.from && range.to) {
          values[':from'] = range.from;
          values[':to'] = range.to;
          keyExpression += ' AND #sortKey BETWEEN :from AND :to';
        } else if (range.from) {
          values[':from'] = range.from;
          keyExpression += ' AND #sortKey >= :from';
        } else if (range.to) {
          values[':to'] = range.to;
          keyExpression += ' AND #sortKey <= :to';
        }
      }
    }

    for (const [field, value] of Object.entries(query.filters)) {
      if (field === this.config.idField) continue;
      names[`#filter_${field}`] = field;
      values[`:filter_${field}`] = value;
      filterParts.push(`#filter_${field} = :filter_${field}`);
    }

    for (const [field, range] of Object.entries(query.dateRanges)) {
      if (sortIndex?.sortKey === field) continue;
      names[`#range_${field}`] = field;
      if (range.from) {
        values[`:range_${field}_from`] = range.from;
        filterParts.push(`#range_${field} >= :range_${field}_from`);
      }
      if (range.to) {
        values[`:range_${field}_to`] = range.to;
        filterParts.push(`#range_${field} <= :range_${field}_to`);
      }
    }

    for (const field of this.config.listAttributes) {
      names[`#proj_${field}`] = field;
    }

    return {
      TableName: this.config.tableName,
      IndexName: indexName,
      KeyConditionExpression: keyExpression,
      FilterExpression: filterParts.length ? filterParts.join(' AND ') : undefined,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      Limit: query.pageSize,
      ExclusiveStartKey: decodeNextToken(query.nextToken),
      ScanIndexForward: query.sortDirection === 'ASC',
      ProjectionExpression: this.config.listAttributes.map((field) => `#proj_${field}`).join(', ')
    };
  }

  private resolveSearchIndex(searchField?: string, search?: string) {
    if (!search) return undefined;
    const field = searchField || Object.keys(this.config.searchableFields)[0];
    return this.config.searchIndexes[field];
  }
}
