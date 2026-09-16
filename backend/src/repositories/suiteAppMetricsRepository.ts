import { GetCommand, ScanCommand, type DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from '../config/env.js';
import type { PageResult } from '../types/api.js';
import { decodeNextToken, encodeNextToken } from '../utils/pagination.js';

export interface SuiteAppMetricsRecord {
  AccountID_ProductCode: string;
  Date: string;
  Metrics: Record<string, unknown>;
  UpdatedAt?: string;
}

export interface SuiteAppMetricsQuery {
  pageSize: number;
  nextToken?: string;
  accountId?: string;
  productCode?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const splitAccountProductKey = (key: string) => {
  const idx = key.lastIndexOf('_');
  if (idx === -1) return { accountId: key, productCode: '' };
  return { accountId: key.slice(0, idx), productCode: key.slice(idx + 1) };
};

export class SuiteAppMetricsRepository {
  constructor(private readonly client: DynamoDBDocumentClient) {}

  async getByKey(accountIdProductCode: string, date: string) {
    const result = await this.client.send(
      new GetCommand({
        TableName: env.tables.suiteAppMetrics,
        Key: { AccountID_ProductCode: accountIdProductCode, Date: date }
      })
    );
    return (result.Item as SuiteAppMetricsRecord | undefined) || null;
  }

  async list(query: SuiteAppMetricsQuery): Promise<PageResult<SuiteAppMetricsRecord>> {
    const rows = await this.scanAll(query.dateFrom, query.dateTo);

    const matches = rows.filter((row) => {
      const { accountId, productCode } = splitAccountProductKey(row.AccountID_ProductCode);
      if (query.accountId && !accountId.toLowerCase().includes(query.accountId.toLowerCase())) return false;
      if (query.productCode && productCode !== query.productCode) return false;
      return true;
    });

    matches.sort((a, b) => (a.Date < b.Date ? 1 : a.Date > b.Date ? -1 : 0));

    const offset = (decodeNextToken(query.nextToken) as { offset?: number } | undefined)?.offset ?? 0;
    const page = matches.slice(offset, offset + query.pageSize);
    const nextOffset = offset + page.length;
    const nextToken = nextOffset < matches.length ? encodeNextToken({ offset: nextOffset }) : undefined;

    return { items: page, total: matches.length, nextToken };
  }

  /**
   * SuiteAppMetrics has no GSIs, so every read is a Scan. The table is a small,
   * slow-growing daily-snapshot log (a handful of rows today), not a high-volume
   * entity table like Subscriptions — so unlike dynamoEntityRepository, this reads
   * the whole (date-filtered) table into memory rather than incrementally scanning
   * batches until a page's worth of matches is found. That keeps sorting/paginating
   * by Date correct without the batch-boundary inconsistency that approach would add.
   */
  private async scanAll(dateFrom?: string, dateTo?: string): Promise<SuiteAppMetricsRecord[]> {
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};
    const filterParts: string[] = [];
    if (dateFrom) {
      names['#date'] = 'Date';
      values[':dateFrom'] = dateFrom;
      filterParts.push('#date >= :dateFrom');
    }
    if (dateTo) {
      names['#date'] = 'Date';
      values[':dateTo'] = dateTo;
      filterParts.push('#date <= :dateTo');
    }

    const rows: SuiteAppMetricsRecord[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const result = await this.client.send(
        new ScanCommand({
          TableName: env.tables.suiteAppMetrics,
          FilterExpression: filterParts.length ? filterParts.join(' AND ') : undefined,
          ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
          ExpressionAttributeValues: Object.keys(values).length ? values : undefined,
          Limit: 500,
          ExclusiveStartKey: exclusiveStartKey
        })
      );
      rows.push(...((result.Items as SuiteAppMetricsRecord[]) || []));
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return rows;
  }
}
