import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, `Route ${req.method} ${req.path} not found`));
};

export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
  const requestId = res.getHeader('x-request-id');
  const appError = error instanceof AppError ? error : new AppError(500, 'Internal server error');

  if (appError.statusCode >= 500) {
    logger.error(appError.message, {
      requestId,
      path: req.path,
      method: req.method,
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  res.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    ...(appError.errors.length ? { errors: appError.errors } : {})
  });
};
