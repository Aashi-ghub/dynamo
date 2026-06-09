import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { configure } from '@codegenie/serverless-express';
import { app } from './app.js';

export const handler: APIGatewayProxyHandlerV2 = configure({ app });
