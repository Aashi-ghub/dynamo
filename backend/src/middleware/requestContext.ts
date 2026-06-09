import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import type { ApiRequest } from '../types/api.js';

export const requestContext: RequestHandler = (req, res, next) => {
  const apiReq = req as ApiRequest;
  const requestId = req.header('x-request-id') || randomUUID();
  apiReq.context = { requestId };
  res.setHeader('x-request-id', requestId);
  next();
};
