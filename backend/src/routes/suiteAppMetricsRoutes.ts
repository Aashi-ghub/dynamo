import { Router } from 'express';
import { suiteAppMetricsController } from '../controllers/suiteAppMetricsController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const suiteAppMetricsRouter = () => {
  const router = Router();

  router.get('/', asyncHandler(suiteAppMetricsController.list));
  router.get('/:accountIdProductCode', asyncHandler(suiteAppMetricsController.get));

  return router;
};
