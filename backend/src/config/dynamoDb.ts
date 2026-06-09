import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from './env.js';

const client = new DynamoDBClient({
  region: env.awsRegion,
  endpoint: env.isLocal ? env.dynamoDbEndpoint : undefined,
  credentials: env.isLocal
    ? { accessKeyId: 'local', secretAccessKey: 'local' }
    : undefined
});

export const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  }
});
