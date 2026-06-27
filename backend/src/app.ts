import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logRequest } from './middleware/logging.js';
import { requestContext } from './middleware/requestContext.js';
import { routes } from './routes/index.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.allowedOrigins.length ? env.allowedOrigins : true,
      credentials: true
    })
  );
  app.options('*', cors({
    origin: env.allowedOrigins.length ? env.allowedOrigins : true,
    credentials: true
  }));
  app.use(express.json({ limit: '256kb' }));
  app.use(requestContext);
  app.use(logRequest);

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });

  app.use(authenticate);
  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();

export default app;
