import type { RequestHandler } from 'express';
import type { ApiRequest } from '../types/api.js';
import { logger } from '../utils/logger.js';

export const logRequest: RequestHandler = (req, res, next) => {
  const apiReq = req as ApiRequest;
  res.on('finish', () => {
    if (res.statusCode >= 400) return;
    logger.info('request_completed', {
      requestId: apiReq.context.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode
    });
  });
  next();
};
