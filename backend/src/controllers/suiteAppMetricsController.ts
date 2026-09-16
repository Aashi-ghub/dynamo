import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { dynamoDb } from '../config/dynamoDb.js';
import { SuiteAppMetricsRepository } from '../repositories/suiteAppMetricsRepository.js';
import { badRequest, notFound } from '../utils/errors.js';
import { listSuccess, success } from '../utils/response.js';

const repository = new SuiteAppMetricsRepository(dynamoDb);

const parsePageSize = (raw: unknown) => {
  if (raw === undefined) return env.defaultPageSize;
  const pageSize = Number(raw);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > env.maxPageSize) {
    throw badRequest('Validation failed', [
      { field: 'pageSize', message: `pageSize must be an integer between 1 and ${env.maxPageSize}` }
    ]);
  }
  return pageSize;
};

const asString = (raw: unknown) => (typeof raw === 'string' && raw.trim() ? raw.trim() : undefined);

export const suiteAppMetricsController = {
  list: async (req: Request, res: Response) => {
    const query = {
      pageSize: parsePageSize(req.query.pageSize),
      nextToken: asString(req.query.nextToken),
      accountId: asString(req.query.accountId),
      productCode: asString(req.query.productCode),
      dateFrom: asString(req.query.dateFrom),
      dateTo: asString(req.query.dateTo)
    };
    const result = await repository.list(query);
    listSuccess(res, result.items, query.pageSize, result.nextToken, result.total);
  },
  get: async (req: Request, res: Response) => {
    const accountIdProductCode = decodeURIComponent(String(req.params.accountIdProductCode));
    const date = asString(req.query.date);
    if (!date) {
      throw badRequest('Validation failed', [{ field: 'date', message: 'date query param is required' }]);
    }
    const record = await repository.getByKey(accountIdProductCode, date);
    if (!record) throw notFound();
    success(res, record);
  }
};
