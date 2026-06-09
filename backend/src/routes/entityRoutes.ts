import { Router } from 'express';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { EntityName } from '../types/api.js';
import { createEntityController } from '../controllers/entityController.js';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

export const entityRouter = (entityName: EntityName) => {
  const router = Router();
  const controller = createEntityController(entityName);

  router.get('/', asyncHandler(controller.list as never));
  router.get('/:id', asyncHandler(controller.get as never));
  router.post('/', asyncHandler(controller.create as never));
  router.put('/:id', asyncHandler(controller.update as never));
  router.delete('/:id', asyncHandler(controller.delete as never));

  return router;
};
