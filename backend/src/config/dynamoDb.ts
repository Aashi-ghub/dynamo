import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from './env.js';

const useLocalDynamoEndpoint = Boolean(env.dynamoDbEndpoint);

const client = new DynamoDBClient({
  region: env.awsRegion,
  endpoint: useLocalDynamoEndpoint ? env.dynamoDbEndpoint : undefined,
  credentials: useLocalDynamoEndpoint
    ? { accessKeyId: 'local', secretAccessKey: 'local' }
    : undefined
});

export const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  }
});
