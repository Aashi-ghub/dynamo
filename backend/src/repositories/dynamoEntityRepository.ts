import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
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

  async getById(id: string, sortKey?: string | boolean | number) {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: this.buildKey(id, sortKey)
      })
    );
    return (result.Item as BusinessRecord | undefined) || null;
  }

  async list(query: ListQuery): Promise<PageResult<BusinessRecord>> {
    const searchField = this.resolveSearchField(query);
    if (query.search && searchField) {
      return this.listWithCaseInsensitiveSearch(query, searchField);
    }

    const input = this.buildListCommand(query).input;
    const result = await this.client.send(new ScanCommand(input));
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

  async update(id: string, patch: Record<string, unknown>, sortKey?: string | boolean | number) {
    const names: Record<string, string> = { '#pk': this.config.idField };
    const values: Record<string, unknown> = {};
    const updates: string[] = [];
    const key = this.buildKey(id, sortKey);

    if (this.config.sortKeyField) {
      const sortKeyRaw = this.toDynamoField(this.config.sortKeyField);
      names['#sk'] = sortKeyRaw;
    }

    for (const [field, value] of Object.entries(patch)) {
      const token = this.token(field);
      const nameKey = `#${token}`;
      const valueKey = `:${token}`;
      names[nameKey] = field;
      values[valueKey] = value;
      updates.push(`${nameKey} = ${valueKey}`);
    }

    const keyExists = this.config.sortKeyField
      ? 'attribute_exists(#pk) AND attribute_exists(#sk)'
      : 'attribute_exists(#pk)';

    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: key,
        UpdateExpression: `SET ${updates.join(', ')}`,
        ConditionExpression: keyExists,
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

  async hardDelete(id: string, sortKey?: string | boolean | number) {
    const names: Record<string, string> = { '#pk': this.config.idField };
    const keyExists = this.config.sortKeyField
      ? 'attribute_exists(#pk) AND attribute_exists(#sk)'
      : 'attribute_exists(#pk)';

    if (this.config.sortKeyField) {
      names['#sk'] = this.toDynamoField(this.config.sortKeyField);
    }

    await this.client.send(
      new DeleteCommand({
        TableName: this.config.tableName,
        Key: this.buildKey(id, sortKey),
        ConditionExpression: keyExists,
        ExpressionAttributeNames: names
      })
    ).catch((error) => {
      if (error.name === 'ConditionalCheckFailedException') return;
      throw error;
    });
  }

  private buildKey(id: string, sortKey?: string | boolean | number) {
    const key: Record<string, unknown> = { [this.config.idField]: id };
    if (this.config.sortKeyField) {
      key[this.toDynamoField(this.config.sortKeyField)] = sortKey;
    }
    return key;
  }

  private buildListCommand(query: ListQuery) {
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};
    const filterParts: string[] = [];

    for (const [field, value] of Object.entries(query.filters)) {
      const rawField = this.toDynamoField(field);
      const token = this.token(`filter_${field}`);
      names[`#${token}`] = rawField;
      values[`:${token}`] = value;
      filterParts.push(`#${token} = :${token}`);
    }

    for (const [field, range] of Object.entries(query.dateRanges)) {
      const rawField = this.toDynamoField(field);
      const token = this.token(`range_${field}`);
      names[`#${token}`] = rawField;
      if (range.from) {
        values[`:${token}_from`] = this.normalizeRangeValue(field, range.from);
        filterParts.push(`#${token} >= :${token}_from`);
      }
      if (range.to) {
        values[`:${token}_to`] = this.normalizeRangeValue(field, range.to, true);
        filterParts.push(`#${token} <= :${token}_to`);
      }
    }

    const projectedRawFields = this.config.listAttributes.map((field) => this.toDynamoField(field));
    projectedRawFields.forEach((field, index) => {
      names[`#proj_${index}`] = field;
    });

    const input = {
      TableName: this.config.tableName,
      FilterExpression: filterParts.length ? filterParts.join(' AND ') : undefined,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: Object.keys(values).length ? values : undefined,
      Limit: query.pageSize,
      ExclusiveStartKey: decodeNextToken(query.nextToken),
      ProjectionExpression: projectedRawFields.map((_field, index) => `#proj_${index}`).join(', ')
    };
    return { input };
  }

  private resolveSearchField(query: ListQuery) {
    if (!query.search) return undefined;
    const field = query.searchField || Object.keys(this.config.searchIndexes)[0];
    if (field && Object.hasOwn(this.config.searchIndexes, field)) return field;
    return undefined;
  }

  private matchesCaseInsensitiveSearch(item: BusinessRecord, searchField: string, needle: string) {
    const rawField = this.toDynamoField(searchField);
    const value = item[rawField];
    if (value === null || value === undefined) return false;
    return String(value).toLowerCase().includes(needle);
  }

  private decodeSearchCursor(token?: string) {
    if (!token) return { pendingMatches: [] as BusinessRecord[] };
    const decoded = decodeNextToken(token);
    if ('pendingMatches' in decoded || 'exclusiveStartKey' in decoded) {
      return {
        exclusiveStartKey: decoded.exclusiveStartKey as Record<string, unknown> | undefined,
        pendingMatches: (decoded.pendingMatches as BusinessRecord[]) || []
      };
    }
    return { exclusiveStartKey: decoded, pendingMatches: [] as BusinessRecord[] };
  }

  private encodeSearchCursor(cursor: {
    exclusiveStartKey?: Record<string, unknown>;
    pendingMatches: BusinessRecord[];
  }) {
    const payload: Record<string, unknown> = {};
    if (cursor.exclusiveStartKey && Object.keys(cursor.exclusiveStartKey).length > 0) {
      payload.exclusiveStartKey = cursor.exclusiveStartKey;
    }
    if (cursor.pendingMatches.length > 0) {
      payload.pendingMatches = cursor.pendingMatches;
    }
    if (Object.keys(payload).length === 0) return undefined;
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  }

  private async listWithCaseInsensitiveSearch(query: ListQuery, searchField: string) {
    const needle = query.search!.toLowerCase();
    const cursor = this.decodeSearchCursor(query.nextToken);
    const items: BusinessRecord[] = [];
    const pending = [...cursor.pendingMatches];
    let exclusiveStartKey = cursor.exclusiveStartKey;

    while (items.length < query.pageSize && pending.length > 0) {
      items.push(pending.shift()!);
    }

    const scanBatchSize = Math.min(Math.max(query.pageSize * 10, 50), 500);
    const maxRounds = 50;

    for (let round = 0; items.length < query.pageSize && round < maxRounds; round++) {
      const input = this.buildListCommand({ ...query, search: undefined, nextToken: undefined }).input;
      input.Limit = scanBatchSize;
      input.ExclusiveStartKey = exclusiveStartKey;

      const result = await this.client.send(new ScanCommand(input));
      const batch = (result.Items as BusinessRecord[]) || [];
      exclusiveStartKey = result.LastEvaluatedKey;

      for (const item of batch) {
        if (!this.matchesCaseInsensitiveSearch(item, searchField, needle)) continue;
        if (items.length < query.pageSize) {
          items.push(item);
        } else {
          pending.push(item);
        }
      }

      if (!exclusiveStartKey) break;
      if (items.length >= query.pageSize) break;
    }

    const hasMore = pending.length > 0 || Boolean(exclusiveStartKey);
    return {
      items,
      nextToken: hasMore ? this.encodeSearchCursor({ exclusiveStartKey, pendingMatches: pending }) : undefined
    };
  }

  private toDynamoField(frontendField: string) {
    return this.config.fieldMap[frontendField] || frontendField;
  }

  private token(field: string) {
    return field.replace(/[^A-Za-z0-9_]/g, '_');
  }

  private normalizeRangeValue(field: string, value: string, endOfDay = false) {
    const rawField = this.toDynamoField(field);
    const numericDateFields = new Set([
      'createddate',
      'lastmodifieddate',
      'systemmodstamp',
      'birthdate',
      'slaexpirationdate__c'
    ]);
    if (numericDateFields.has(rawField)) {
      const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
      if (!Number.isNaN(date.getTime())) return date.getTime();
    }
    return value;
  }
}
