import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

app.listen(env.port, () => {
  logger.info('local_api_started', {
    port: env.port,
    appEnv: env.appEnv,
    dynamoDbEndpoint: env.dynamoDbEndpoint
  });
});
