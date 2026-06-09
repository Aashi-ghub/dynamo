import { Router } from 'express';
import { entityRouter } from './entityRoutes.js';

export const routes = Router();

routes.use('/accounts', entityRouter('accounts'));
routes.use('/contacts', entityRouter('contacts'));
routes.use('/subscriptions', entityRouter('subscriptions'));
routes.use('/cloud-files', entityRouter('cloudFiles'));
