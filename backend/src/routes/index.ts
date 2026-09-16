import { Router } from 'express';
import { entityRouter } from './entityRoutes.js';
import { suiteAppMetricsRouter } from './suiteAppMetricsRoutes.js';

export const routes = Router();

routes.use('/accounts', entityRouter('accounts'));
routes.use('/contacts', entityRouter('contacts'));
routes.use('/subscriptions', entityRouter('subscriptions'));
routes.use('/cloud-files', entityRouter('cloudFiles'));
routes.use('/suiteapp-metrics', suiteAppMetricsRouter());
