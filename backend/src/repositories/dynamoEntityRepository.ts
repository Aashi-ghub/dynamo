import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  TransactWriteCommand,
  UpdateCommand,
  type DynamoDBDocumentClient
} from '@aws-sdk/lib-dynamodb';
import type { EntityConfig } from '../config/entities.js';
import type { BusinessRecord } from '../models/businessRecord.js';
import type { ListQuery, PageResult } from '../types/api.js';
import { stripBom } from '../utils/bom.js';
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
    const [page, total] = await Promise.all([
      query.search && searchField ? this.listWithCaseInsensitiveSearch(query, searchField) : this.listWithFilter(query),
      this.count(query, searchField)
    ]);
    return { ...page, total };
  }

  private async listWithFilter(query: ListQuery): Promise<Omit<PageResult<BusinessRecord>, 'total'>> {
    const items: BusinessRecord[] = [];
    let exclusiveStartKey = decodeNextToken(query.nextToken);

    // Collect pageSize+1 items — if we get the extra one, a next page exists
    const wantCount = query.pageSize + 1;
    const batchSize = Math.min(Math.max(wantCount * 10, 100), 500);
    const baseInput = this.buildListCommand({ ...query, nextToken: undefined }).input;

    for (let round = 0; items.length < wantCount && round < 50; round++) {
      const result = await this.client.send(new ScanCommand({
        ...baseInput,
        Limit: batchSize,
        ExclusiveStartKey: exclusiveStartKey
      }));

      const batch = (result.Items as BusinessRecord[]) || [];
      const lastEvaluatedKey = result.LastEvaluatedKey;

      for (const item of batch) {
        if (items.length < wantCount) {
          items.push(item);
        } else {
          break;
        }
      }

      if (!lastEvaluatedKey) break;
      if (items.length >= wantCount) break;
      exclusiveStartKey = lastEvaluatedKey;
    }

    const hasMore = items.length > query.pageSize;
    return {
      items: items.slice(0, query.pageSize),
      nextToken: hasMore ? encodeNextToken(this.extractKey(items[query.pageSize - 1])) : undefined
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

  /** Moves a record to a new partition key value via an atomic delete+recreate transaction (DynamoDB can't update key attributes in place). */
  async moveItem(oldId: string, record: BusinessRecord, sortKey?: string | boolean | number) {
    const names = { '#pk': this.config.idField };

    await this.client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.config.tableName,
              Item: record,
              ConditionExpression: 'attribute_not_exists(#pk)',
              ExpressionAttributeNames: names
            }
          },
          {
            Delete: {
              TableName: this.config.tableName,
              Key: this.buildKey(oldId, sortKey),
              ConditionExpression: 'attribute_exists(#pk)',
              ExpressionAttributeNames: names
            }
          }
        ]
      })
    ).catch((error) => {
      if (error.name === 'TransactionCanceledException') {
        throw conflict('A record with this ID already exists, or the original record was not found');
      }
      throw error;
    });

    return record;
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

  private buildFilterExpression(query: ListQuery) {
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
      if (this.config.periodFilter && field === this.config.periodFilter.field) {
        const { startField, endField } = this.config.periodFilter;
        const startRaw = this.toDynamoField(startField);
        const endRaw = this.toDynamoField(endField);
        const startToken = this.token(`period_start`);
        const endToken = this.token(`period_end`);
        // The range's "from" bound filters periodFilter.startField (>=),
        // and the "to" bound filters periodFilter.endField (<=), each
        // independently against its own field. A blank/missing value on
        // the field being checked means it can't satisfy the bound.
        if (range.from) {
          names[`#${startToken}`] = startRaw;
          values[`:${startToken}_empty`] = '';
          values[`:${startToken}_from`] = this.normalizeRangeValue(startField, range.from);
          filterParts.push(`(attribute_exists(#${startToken}) AND #${startToken} <> :${startToken}_empty AND #${startToken} >= :${startToken}_from)`);
        }
        if (range.to) {
          names[`#${endToken}`] = endRaw;
          values[`:${endToken}_empty`] = '';
          values[`:${endToken}_to`] = this.normalizeRangeValue(endField, range.to, true);
          filterParts.push(`(attribute_exists(#${endToken}) AND #${endToken} <> :${endToken}_empty AND #${endToken} <= :${endToken}_to)`);
        }
        continue;
      }
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

    if (this.config.softDeleteField && this.config.softDeleteValue !== undefined) {
      const rawField = this.toDynamoField(this.config.softDeleteField);
      const token = this.token(`softdelete_${this.config.softDeleteField}`);
      names[`#${token}`] = rawField;
      values[`:${token}`] = this.config.softDeleteValue;
      filterParts.push(`(attribute_not_exists(#${token}) OR #${token} <> :${token})`);
    }

    return { names, values, filterParts };
  }

  private buildListCommand(query: ListQuery) {
    const { names, values, filterParts } = this.buildFilterExpression(query);

    // Project both the canonical raw field name and its BOM-stripped alias, since some
    // legacy/externally-written records store attribute names without the leading
    // byte-order-mark this app's fieldMap expects — DynamoDB's ProjectionExpression only
    // returns exact attribute-name matches, so without the alias those fields would be
    // silently dropped before ever reaching the raw-to-frontend mapping.
    const projectedFieldSet = new Set<string>();
    for (const field of this.config.listAttributes) {
      const rawField = this.toDynamoField(field);
      projectedFieldSet.add(rawField);
      const stripped = stripBom(rawField);
      if (stripped !== rawField) projectedFieldSet.add(stripped);
    }
    const projectedRawFields = [...projectedFieldSet];
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

  private async countWithFilter(query: ListQuery): Promise<number> {
    const { names, values, filterParts } = this.buildFilterExpression(query);
    const input = {
      TableName: this.config.tableName,
      FilterExpression: filterParts.length ? filterParts.join(' AND ') : undefined,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: Object.keys(values).length ? values : undefined,
      Select: 'COUNT' as const
    };

    let total = 0;
    let exclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const result = await this.client.send(new ScanCommand({ ...input, ExclusiveStartKey: exclusiveStartKey }));
      total += result.Count || 0;
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);
    return total;
  }

  private async countWithCaseInsensitiveSearch(query: ListQuery, searchField: string): Promise<number> {
    const needle = query.search!.toLowerCase();
    const { names, values, filterParts } = this.buildFilterExpression({ ...query, search: undefined });
    const input = {
      TableName: this.config.tableName,
      FilterExpression: filterParts.length ? filterParts.join(' AND ') : undefined,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: Object.keys(values).length ? values : undefined,
      Limit: 500
    };

    let total = 0;
    let exclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const result = await this.client.send(new ScanCommand({ ...input, ExclusiveStartKey: exclusiveStartKey }));
      const batch = (result.Items as BusinessRecord[]) || [];
      for (const item of batch) {
        if (this.matchesCaseInsensitiveSearch(item, searchField, needle)) total++;
      }
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);
    return total;
  }

  private async count(query: ListQuery, searchField?: string): Promise<number> {
    if (query.search && searchField) return this.countWithCaseInsensitiveSearch(query, searchField);
    return this.countWithFilter(query);
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

  private extractKey(item: BusinessRecord): Record<string, unknown> {
    const key: Record<string, unknown> = { [this.config.idField]: item[this.config.idField] };
    if (this.config.sortKeyField) {
      const rawField = this.toDynamoField(this.config.sortKeyField);
      key[rawField] = item[rawField];
    }
    return key;
  }

  private async listWithCaseInsensitiveSearch(query: ListQuery, searchField: string) {
    const needle = query.search!.toLowerCase();
    const items: BusinessRecord[] = [];
    let exclusiveStartKey = decodeNextToken(query.nextToken);

    const wantCount = query.pageSize + 1;
    const scanBatchSize = Math.min(Math.max(wantCount * 10, 50), 500);
    const maxRounds = 50;

    for (let round = 0; items.length < wantCount && round < maxRounds; round++) {
      const input = this.buildListCommand({ ...query, search: undefined, nextToken: undefined }).input;
      input.Limit = scanBatchSize;
      input.ExclusiveStartKey = exclusiveStartKey;

      const result = await this.client.send(new ScanCommand(input));
      const batch = (result.Items as BusinessRecord[]) || [];
      const lastEvaluatedKey = result.LastEvaluatedKey;

      for (const item of batch) {
        if (!this.matchesCaseInsensitiveSearch(item, searchField, needle)) continue;
        if (items.length < wantCount) {
          items.push(item);
        } else {
          break;
        }
      }

      if (!lastEvaluatedKey) break;
      if (items.length >= wantCount) break;
      exclusiveStartKey = lastEvaluatedKey;
    }

    const hasMore = items.length > query.pageSize;
    return {
      items: items.slice(0, query.pageSize),
      nextToken: hasMore ? encodeNextToken(this.extractKey(items[query.pageSize - 1])) : undefined
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
    // String date fields stored as 'YYYY-MM-DD HH:mm' — endDate must cover the full day
    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${value} 23:59`;
    }
    return value;
  }
}
